export type Comment = { text: string; username: string | null };
export type Img = { file: string; width: number | null; height: number | null };
export type Exif = { camera?: string; lat?: number; lng?: number; taken?: string };

export type Post = {
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

export const USERNAME = "mobob";
export const HASHTAG = "thepercytree";

export const imgUrl = (file: string) => `/img/${file}`;
export const coverImg = (p: Post) => imgUrl(p.images[0].file);

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

// #thepercytree links back to the hashtag/search screen; other tags/mentions are styled only.
export const linkify = (s: string) =>
  // (?<![&\w]) so we don't match the "#39" inside an escaped entity like &#39;
  esc(s).replace(/(?<![&\w])[#@][\w.]+/g, (tok) =>
    tok.toLowerCase() === `#${HASHTAG}`
      ? `<a class="tag" href="#/ig">${tok}</a>`
      : `<span class="tag">${tok}</span>`
  );

export const longDate = (iso: string) =>
  new Date(iso + "T00:00:00Z")
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
