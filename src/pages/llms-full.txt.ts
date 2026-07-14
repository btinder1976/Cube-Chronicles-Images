import type { APIContext } from 'astro';
import { books, series } from '../lib/content';

export const prerender = true;

export function GET(_context: APIContext): Response {
  const site = (import.meta.env.SITE || 'https://cubechronicles.com').replace(/\/+$/, '');

  const perBook = books
    .map((b) => {
      const chars = b.mainCharacters.slice(0, 6).map((c) => `${c.name} (${c.role})`).join('; ');
      const themes = b.themes.join(', ');
      const learn = b.learningTopics.join('; ');
      return `## Book ${b.number}: ${b.title}
URL: ${site}${b.url}
Subtitle: ${b.subtitle}
Setting: ${b.settingPlace}
Era: ${b.era}
Reading age: ${b.ageRange}
Length: ${b.pageCount} pages
Premise (spoiler-free): ${b.premise}
Main characters: ${chars}
Themes: ${themes}
What readers learn: ${learn}
Content guidance: ${b.contentNotes}
`;
    })
    .join('\n');

  const body = `# The Cube Chronicles — Full Public Summaries

${series.shortDescription}

This document contains concise, spoiler-free public summaries of each book for reference and citation. It intentionally does NOT contain the books' full text or any copyrighted manuscript passages. Series by ${series.author}. ${series.bookCount} books, for readers about ${series.ageRange}.

Series premise: ${series.premise}

The Carver family: ${series.family.members.map((m) => `${m.name} — ${m.role}`).join(' / ')}

Note on faith: ${series.makerNote}

${perBook}
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
