/** Typed loaders for the static, manuscript-grounded site content. */
import booksData from '../content/books.json';
import seriesData from '../content/series.json';
import seriesFaqsData from '../content/series-faqs.json';

export interface Character {
  name: string;
  role: string;
}

export interface Faq {
  id: string;
  anchor: string;
  q: string;
  a: string;
  spoiler: boolean;
  tags: string[];
}

export interface Book {
  number: number;
  title: string;
  subtitle: string;
  slug: string;
  url: string;
  coverImage: string;
  coverAlt: string;
  coverSource: string;
  settingPlace: string;
  settingRegion: string;
  era: string;
  eraTag: string;
  mainCharacters: Character[];
  premise: string;
  teaser: string;
  themes: string[];
  learningTopics: string[];
  ageRange: string;
  contentNotes: string;
  chapterCount: number;
  parts: string[];
  nextBookHook: string;
  wordCount: number;
  pageCount: number;
  prevSlug: string | null;
  nextSlug: string | null;
  faqs: Faq[];
}

export const books = booksData as unknown as Book[];
export const series = seriesData as typeof seriesData;
export const seriesFaqs = seriesFaqsData as unknown as Faq[];

export function getBook(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}

export function getBookByNumber(n: number): Book | undefined {
  return books.find((b) => b.number === n);
}

export function publicFaqs(faqs: Faq[]): Faq[] {
  return faqs.filter((f) => !f.spoiler);
}

/** Distinct regions/eras/themes for the books index filters. */
export function facets() {
  const regions = new Map<string, number>();
  const eras = new Map<string, number>();
  const themes = new Map<string, number>();
  for (const b of books) {
    regions.set(b.settingRegion, (regions.get(b.settingRegion) ?? 0) + 1);
    eras.set(b.eraTag, (eras.get(b.eraTag) ?? 0) + 1);
    for (const t of b.themes) themes.set(t, (themes.get(t) ?? 0) + 1);
  }
  return {
    regions: [...regions.keys()].sort(),
    eras: [...eras.keys()].sort(),
    themes: [...themes.keys()].sort((a, b) => (themes.get(b)! - themes.get(a)!)),
  };
}
