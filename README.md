# thepercytree

A faithful recreation of **#thepercytree** — a long-running Instagram hashtag
art project (2015–2023, gradient era) — rebuilt from my own archived posts as a
small digital-garden piece.

It's an Instagram experience frozen in ~2016: a hashtag grid, a scrolling feed,
era-correct iPhone chrome, and alternate "indexes" (lenses) over the same image
set — including a full-frame scroll-crossfade *blend* viewer.

## Stack

Vite + vanilla TypeScript + plain CSS, built with Bun. No framework — the piece
is one interactive island, and plain CSS gives the pixel control needed for
faithful chrome.

## Develop

```sh
bun install
bun run data     # rebuild src/data/posts.json + public/img from frozen source
bun run dev
bun run build
```

See [NOTES.md](./NOTES.md) for architecture, data provenance, and the refresh
pipeline, and [TODO.md](./TODO.md) for the faithfulness checklist.

## License

Dual-licensed — see [LICENSE](./LICENSE):

- **Code** (`src/`, `scripts/`, config) — MIT.
- **Artwork** (the #thepercytree photographs, captions, avatar) —
  [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
  Share and adapt for non-commercial use, with attribution.
