import type { APIContext } from 'astro';
import { books } from '../lib/content';
import { tryEnv } from '../lib/env';
import { getLatestApprovedQuestions, safe } from '../lib/community';

// SSR so newly approved community questions appear in the feed.
export const prerender = false;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET(context: APIContext): Promise<Response> {
  const site = (import.meta.env.SITE || 'https://cubechronicles.com').replace(/\/+$/, '');
  const env = tryEnv(context.locals);
  const questions = env?.DB ? await safe(() => getLatestApprovedQuestions(env, 20)) : [];

  const questionItems = questions.map((q) => {
    const link = `${site}/books/${q.book_slug}/#q-${q.slug}`;
    return `    <item>
      <title>${esc(q.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${esc(`A new reader question with ${q.response_count} approved ${q.response_count === 1 ? 'reply' : 'replies'}.`)}</description>
      ${q.approved_at ? `<pubDate>${new Date(q.approved_at).toUTCString()}</pubDate>` : ''}
    </item>`;
  });

  // Always include the book catalog so the feed is useful even before any Q&A exists.
  const bookItems = books.map((b) => {
    const link = `${site}${b.url}`;
    return `    <item>
      <title>Book ${b.number}: ${esc(b.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${esc(b.teaser)}</description>
    </item>`;
  });

  const items = [...questionItems, ...bookItems].join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Cube Chronicles — Updates</title>
    <link>${site}/</link>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
    <description>New reader questions and updates from The Cube Chronicles, a 15-book historical time-travel adventure by Jeremy Tinder.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=1800' } });
}
