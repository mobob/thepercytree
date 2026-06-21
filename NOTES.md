# hashthepercytree — project notes

A mostly-static web art piece: a faithful recreation of the **#thepercytree** Instagram
experience (~2016 era) from my own archived posts. Sibling of `../personal-site/personal-site`.

## The content (refreshed from official export, 2026-06-13)
- My hashtag project **#thepercytree**, all posts by me (mobob). Project ran **2015 → 2023**.
- **183 posts** total, **2015-04-09 → 2023-05-19**. Mostly square; 1 three-image carousel (finale).
- Built by merging THREE sources, each carrying something unique (`scripts/ingest-export.ts`):
  - **IG export** (`source/raw-export/posts_1.json`) — authoritative captions (emoji fixed via
    latin-1→utf-8), HD media (1440px), every post through 2023. The spine.
  - **IG insights** (`source/raw-export/insights-posts.json`) — per-post Likes/Comments/Saves +
    EXIF (gps, camera, capture-time). Joins by image URI. Covers 179/180.
  - **2017 scrape** (`source/thepercytree.json`) — shortcodes, named locations, comment counts.
    Joins by nearest timestamp (≤3 days). Scrape only ever had comment *counts*, never text.
- Counts: 180 export-matched · 3 archive-only (deleted from IG, kept anyway) · 179 with likes ·
  30 with EXIF. Finale carousel lacks an insights match (likes null) — backfill TODO.

## Frozen source (self-contained, in repo)
- `source/raw-export/` — export `posts_1.json` + `insights-posts.json` (committed; small).
- `source/images-hd/` — **182 HD images** (1440px) from the export (gitignored; masters).
- `source/images/` — 134 original 640px scrape images (gitignored; used for 3 archive-only posts).
- `source/thepercytree.json` — the 2017 scrape metadata (committed).
- `public/img/` — 185 shipped images (HD where available). Rebuilt fresh each ingest.
- The two export zips live in `~/Downloads/instagram-mobob-2026-06-13-*.zip` (NOT a dependency —
  raw inputs are frozen into source/). Old scraper at `~/Documents/Development/instagram scraper work/`.

## Decisions (locked)
- **Era:** 2016–17 gradient-logo Instagram (flat, white, thin icons). Faithful.
- **Surface flow:** Grid first (#thepercytree hashtag page, 3-col thumbnails) → tap → Feed
  (one post at a time: header, square photo, action row, likes, caption, comments, timestamp).
- **Device frame:** era-correct iPhone (6/SE-ish, 2016) bezel + status bar. Toggleable.
- **Three independent knobs:** Surface (grid/feed) · Chrome (IG UI on/off) · Device frame (on/off).

## Phase 2 / nice-to-haves
- **Home-screen launcher:** land on an old iPhone home screen, tap the Instagram app icon →
  app "opens" to the grid. The framing device for the whole piece.
- Layer in light nav once we're playing with it.

## Stack (locked) — deliberately light
- **Vite + vanilla TypeScript + plain CSS. No React, no Tailwind, no router.**
  Astro/React earn nothing here (one interactive island); plain CSS gives pixel control.
- State = `#app` data-attrs (`data-view` / `data-chrome` / `data-frame`); routing = URL hash.
- `bun run data` (join) · `bun run dev` · `bun run build`. Build ≈ 36KB JS / 10KB gzip.

## Project layout
- `source/` — frozen archive of record (images gitignored, json committed).
- `scripts/ingest-export.ts` — merge export+insights+scrape → `src/data/posts.json` + `public/img`.
  (`scripts/build-data.ts.superseded` = old scrape-only joiner, kept for reference.)
- `src/data/posts.json` model: `{id, shortcode?, date, timestamp, images[], likes?, comments_count?,
  saves?, comments[], caption, location?, exif?, sources[]}`. Carousel-aware (images is an array).
- `public/img/` — 134 images served at `/img/<file>` (the shipped copy).
- `public/fonts/grand-hotel.woff2` — self-hosted IG-wordmark stand-in.
- `src/main.ts` — orchestrator: route parse, shell (device/statusbar), index switch, toggles.
- `src/types.ts` — Post type + shared helpers (esc/linkify/longDate/imgUrl).
- `src/icons.ts` — 2016 thin-line SVG glyphs.
- `src/views/ig.ts` — IG index (grid + feed + functional tab bar).
- `src/views/blend.ts` — blend index (full-frame scroll-crossfade).
- `src/style.css` — all styling, state via `#app` data-attrs.

## Architecture: indexes
The raw images are the substrate; each **index** is one lens over them. IG recreation is one
index; blend (full-frame scroll-crossfade) is another. Add more later (timeline, map, mosaic).
Routes: `#/ig`, `#/ig/feed`, `#/ig/p/<sc>`, `#/blend`. Switcher in the toolbar.

## Built so far (v0 — works)
- Grid (hashtag page header + 3-col) → tap → feed (full IG post cards), hash-routed.
- Three working toggles: chrome on/off, device frame on/off.
- ✅ Data join verified 1:1 (134/134). ✅ Prod build clean. ✅ Dev server + images serve.

## Next — see TODO.md
Full checklist lives in **TODO.md** (data refresh, logo/wordmark, icons, status bar, card
fidelity, frame, Phase 2 launcher).

## Data refresh (decided)
- The 2017 `rarcega/instagram-scraper` v1.5.3 is dead (IG killed public hashtag endpoints;
  project abandoned). NOT re-running it.
- Path chosen: **official IG "Download Your Information" export** (JSON, all content). Bob
  triggers it; we ingest via `scripts/ingest-export.ts` (filter #thepercytree, dedupe vs the
  134, copy new media, re-join). Additive — current archive is the floor.
