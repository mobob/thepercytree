/**
 * ingest-export.ts — merge three sources of #thepercytree into one lossless dataset.
 *
 *   1. source/raw-export/posts_1.json        official IG export: captions, HD media, all posts → 2023
 *   2. source/raw-export/insights-posts.json  per-post Likes/Comments/Saves + EXIF (gps/camera)
 *   3. source/thepercytree.json               2017 scrape: comment THREADS, shortcodes, named locations
 *
 * Join: export is the spine (one entry per post). Insights attach by image URI. The scrape
 * attaches by nearest timestamp (≤3 days) to recover threads/shortcodes/locations. Scrape
 * posts with no export match are kept as archive-only (additive — nothing is dropped).
 *
 * Writes: src/data/posts.json  (chronological, carousel-aware, with provenance)
 *         public/img/*         (HD where available, 640px scrape for archive-only)
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = join(import.meta.dir, "..");
const p = (...x: string[]) => join(ROOT, ...x);

// IG double-encodes UTF-8 as latin-1 then JSON-escapes it; reverse to get real text/emoji.
const fixText = (s: string): string => {
  if (!s) return s;
  try {
    return Buffer.from(s, "latin1").toString("utf8");
  } catch {
    return s;
  }
};

type Img = { file: string; width: number | null; height: number | null };
type Comment = { text: string; username: string | null };
type Exif = { camera?: string; lat?: number; lng?: number; taken?: string };
type Post = {
  id: string;
  shortcode: string | null;
  username: string;
  date: string;
  timestamp: number;
  images: Img[];
  likes: number | null;
  comments_count: number | null;
  saves: number | null;
  comments: Comment[];
  caption: string;
  location: string | null;
  exif: Exif | null;
  sources: string[];
};

// Manual backfills for posts the export/insights can't supply (read off live IG by Bob).
// Keyed by post id. Applied after the merge; survives re-runs.
const OVERRIDES: Record<string, Partial<{ likes: number; comments_count: number }>> = {
  t1684510622: { likes: 119, comments_count: 37 }, // 2023-05-19 finale carousel (no insights record)
};

const isoDate = (ts: number) => new Date(ts * 1000).toISOString().slice(0, 10);
const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : null;
};

// ---- 1. EXPORT (spine) ---------------------------------------------------
type ExpMedia = { uri: string; title?: string; creation_timestamp?: number; media_metadata?: any };
type ExpPost = { title?: string; creation_timestamp?: number; media: ExpMedia[] };

const rawExport: ExpPost[] = JSON.parse(readFileSync(p("source/raw-export/posts_1.json"), "utf8"));
const captionOf = (post: ExpPost): string => {
  let t = post.title || "";
  if (!t) for (const m of post.media || []) if (m.title) { t = m.title; break; }
  return fixText(t).trim();
};
const mentionsTag = (post: ExpPost): boolean => {
  const blob = (captionOf(post) + " " + (post.media || []).map((m) => m.title || "").join(" ")).toLowerCase();
  return blob.includes("thepercytree");
};

// ---- 2. INSIGHTS (engagement + exif), indexed by image uri ---------------
const insightsRaw = JSON.parse(readFileSync(p("source/raw-export/insights-posts.json"), "utf8"));
const insByUri = new Map<string, any>();
for (const e of insightsRaw.organic_insights_posts ?? []) {
  const thumb = e?.media_map_data?.["Media Thumbnail"];
  if (thumb?.uri) insByUri.set(thumb.uri, e);
}
const exifFrom = (entry: any): Exif | null => {
  const exifArr = entry?.media_map_data?.["Media Thumbnail"]?.media_metadata?.photo_metadata?.exif_data;
  if (!Array.isArray(exifArr)) return null;
  const out: Exif = {};
  for (const row of exifArr) {
    if (row.latitude != null) { out.lat = row.latitude; out.lng = row.longitude; }
    if (row.lens_model) out.camera = row.lens_model;
    if (row.date_time_original) out.taken = row.date_time_original;
  }
  return Object.keys(out).length ? out : null;
};

// ---- 3. SCRAPE (threads/shortcodes/locations), deduped by shortcode ------
// The 2017 scrape grabbed the entire #thepercytree hashtag — including a few
// posts by *other* accounts. Those belong on the hashtag page (it's real history),
// but must be attributed to their author, not Bob. The scrape only gives numeric
// owner ids, so map the known ones to handles by hand.
const MOBOB_OWNER_ID = "435625";
const OWNER_USERNAMES: Record<string, string> = {
  [MOBOB_OWNER_ID]: "mobob",
  // Other #thepercytree posters — real handles unknown from the data; fill in if known.
  "3417835": "instagram_user",
  "2027465871": "instagram_user",
  "297785830": "instagram_user",
};
const ownerName = (id: any) => OWNER_USERNAMES[String(id)] ?? "instagram_user";

const scrapeRaw: any[] = JSON.parse(readFileSync(p("source/thepercytree.json"), "utf8"));
const scrapeSeen = new Set<string>();
const scrape = scrapeRaw.filter((s) => (scrapeSeen.has(s.shortcode) ? false : scrapeSeen.add(s.shortcode)));
type ScrapePost = { post: any; ts: number; used: boolean };
const scrapePool: ScrapePost[] = scrape.map((s) => ({ post: s, ts: s.taken_at_timestamp, used: false }));
const TOL = 3 * 86400; // 3 days
const matchScrape = (ts: number): any | null => {
  let best: ScrapePost | null = null;
  let bestD = Infinity;
  for (const sp of scrapePool) {
    if (sp.used) continue;
    if (String(sp.post.owner?.id) !== MOBOB_OWNER_ID) continue; // never attach others' posts to Bob's
    const d = Math.abs(sp.ts - ts);
    if (d < bestD) { bestD = d; best = sp; }
  }
  if (best && bestD <= TOL) { best.used = true; return best.post; }
  return null;
};
const scrapeComments = (s: any): Comment[] =>
  (s.edge_media_to_comment?.edges ?? []).map((e: any) => ({
    text: e.node.text,
    username: e.node.owner?.username ?? null,
  }));

// ---- BUILD ---------------------------------------------------------------
const hdImages = new Set(readdirSync(p("source/images-hd")));
const posts: Post[] = [];

for (const ep of rawExport) {
  if (!mentionsTag(ep)) continue;
  const ts = ep.creation_timestamp || ep.media?.[0]?.creation_timestamp || 0;
  const ins = ep.media.map((m) => insByUri.get(m.uri)).find(Boolean) ?? null;
  const scr = matchScrape(ts);

  // engagement: prefer insights (platform-final), fall back to the scrape count
  const likes = num(ins?.string_map_data?.["Likes"]?.value) ?? (scr ? num(scr.edge_liked_by?.count) : null);
  const comments_count =
    num(ins?.string_map_data?.["Comments"]?.value) ?? (scr ? num(scr.edge_media_to_comment?.count) : null);
  const saves = num(ins?.string_map_data?.["Saves"]?.value);

  const images: Img[] = ep.media.map((m) => ({
    file: basename(m.uri),
    width: scr?.dimensions?.width ?? null,
    height: scr?.dimensions?.height ?? null,
  }));

  const sources = ["export"];
  if (ins) sources.push("insights");
  if (scr) sources.push("archive");

  posts.push({
    id: scr?.shortcode ?? `t${ts}`,
    shortcode: scr?.shortcode ?? null,
    username: "mobob",
    date: isoDate(ts),
    timestamp: ts,
    images,
    likes,
    comments_count,
    saves,
    comments: scr ? scrapeComments(scr) : [],
    caption: captionOf(ep),
    location: scr?.location?.name ?? null,
    exif: exifFrom(ins),
    sources,
  });
}

// scrape images carry a chronological prefix (00125_..._<token>); resolve by token suffix
const loImages = readdirSync(p("source/images"));
const resolveLo = (url: string): string => {
  const token = basename(url || "");
  return loImages.find((f) => f.endsWith(token)) ?? token;
};

// archive-only posts the export didn't include (deleted from IG, etc.) — keep them
let archiveOnly = 0;
for (const sp of scrapePool) {
  if (sp.used) continue;
  const s = sp.post;
  const ts = s.taken_at_timestamp;
  const file = resolveLo(s.urls?.[0] ?? s.display_url);
  posts.push({
    id: s.shortcode,
    shortcode: s.shortcode,
    username: ownerName(s.owner?.id),
    date: isoDate(ts),
    timestamp: ts,
    images: [{ file, width: s.dimensions?.width ?? null, height: s.dimensions?.height ?? null }],
    likes: num(s.edge_liked_by?.count),
    comments_count: num(s.edge_media_to_comment?.count),
    saves: null,
    comments: scrapeComments(s),
    caption: fixText(s.edge_media_to_caption?.edges?.[0]?.node?.text ?? "").trim(),
    location: s.location?.name ?? null,
    exif: null,
    sources: ["archive"],
  });
  archiveOnly++;
}

// apply manual backfills
for (const post of posts) {
  const o = OVERRIDES[post.id];
  if (!o) continue;
  if (o.likes != null) post.likes = o.likes;
  if (o.comments_count != null) post.comments_count = o.comments_count;
  if (!post.sources.includes("manual")) post.sources.push("manual");
}

posts.sort((a, b) => a.timestamp - b.timestamp);

// ---- copy chosen images into public/img (HD preferred) -------------------
const OUT_IMG = p("public/img");
rmSync(OUT_IMG, { recursive: true, force: true }); // ship only referenced images
mkdirSync(OUT_IMG, { recursive: true });
let copied = 0;
const missing: string[] = [];
for (const post of posts) {
  for (const im of post.images) {
    const hd = p("source/images-hd", im.file);
    const lo = p("source/images", im.file);
    const src = hdImages.has(im.file) && existsSync(hd) ? hd : existsSync(lo) ? lo : null;
    if (src) { copyFileSync(src, join(OUT_IMG, im.file)); copied++; }
    else missing.push(im.file);
  }
}

mkdirSync(p("src/data"), { recursive: true });
writeFileSync(p("src/data/posts.json"), JSON.stringify(posts, null, 2));

const withLikes = posts.filter((p) => p.likes != null).length;
console.log(`✓ ${posts.length} posts → src/data/posts.json`);
console.log(`  ${posts[0].date} → ${posts[posts.length - 1].date}`);
console.log(`  export-matched: ${posts.length - archiveOnly} · archive-only: ${archiveOnly}`);
console.log(`  with likes: ${withLikes} · with exif: ${posts.filter((p) => p.exif).length} · carousels: ${posts.filter((p) => p.images.length > 1).length}`);
console.log(`  images copied: ${copied}${missing.length ? ` · ⚠ missing ${missing.length}: ${missing.slice(0, 5).join(", ")}` : ""}`);
