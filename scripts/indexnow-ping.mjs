/* eslint-disable no-console -- a CLI that reports to the deploy log */
// Tells IndexNow (Bing, Yandex, Seznam, Naver…) which developers.woovi.com URLs
// changed in this deploy. Bing's index is what ChatGPT Search and Copilot answer
// from, and it otherwise recrawls on its own schedule.
//
// Reads the sitemaps this build wrote (build/sitemap.xml and build/en/sitemap.xml),
// not the live ones, so it can run right after the upload. The sitemap carries
// the date of the last commit of each doc (`lastmod: 'date'`), so only URLs
// modified in the last --days (default 3) are sent; without lastmod (a shallow
// clone) every URL is, which IndexNow accepts but should stay the exception.
//
// The key is public by design: IndexNow proves ownership by fetching
// https://developers.woovi.com/<key>.txt, which ships in static/.
//
// Usage:
//   node scripts/indexnow-ping.mjs              # POST
//   node scripts/indexnow-ping.mjs --dry-run    # print what would be sent
//   node scripts/indexnow-ping.mjs --days 7
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HOST = 'developers.woovi.com';
const KEY = 'ec63fde589027b90fe58d35752cd7241';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
// IndexNow accepts up to 10,000 URLs per request.
const BATCH = 10000;

const root = join(import.meta.dirname, '..');
const buildDir = join(root, 'build');
const sitemaps = ['sitemap.xml', 'en/sitemap.xml'].map((file) =>
  join(buildDir, file),
);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const daysIndex = args.indexOf('--days');
const days = daysIndex === -1 ? 3 : Number(args[daysIndex + 1]);

if (!existsSync(join(buildDir, `${KEY}.txt`))) {
  throw new Error(
    `IndexNow key file missing from the build: static/${KEY}.txt`,
  );
}

const entries = sitemaps
  .filter((file) => existsSync(file))
  .flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
      ([, url]) => ({
        loc: /<loc>([^<]+)<\/loc>/.exec(url)?.[1],
        lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(url)?.[1],
      }),
    ),
  )
  .filter(({ loc }) => loc);

const hasLastmod = entries.some(({ lastmod }) => lastmod);
const since = Date.now() - days * 24 * 60 * 60 * 1000;

const urls = entries
  .filter(
    ({ lastmod }) => !hasLastmod || (lastmod && Date.parse(lastmod) >= since),
  )
  .map(({ loc }) => loc);

console.info(
  `[indexnow] ${urls.length} of ${entries.length} URLs`,
  hasLastmod
    ? `(lastmod within ${days} days)`
    : '(no lastmod in the sitemap: sending all)',
);

if (urls.length === 0 || dryRun) {
  for (const url of dryRun ? urls : []) {
    console.info(url);
  }

  process.exit(0);
}

for (let start = 0; start < urls.length; start += BATCH) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls.slice(start, start + BATCH),
    }),
  });

  // 200 and 202 are both success; anything else must not fail the deploy, the
  // site is already live, so report it and move on.
  console.info(
    `[indexnow] batch ${start / BATCH + 1}: HTTP ${response.status}`,
  );

  if (!response.ok) {
    console.error(await response.text());
  }
}
