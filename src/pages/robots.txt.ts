import type { APIContext } from 'astro';

export const prerender = true;

export function GET(context: APIContext): Response {
  const site = (import.meta.env.SITE || 'https://cubechronicles.com').replace(/\/+$/, '');
  const body = `# robots.txt for The Cube Chronicles
User-agent: *
Allow: /

# Private and non-content areas
Disallow: /admin
Disallow: /account
Disallow: /api/
Disallow: /verify
Disallow: /unsubscribe
Disallow: /login
Disallow: /register
Disallow: /logout

# Sitemap
Sitemap: ${site}/sitemap.xml

# AI/answer engines: see ${site}/llms.txt
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
