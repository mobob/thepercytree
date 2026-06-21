import "./style.css";
import postsData from "./data/posts.json";
import statementMd from "./statement.md?raw";
import { type Post, esc } from "./types";
import { renderIgApp, scrollToPost, initCarousels, type IgView } from "./views/ig";
import { status } from "./icons";
import { renderBlend, initBlend } from "./views/blend";

const posts = postsData as Post[];
const app = document.getElementById("app")!;

type Route =
  | { index: "home" }
  | { index: "ig"; view: IgView; post?: string }
  | { index: "blend" };

const isMobile = () => matchMedia("(max-width: 700px)").matches;

function parse(): Route {
  const seg = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (seg[0] === "home") return { index: "home" };
  if (seg[0] === "blend") return { index: "blend" };
  if (seg[0] === "ig" && seg[1] === "p" && seg[2]) return { index: "ig", view: "feed", post: seg[2] };
  if (seg[0] === "ig" && seg[1] === "feed") return { index: "ig", view: "feed" };
  return { index: "ig", view: "grid" };
}

/** iPhone springboard: apps in a top-left 4-column grid over a wallpaper. Mobile lands here. */
function renderHome(): string {
  return `
    <div class="springboard">
      <div class="apps">
        <a class="appicon" href="#/ig" aria-label="Open Instagram">
          <span class="ico"><img src="/favicon.svg" alt="" /></span>
          <span class="label">Instagram</span>
        </a>
        <a class="appicon" href="#/blend" aria-label="Open blend">
          <span class="ico"><img src="/icon-blend.svg" alt="" /></span>
          <span class="label">blend</span>
        </a>
        <button class="appicon" data-statement aria-haspopup="dialog" aria-label="Open Settings">
          <span class="ico"><img src="/icon-settings.svg" alt="" /></span>
          <span class="label">Settings</span>
        </button>
      </div>
    </div>`;
}

/** The device's physical home button, in a black chin (mobile only; CSS-hidden on desktop). */
function deviceChin(): string {
  return `<div class="device-chin"><button class="home-btn" data-home aria-label="Home"></button></div>`;
}

function statusbar(): string {
  return `
    <div class="statusbar">
      <span class="time">9:41</span>
      <span class="sb-right">${status.signal}<span class="lte">LTE</span>${status.wifi}${status.battery}</span>
    </div>`;
}

function toolbar(r: Route): string {
  const seg = `
    <div class="seg">
      <a href="#/ig" class="${r.index === "ig" ? "on" : ""}">IG</a>
      <a href="#/blend" class="${r.index === "blend" ? "on" : ""}">blend</a>
    </div>`;
  const igControls =
    r.index === "ig"
      ? `<button data-toggle="chrome">chrome</button>
         <button data-toggle="frame">frame</button>
         ${r.view === "feed" ? '<a href="#/ig">↩ grid</a>' : ""}`
      : "";
  return `<div class="toolbar">${seg}${igControls}<button class="about" data-statement aria-haspopup="dialog">about</button></div>`;
}

/** Minimal markdown → HTML for the statement: headings, paragraphs, *em* / **strong**. */
function mdLite(src: string): string {
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  return src
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (b.startsWith("## ")) return `<h2>${inline(b.slice(3))}</h2>`;
      if (b.startsWith("# ")) return `<h1>${inline(b.slice(2))}</h1>`;
      return `<p>${inline(b.replace(/\n/g, " "))}</p>`;
    })
    .join("");
}

/** The artist-statement overlay + a subtle trigger, mounted once outside the routed app. */
function mountStatement() {
  const overlay = document.createElement("div");
  overlay.className = "statement";
  overlay.dataset.open = "false";
  overlay.innerHTML = `
    <div class="statement-card" role="dialog" aria-modal="true" aria-label="Artist statement">
      <button class="statement-close" aria-label="Close">✕</button>
      <div class="statement-body">${mdLite(statementMd)}</div>
    </div>`;
  document.body.append(overlay);

  // desktop opens via the toolbar "about"; mobile opens via the Settings app icon
  const setOpen = (v: boolean) => { overlay.dataset.open = String(v); };
  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-statement]")) { setOpen(true); return; }
    if (t === overlay || t.closest(".statement-close")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

function render() {
  const r = parse();
  app.dataset.index = r.index;

  if (r.index === "blend") {
    app.dataset.view = "blend";
    app.innerHTML = renderBlend(posts) + deviceChin() + toolbar(r);
    initBlend(app.querySelector<HTMLElement>(".blend")!);
    return;
  }

  if (r.index === "home") {
    app.dataset.view = "home";
    app.innerHTML = `
      <div class="device home">
        <div class="app">${renderHome()}</div>
        ${deviceChin()}
      </div>${toolbar(r)}`;
    return;
  }

  app.dataset.view = r.view;
  app.innerHTML = `
    <div class="device">
      ${statusbar()}
      <div class="app">${renderIgApp(posts, r.view)}</div>
      ${deviceChin()}
    </div>${toolbar(r)}`;

  initCarousels(app);
  if (r.post) scrollToPost(r.post);
  else app.querySelector(".scroll")?.scrollTo(0, 0);
}

// chrome/frame toggles (IG only); tap-to-fill on like + save
app.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  if (target.closest("[data-home]")) { location.hash = "#/home"; return; }

  const toggle = target.closest<HTMLElement>("[data-toggle]");
  if (toggle) {
    const key = toggle.dataset.toggle!;
    app.dataset[key] = app.dataset[key] === "on" ? "off" : "on";
    return;
  }

  const like = target.closest<HTMLElement>('.actions .ic[aria-label="Like"]');
  if (like) like.classList.toggle("liked");
  const save = target.closest<HTMLElement>(".actions .bookmark");
  if (save) save.classList.toggle("saved");
});

window.addEventListener("hashchange", render);
mountStatement();
// mobile boots to the iPhone home screen; desktop keeps landing in the app
if (!location.hash && isMobile()) location.hash = "#/home";
render();
