import type { APIContext } from 'astro';
import { books } from '../lib/content';

export const prerender = true;

export function GET(_context: APIContext): Response {
  const site = (import.meta.env.SITE || 'https://cubechronicles.com').replace(/\/+$/, '');
  const lastmod = '2026-07-14';
  const staticPaths: { path: string; priority: string; changefreq: string }[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/books', priority: '0.9', changefreq: 'weekly' },
    { path: '/faq', priority: '0.8', changefreq: 'monthly' },
    { path: '/series-facts', priority: '0.7', changefreq: 'monthly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/ask', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms', priority: '0.3', changefreq: 'yearly' },
    { path: '/community-guidelines', priority: '0.3', changefreq: 'yearly' },
    { path: '/cookies', priority: '0.3', changefreq: 'yearly' },
    { path: '/contact', priority: '0.3', changefreq: 'yearly' },
  ];
  const bookUrls = books.map((b) => ({ path: b.url, priority: '0.9', changefreq: 'monthly' }));
  const all = [...staticPaths, ...bookUrls];

  const urls = all
    .map(
      (u) => `  <url>
    <loc>${site}${u.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
