/**
 * ig.ts — the Instagram-recreation index: hashtag grid + scrolling feed, 2016 chrome.
 * One "index" over the image set; the shell (device frame, status bar) lives in main.ts.
 */
import { icons } from "../icons";
import { type Post, USERNAME, HASHTAG, coverImg, imgUrl, esc, linkify, longDate } from "../types";

export type IgView = "grid" | "feed";

function gridView(posts: Post[]): string {
  const cells = posts
    .map(
      (p) => `
      <a class="cell${p.images.length > 1 ? " multi" : ""}" href="#/ig/p/${p.id}" aria-label="${p.date}">
        <img loading="lazy" src="${coverImg(p)}" alt="${esc(p.caption).slice(0, 80)}" />
      </a>`
    )
    .join("");
  return `
    <header class="hashtag-head">
      <div class="hashtag-icon">#</div>
      <div class="hashtag-meta">
        <h1>#${HASHTAG}</h1>
        <div class="count"><strong>${posts.length}</strong> posts</div>
      </div>
    </header>
    <div class="grid">${cells}</div>`;
}

function postCard(p: Post): string {
  const comments = p.comments
    .map(
      (c) =>
        `<div class="c"><span class="cu">${esc(c.username ?? USERNAME)}</span> ${linkify(c.text)}</div>`
    )
    .join("");
  // carousel: stack images side-scrollable; cover first
  const slides = p.images
    .map((im) => `<img loading="lazy" src="${imgUrl(im.file)}" alt="${esc(p.caption).slice(0, 80)}" />`)
    .join("");
  const nav =
    p.images.length > 1
      ? `<button class="carousel-nav prev" aria-label="Previous" hidden>‹</button>
         <button class="carousel-nav next" aria-label="Next">›</button>
         <div class="carousel-dots">${p.images.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>`
      : "";
  const dots = nav;
  return `
    <article class="post" id="post-${p.id}">
      <div class="post-head">
        <div class="avatar"><img src="/avatar.jpg" alt="${USERNAME}" /></div>
        <div class="post-head-meta">
          <span class="u">${USERNAME}</span>
          ${p.location ? `<span class="loc">${esc(p.location)}</span>` : ""}
        </div>
        <button class="dots" aria-label="More">${icons.more}</button>
      </div>
      <div class="photo${p.images.length > 1 ? " carousel" : ""}">${slides}${dots}</div>
      <div class="actions">
        <button class="ic" aria-label="Like">${icons.heart}</button>
        <button class="ic" aria-label="Comment">${icons.comment}</button>
        <button class="ic" aria-label="Share">${icons.share}</button>
        <button class="ic bookmark" aria-label="Save">${icons.bookmark}</button>
      </div>
      ${p.likes != null ? `<div class="likes">${p.likes.toLocaleString()} likes</div>` : ""}
      <div class="caption"><span class="u">${USERNAME}</span> ${linkify(p.caption)}</div>
      ${
        p.comments_count && p.comments_count > p.comments.length
          ? `<div class="view-comments">View all ${p.comments_count.toLocaleString()} comments</div>`
          : ""
      }
      ${comments ? `<div class="comments">${comments}</div>` : ""}
      <time class="ts">${longDate(p.date)}</time>
    </article>`;
}

function feedView(posts: Post[]): string {
  return `<div class="feed">${posts.map(postCard).join("")}</div>`;
}

/** The IG app body: top bar + scroll region + functional bottom tab bar. */
export function renderIgApp(posts: Post[], view: IgView): string {
  const inner = view === "feed" ? feedView(posts) : gridView(posts);
  // tab targets are real in-app routes; profile/search land on the grid, home on the feed
  return `
    <div class="topbar"><span class="brand">Instagram</span></div>
    <div class="scroll">${inner}</div>
    <nav class="tabbar">
      <a class="ic${view === "feed" ? " active" : ""}" href="#/ig/feed" aria-label="Home">${icons.home}</a>
      <a class="ic${view === "grid" ? " active" : ""}" href="#/ig" aria-label="Search">${icons.search}</a>
      <span class="ic inert" aria-label="Camera">${icons.plus}</span>
      <a class="ic" href="#/ig/feed" aria-label="Activity">${icons.activity}</a>
      <a class="me" href="#/ig" aria-label="Profile"><img src="/avatar.jpg" alt="${USERNAME}" /></a>
    </nav>`;
}

export function scrollToPost(id: string) {
  document.getElementById(`post-${id}`)?.scrollIntoView({ block: "start" });
}

/** Wire dot-tracking + prev/next arrows on multi-image posts within `scope`. */
export function initCarousels(scope: ParentNode) {
  scope.querySelectorAll<HTMLElement>(".photo.carousel").forEach((el) => {
    const dots = Array.from(el.querySelectorAll<HTMLElement>(".carousel-dots span"));
    const prev = el.querySelector<HTMLButtonElement>(".carousel-nav.prev");
    const next = el.querySelector<HTMLButtonElement>(".carousel-nav.next");
    const count = dots.length;

    const sync = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      dots.forEach((d, j) => d.classList.toggle("on", j === i));
      if (prev) prev.hidden = i <= 0;
      if (next) next.hidden = i >= count - 1;
    };
    const page = (dir: number) => el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });

    let ticking = false;
    el.addEventListener(
      "scroll",
      () => {
        if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; sync(); }); }
      },
      { passive: true }
    );
    prev?.addEventListener("click", () => page(-1));
    next?.addEventListener("click", () => page(1));

    // mouse drag-to-swipe (touch/trackpad already swipe via native scroll-snap)
    let down = false, startX = 0, startScroll = 0, moved = false;
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      if ((e.target as HTMLElement).closest(".carousel-nav")) return;
      down = true; moved = false; startX = e.clientX; startScroll = el.scrollLeft;
      el.classList.add("dragging");
    });
    el.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = startScroll - dx;
    });
    const end = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      el.classList.remove("dragging");
      // snap to nearest image
      const i = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
      if (moved) { e.preventDefault(); } // swallow the click that follows a drag
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("dragstart", (e) => e.preventDefault()); // no image ghost
    sync();
  });
}
