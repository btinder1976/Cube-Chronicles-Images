#!/usr/bin/env node
/**
 * SEO + structured-data sanity check over prerendered HTML in dist/.
 * For each page: exactly one <title>, a meta description, a canonical link,
 * exactly one <h1>, and every application/ld+json block parses as valid JSON.
 * Also validates sitemap.xml and robots.txt exist and are well-formed enough.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
let failures = 0;
const fail = (msg) => { failures++; console.error('✗ ' + msg); };

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = await walk(DIST);
for (const file of pages) {
  const rel = path.relative(DIST, file);
  const html = await fs.readFile(file, 'utf8');

  const titles = html.match(/<title>[\s\S]*?<\/title>/g) || [];
  if (titles.length !== 1) fail(`${rel}: expected 1 <title>, found ${titles.length}`);

  if (!/<meta\s+name="description"\s+content="[^"]+"/.test(html))
    fail(`${rel}: missing meta description`);

  if (!/<link\s+rel="canonical"\s+href="https?:\/\/[^"]+"/.test(html))
    fail(`${rel}: missing canonical link`);

  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) fail(`${rel}: expected 1 <h1>, found ${h1s.length}`);

  const jsonld = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const block of jsonld) {
    const inner = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    try { JSON.parse(inner); } catch (e) { fail(`${rel}: invalid JSON-LD (${e.message})`); }
  }
}

// robots + sitemap
if (!(await fs.readFile(path.join(DIST, 'robots.txt'), 'utf8').catch(() => '')).includes('Sitemap:'))
  fail('robots.txt missing or has no Sitemap directive');
const sitemap = await fs.readFile(path.join(DIST, 'sitemap.xml'), 'utf8').catch(() => '');
if (!sitemap.includes('<urlset')) fail('sitemap.xml missing or malformed');
const locs = (sitemap.match(/<loc>/g) || []).length;
console.log(`Checked ${pages.length} prerendered pages; sitemap has ${locs} URLs.`);

if (failures > 0) { console.error(`✗ ${failures} SEO check failure(s).`); process.exit(1); }
console.log('✓ SEO checks passed.');
