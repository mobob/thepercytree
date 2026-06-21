/**
 * blend.ts — full-frame "index" over the raw images. Scrolling crossfades one image into
 * the next. The stage is pinned (sticky) while a tall spacer provides the scroll range, so
 * the fade is driven purely by scrollTop — no scroll-timeline dependency, works everywhere.
 */
import { type Post, coverImg, esc } from "../types";

export function renderBlend(posts: Post[]): string {
  const layers = posts
    .map(
      (p, i) =>
        `<img class="bl" data-i="${i}" style="z-index:${i + 1}" src="${coverImg(p)}" alt="${esc(
          p.caption
        ).slice(0, 60)}" />`
    )
    .join("");
  return `
    <div class="blend">
      <div class="blend-stage">${layers}</div>
      <div class="blend-spacer" style="height:${posts.length * 100}vh"></div>
      <div class="blend-counter"><span class="bc-now">1</span>/${posts.length}</div>
      <div class="blend-scrub" role="slider" aria-label="Scrub photos" tabindex="0">
        <div class="blend-scrub-fill"></div>
        <div class="blend-scrub-handle"></div>
      </div>
    </div>`;
}

export function initBlend(root: HTMLElement) {
  const layers = Array.from(root.querySelectorAll<HTMLImageElement>(".bl"));
  const counter = root.querySelector<HTMLElement>(".bc-now");
  const scrub = root.querySelector<HTMLElement>(".blend-scrub");
  const fill = root.querySelector<HTMLElement>(".blend-scrub-fill");
  const handle = root.querySelector<HTMLElement>(".blend-scrub-handle");
  const n = layers.length;
  if (!n) return;
  const maxProg = Math.max(1, n - 1);

  let ticking = false;
  const paint = () => {
    ticking = false;
    const vh = root.clientHeight || window.innerHeight;
    const progress = Math.max(0, Math.min(root.scrollTop / vh, n - 1)); // 0 .. n-1
    const base = Math.floor(progress);
    const frac = progress - base; // 0 → at `base`, 1 → fully on `base+1`

    for (let i = 0; i < n; i++) {
      let o = 0;
      let scale = 1;
      if (i < base) o = 0; // already passed
      else if (i === base) {
        o = 1; // current, fades under the incoming one
      } else if (i === base + 1) {
        o = frac; // incoming fades in on top
        scale = 1.04 - 0.04 * frac; // subtle settle
      }
      layers[i].style.opacity = String(o);
      layers[i].style.transform = `scale(${scale})`;
    }
    if (counter) counter.textContent = String(Math.round(progress) + 1);
    const pct = (progress / maxProg) * 100;
    if (fill) fill.style.width = `${pct}%`;
    if (handle) handle.style.left = `${pct}%`;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(paint);
    }
  };
  root.addEventListener("scroll", onScroll, { passive: true });

  // scrubber: drag (or click) anywhere on the track to jump
  if (scrub) {
    const vh = () => root.clientHeight || window.innerHeight;
    const seekTo = (clientX: number) => {
      const r = scrub.getBoundingClientRect();
      const f = Math.max(0, Math.min((clientX - r.left) / r.width, 1));
      root.scrollTop = f * maxProg * vh();
    };
    let dragging = false;
    scrub.addEventListener("pointerdown", (e) => {
      dragging = true;
      scrub.setPointerCapture(e.pointerId);
      scrub.classList.add("dragging");
      seekTo(e.clientX);
      e.preventDefault();
    });
    scrub.addEventListener("pointermove", (e) => dragging && seekTo(e.clientX));
    const stop = () => { dragging = false; scrub.classList.remove("dragging"); };
    scrub.addEventListener("pointerup", stop);
    scrub.addEventListener("pointercancel", stop);
    scrub.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") root.scrollTop -= vh();
      else if (e.key === "ArrowRight") root.scrollTop += vh();
    });
  }

  paint();
}
