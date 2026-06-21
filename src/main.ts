import "./style.css";
import postsData from "./data/posts.json";
import { type Post } from "./types";
import { renderIgApp, scrollToPost, initCarousels, type IgView } from "./views/ig";
import { status } from "./icons";
import { renderBlend, initBlend } from "./views/blend";

const posts = postsData as Post[];
const app = document.getElementById("app")!;

type Route =
  | { index: "ig"; view: IgView; post?: string }
  | { index: "blend" };

function parse(): Route {
  const seg = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (seg[0] === "blend") return { index: "blend" };
  if (seg[0] === "ig" && seg[1] === "p" && seg[2]) return { index: "ig", view: "feed", post: seg[2] };
  if (seg[0] === "ig" && seg[1] === "feed") return { index: "ig", view: "feed" };
  return { index: "ig", view: "grid" };
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
  return `<div class="toolbar">${seg}${igControls}</div>`;
}

function render() {
  const r = parse();
  app.dataset.index = r.index;

  if (r.index === "blend") {
    app.dataset.view = "blend";
    app.innerHTML = renderBlend(posts) + toolbar(r);
    initBlend(app.querySelector<HTMLElement>(".blend")!);
    return;
  }

  app.dataset.view = r.view;
  app.innerHTML = `
    <div class="device">
      ${statusbar()}
      <div class="app">${renderIgApp(posts, r.view)}</div>
    </div>${toolbar(r)}`;

  initCarousels(app);
  if (r.post) scrollToPost(r.post);
  else app.querySelector(".scroll")?.scrollTo(0, 0);
}

// chrome/frame toggles (IG only); tap-to-fill on like + save
app.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

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
render();
