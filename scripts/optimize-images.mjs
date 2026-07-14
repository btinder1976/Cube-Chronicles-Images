#!/usr/bin/env node
/**
 * Generate responsive, optimized cover derivatives from the original front-only
 * ebook covers (1600×2560 JPGs). Originals are preserved; we output AVIF, WebP,
 * and JPEG at several widths into public/covers/generated, plus a single
 * fallback public/covers/book-XX.jpg.
 *
 * Source covers must be placed in scripts/source-covers/ named book-01.jpg …
 * book-15.jpg (see docs/cloudflare-setup.md). If a source is missing, a tasteful
 * placeholder is generated so the build never breaks.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'scripts', 'source-covers');
const OUT_DIR = path.join(ROOT, 'public', 'covers', 'generated');
const FALLBACK_DIR = path.join(ROOT, 'public', 'covers');
const WIDTHS = [320, 480, 640, 960];
const ACCENTS = ['#c7a24a', '#6f86b6', '#b98a5e', '#8fae8f', '#b06a6a', '#6f9db6', '#a98fb0', '#c9a24a', '#7fa39a', '#c08a4a', '#c7b26a', '#8f9db6', '#7fa3b0', '#b6975a', '#d9b45a'];

async function ensureDir(d) { await fs.mkdir(d, { recursive: true }); }

async function placeholder(n) {
  const accent = ACCENTS[(n - 1) % ACCENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2560">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#10182e"/><stop offset="1" stop-color="#1b2a4a"/></linearGradient></defs>
    <rect width="1600" height="2560" fill="url(#g)"/>
    <rect x="80" y="80" width="1440" height="2400" fill="none" stroke="${accent}" stroke-width="6" opacity="0.6"/>
    <text x="800" y="360" fill="${accent}" font-family="Georgia,serif" font-size="120" text-anchor="middle">THE CUBE</text>
    <text x="800" y="500" fill="${accent}" font-family="Georgia,serif" font-size="120" text-anchor="middle">CHRONICLES</text>
    <text x="800" y="1320" fill="#f3e9d2" font-family="Georgia,serif" font-size="220" text-anchor="middle">${n}</text>
    <text x="800" y="2360" fill="#d9b45a" font-family="Georgia,serif" font-size="72" text-anchor="middle">Book ${n} of 15</text>
  </svg>`;
  return sharp(Buffer.from(svg));
}

async function loadSource(n) {
  const nn = String(n).padStart(2, '0');
  const candidate = path.join(SRC_DIR, `book-${nn}.jpg`);
  try {
    await fs.access(candidate);
    return sharp(candidate);
  } catch {
    console.warn(`[images] source cover missing for book ${nn} → generating placeholder`);
    return placeholder(n);
  }
}

async function run() {
  await ensureDir(OUT_DIR);
  await ensureDir(FALLBACK_DIR);
  for (let n = 1; n <= 15; n++) {
    const nn = String(n).padStart(2, '0');
    const base = await loadSource(n);
    for (const w of WIDTHS) {
      const resized = base.clone().resize({ width: w });
      await resized.clone().avif({ quality: 55 }).toFile(path.join(OUT_DIR, `book-${nn}-${w}.avif`));
      await resized.clone().webp({ quality: 72 }).toFile(path.join(OUT_DIR, `book-${nn}-${w}.webp`));
      await resized.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT_DIR, `book-${nn}-${w}.jpg`));
    }
    await base.clone().resize({ width: 640 }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(FALLBACK_DIR, `book-${nn}.jpg`));
    console.log(`[images] book ${nn} → ${WIDTHS.length * 3} derivatives + fallback`);
  }
  console.log('[images] done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
