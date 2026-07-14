/** Slug helpers, shared with the content build (kept dependency-free & unit-tested). */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/&/g, ' and ')
    .replace(/['’,]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** A short, human-readable slug for a question title (bounded length). */
export function questionSlug(title: string, maxWords = 8): string {
  const base = slugify(title).split('-').filter(Boolean).slice(0, maxWords).join('-');
  return base || 'question';
}

export function isValidBookSlug(slug: string): boolean {
  return /^\d{2}-[a-z0-9-]+$/.test(slug);
}
