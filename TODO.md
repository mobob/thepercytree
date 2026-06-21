# #thepercytree — TODO

Faithfulness target: **2016–17 gradient-era Instagram on iPhone 6/SE**.
Legend: `[ ]` open · `[~]` in progress · `[x]` done

## Data
- [x] **Refresh from official IG export** (2 zip parts in ~/Downloads). Merged 3 sources via
      `scripts/ingest-export.ts`: export (captions+HD media) + insights (Likes/Comments/Saves+EXIF)
      + 2017 scrape (shortcodes, locations). **183 posts, 2015-04-09 → 2023-05-19** (was 134/2018!).
      180 export-matched · 3 archive-only · 179 with likes · 30 with EXIF · 1 carousel.
      Raw inputs frozen in `source/raw-export/` + `source/images-hd/` (no zip dependency).
- [x] Confirmed: scrape only ever had comment *counts*, never text → no threads lost.
      Comment counts present for 65 posts ("View all N comments").
- [~] **Finale post (2023-05-19, 3-img carousel) has no insights record** → likes null.
      Confirmed NOT in insights (no uri match, nothing within 5 days). Not recoverable from the
      export — Bob can read the count off live IG and we hardcode it if wanted.
- [x] **Avatar:** profile pic recovered from export (`media/other/18105650134028156.jpg`, 2019,
      1080²) → `public/avatar.jpg`; used in post header + profile tab.
- [x] **Carousel swipe on web:** mouse drag-to-swipe added (touch/trackpad already native).
- [ ] **Comments text — NOT recoverable.** IG's export does not include other people's comments
      on your posts (only Bob's own comments, which have empty post-uris and can't be attributed).
      We have comment *counts* only (insights/scrape). Showing "View all N comments" is the ceiling
      unless we re-scrape live (fragile) or Bob screenshots threads he wants preserved.
- [ ] Eyeball posts tagged to the tree without the literal hashtag (currently filter = caption
      contains "thepercytree"; a few early ones might be captioned differently).
- [ ] **Highest-fidelity media:** export images are 1440×1440 (was 640). Bob has originals on
      iPhone — may be higher-res still. Source full-res masters (AirDrop/Photos export/iCloud),
      match by EXIF capture-time (`exif.taken`), prefer largest; flag any stuck at low-res.

## Logo / wordmark  ← needs scrutiny
- [x] Replace system-cursive "Instagram" with self-hosted **Grand Hotel** webfont
      (near-identical free stand-in for IG's 2016 Billabong script). `public/fonts/grand-hotel.woff2`.
- [ ] Verify Grand Hotel vs real Billabong weight/size/letterspacing; tweak `.brand` to match.
- [ ] Camera glyph next to/above the wordmark? (2016 top bar = centered wordmark only; the
      camera/IGTV icons came later — verify and keep it period-correct.)
- [ ] Hashtag-page avatar: currently a grey "#" circle. Real IG used a generated tile — decide
      faithful vs. our own mark.

## Icons  ← needs scrutiny (now hand-drawn SVGs in src/icons.ts)
- [x] Replace emoji action row with **2016 thin-line SVGs**: heart, comment, share, bookmark.
- [x] Tab bar: home/search/＋/activity SVGs + gradient profile dot.
- [x] Heart tap → fill red + pop animation; bookmark tap → fill.
- [ ] **Scrutinize the hand-drawn paths** vs real IG glyphs — shapes are approximations
      (heart curve, paper-plane angle, comment bubble tail). Refine or swap for traced paths.
- [x] "···" overflow dots as SVG (verify weight/position).

## Status bar (only shows with frame)
- [ ] Real iOS-9/10 glyphs: signal dots, carrier text, wifi/LTE, time centered?, battery shape.
- [ ] Era choice: iOS 9/10 styling to match 2016.

## Post card fidelity
- [ ] Exact spacing/typography (14px body, 600 weights, line-heights, paddings).
- [ ] "**N likes**" + "liked by X and others" line styling.
- [ ] Caption: username bold inline, "... more" truncation, #hashtag + @mention link color (#3f729b ✓).
- [ ] Comments: "View all N comments" affordance; timestamp per comment.
- [ ] Timestamp: decide **absolute date** ("APRIL 9, 2015", current) vs IG-relative ("2y").
- [ ] Double-tap-to-like on the photo.

## Index architecture (multiple lenses over the raw images)
- [x] Refactor into an **index layer**: each index = one view over the same `posts`.
      `src/views/ig.ts` (IG recreation) + `src/views/blend.ts` (full-frame scroll-crossfade).
      Switcher in toolbar (IG / blend); routes namespaced `#/ig...`, `#/blend`.
- [ ] Future indexes to consider: timeline/calendar, map (by location), color/mosaic,
      contact-sheet, slideshow. (raw images are the substrate; IG is just one lens.)

## Blend index (new)
- [x] Full-frame scroll crossfade between consecutive images (scrollTop-driven, sticky stage).
- [ ] Tune the blend: easing curve, subtle scale, maybe mix-blend modes / duration per image.
- [ ] Keyboard / arrow nav + click-to-advance; respect reduced-motion.
- [ ] Preload adjacent images to avoid fade-in pop on first view.

## Grid / hashtag page
- [x] **Working in-app nav**: tab bar routes (home→feed, search/profile→grid, camera→blend);
      grid cells → feed@post; grid↩ back. Active tab highlighted.
- [ ] Header layout vs real IG hashtag page (top posts / recent tabs? follow button?).
- [ ] 3-col 2px gutters ✓ — verify against real pixel grid.

## Device frame
- [ ] Make the bezel era-correct iPhone 6/SE (home button, proportions) rather than generic.
- [ ] Home indicator vs home button (6/SE = button).

## Phase 2
- [ ] **Home-screen launcher**: iOS springboard with app icons; tap Instagram → "opens" to grid.
- [ ] Light nav / about-this-project surface.
- [ ] Deploy alongside personal-site.

## Polish / infra
- [ ] Image optimization (resize/strip) — currently shipping originals.
- [ ] `bun run data` wired into build ✓.
