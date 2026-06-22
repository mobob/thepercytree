#!/usr/bin/env bun
/**
 * thumbs.ts — generate small grid thumbnails from the shipped images.
 *
 * The hashtag grid shows ~125px cells but the full images are 1080–1440px, so it
 * downloads ~8× more bytes than it can show. This makes 400px JPEGs (retina-safe
 * for the cells) under public/img/thumb/, which the grid view loads instead.
 * The feed and blend keep the full-resolution images.
 *
 * Runs locally (uses macOS `sips`, no deps); thumbnails are committed, so CI only
 * needs `vite build`. Re-run after `bun run data` (chained in package.json).
 */
import { $ } from "bun";
import { readdirSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const SRC = "public/img";
const OUT = "public/img/thumb";
const SIZE = 400; // longest side, px
const QUALITY = 65;

try {
  await $`which sips`.quiet();
} catch {
  console.error("✗ `sips` not found — thumbnails need macOS. Skipping.");
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SRC).filter((f) => f.toLowerCase().endsWith(".jpg"));
let n = 0;
for (const f of files) {
  await $`sips -s format jpeg -s formatOptions ${QUALITY} -Z ${SIZE} ${join(SRC, f)} --out ${join(OUT, f)}`.quiet();
  n++;
}
console.log(`✓ ${n} thumbnails → ${OUT} (${SIZE}px, q${QUALITY})`);
