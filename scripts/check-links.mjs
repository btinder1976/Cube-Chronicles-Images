#!/usr/bin/env node
/**
 * Broken-link + asset check over the built static output (dist/).
 * Verifies that internal links and image sources in prerendered HTML resolve
 * to a real file (or a known SSR route). Exits non-zero on any broken link.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

// SSR / dynamic routes that won't exist as static files but are valid targets.
const SSR_PREFIXES = [
  '/books/', '/account', '/admin', '/api/', '/login', '/register', '/verify',
  '/unsubscribe', '/logout', '/rss.xml',
];
// Exact SSR routes (server-rendered, no static file emitted).
const SSR_EXACT = new Set(['/', '/books', '/contact']);

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function resolveTarget(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (clean === '' || SSR_EXACT.has(clean)) return true; // server-rendered route
  if (SSR_PREFIXES.some((p) => clean === p || clean.startsWith(p))) return true; // dynamic
  // static file?
  if (await exists(path.join(DIST, clean))) return true;
  // pretty route → dir/index.html
  if (await exists(path.join(DIST, clean, 'index.html'))) return true;
  if (await exists(path.join(DIST, clean + '.html'))) return true;
  return false;
}

const htmlFiles = (await walk(DIST)).filter((f) => f.endsWith('.html'));
let broken = 0;
let checked = 0;
const linkRe = /(?:href|src)="([^"]+)"/g;

for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  let m;
  while ((m = linkRe.exec(html))) {
    const url = m[1];
    if (!url.startsWith('/')) continue; // skip external, data:, anchors
    checked++;
    if (!(await resolveTarget(url))) {
      broken++;
      console.error(`BROKEN: ${url}  (in ${path.relative(DIST, file)})`);
    }
  }
}

console.log(`Checked ${checked} internal links across ${htmlFiles.length} pages.`);
if (broken > 0) {
  console.error(`✗ ${broken} broken link(s).`);
  process.exit(1);
}
console.log('✓ No broken internal links.');
