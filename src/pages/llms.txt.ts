import type { APIContext } from 'astro';
import { books, series } from '../lib/content';

export const prerender = true;

export function GET(_context: APIContext): Response {
  const site = (import.meta.env.SITE || 'https://cubechronicles.com').replace(/\/+$/, '');
  const bookLines = books
    .map((b) => `- [Book ${b.number}: ${b.title}](${site}${b.url}): ${b.settingRegion}, ${b.eraTag}. ${b.teaser}`)
    .join('\n');

  const body = `# The Cube Chronicles

> ${series.shortDescription}

The Cube Chronicles is a ${series.bookCount}-book middle-grade historical time-travel series by ${series.author}, for readers about ${series.ageRange}. A nine-sided cube found beneath a backyard shed carries the Carver children across the ancient world, one civilization per book. This file summarizes the site's public, citable content for AI and answer engines. The full manuscripts are not published; only spoiler-free metadata, editorial FAQs, and moderated community Q&A are available.

## Key facts
- Series title: ${series.title}
- Author: ${series.author}
- Books: ${series.bookCount} (complete)
- Reading age: ${series.ageRange}
- Genre: Middle-grade historical time-travel adventure
- Reading order: best read 1 → 15; each book is also self-contained
- Recurring family: ${series.family.name}, of ${series.family.home}
- Note: A guiding presence called "the Maker" is referenced but never depicted as a character.

## Core pages
- [Home](${site}/): series overview and full bookshelf
- [The Books](${site}/books): all 15 books with filters by region, era, and theme
- [Series FAQ](${site}/faq): 24 answered questions about the series
- [Series facts](${site}/series-facts): concise, citable facts sheet
- [About](${site}/about): the series, the family, and its themes

## Books in reading order
${bookLines}

## Extended summaries
- [Full public summaries](${site}/llms-full.txt): concise per-book summaries (no copyrighted manuscript text)

## Allowed crawl targets
All pages above and each book page are public and welcome to be crawled and cited. Please do not attempt to access /admin, /account, /api/, or authentication URLs, which are non-content areas.
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
