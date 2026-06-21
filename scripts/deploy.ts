#!/usr/bin/env bun
/**
 * Build the site and publish it to S3 + CloudFront.
 *
 * Runs the same locally (`bun run deploy`) and in CI. Credentials come from
 * the ambient AWS environment: your SSO/profile locally, the assumed OIDC
 * role in GitHub Actions. This script never handles secrets.
 *
 * Config via environment variables (CI sets them from repo variables):
 *   DEPLOY_BUCKET            S3 bucket name        (default: bobd-tech-site)
 *   DEPLOY_DISTRIBUTION_ID   CloudFront dist id    (required for invalidation)
 *   AWS_REGION               bucket region         (default: ca-central-1)
 *   DEPLOY_DIST              build output dir       (default: dist)
 *   SKIP_BUILD=1             reuse existing dist/   (optional)
 */
import { $ } from 'bun';
import { existsSync } from 'node:fs';

const BUCKET = process.env.DEPLOY_BUCKET;
const DISTRIBUTION_ID = process.env.DEPLOY_DISTRIBUTION_ID;
const REGION = process.env.AWS_REGION ?? 'ca-central-1';
const DIST = process.env.DEPLOY_DIST ?? 'dist';

if (!BUCKET) {
  console.error(
    '✗ DEPLOY_BUCKET is required (the target S3 bucket, e.g. bobd-tech-site).',
  );
  process.exit(1);
}

$.throws(true);

function log(msg: string) {
  console.log(`\x1b[36m▸\x1b[0m ${msg}`);
}

// 1. Build (unless reusing an existing dist/).
if (process.env.SKIP_BUILD === '1') {
  log('SKIP_BUILD=1 — reusing existing dist/');
} else {
  log('Building site (bun run build)…');
  await $`bun run build`;
}

if (!existsSync(DIST)) {
  console.error(`✗ ${DIST}/ not found — build must have failed.`);
  process.exit(1);
}

const s3 = (args: string[]) => $`aws s3 ${args} --region ${REGION}`;

// Content-hashed asset dirs get immutable caching; everything else must
// revalidate. Defaults cover Astro (_astro) and Vite (assets); override with
// DEPLOY_IMMUTABLE_DIRS (comma-separated). Dirs not present are skipped.
const immutableDirs = (process.env.DEPLOY_IMMUTABLE_DIRS ?? '_astro,assets')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean)
  .filter((d) => existsSync(`${DIST}/${d}`));

// 2a. Hashed, immutable assets: cache forever.
for (const dir of immutableDirs) {
  log(`Syncing immutable assets (/${dir})…`);
  await s3([
    'sync',
    `${DIST}/${dir}`,
    `s3://${BUCKET}/${dir}`,
    '--delete',
    '--cache-control',
    'public,max-age=31536000,immutable',
  ]);
}

// 2b. Everything else (HTML, feeds, images, favicon): must be revalidated so
//     edits go live after each deploy + invalidation.
log('Syncing pages and assets (short cache)…');
await s3([
  'sync',
  `${DIST}`,
  `s3://${BUCKET}`,
  '--delete',
  ...immutableDirs.flatMap((d) => ['--exclude', `${d}/*`]),
  '--cache-control',
  'public,max-age=0,must-revalidate',
]);

// 3. Invalidate the CDN so mutable content updates immediately.
if (DISTRIBUTION_ID) {
  log(`Invalidating CloudFront (${DISTRIBUTION_ID})…`);
  await $`aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*" --region ${REGION}`;
} else {
  console.warn(
    '⚠ DEPLOY_DISTRIBUTION_ID not set — skipped CDN invalidation. New HTML may be stale until the cache expires.',
  );
}

log('Deploy complete.');
