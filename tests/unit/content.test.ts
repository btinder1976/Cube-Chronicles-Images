import { describe, it, expect } from 'vitest';
import { books, series, seriesFaqs, getBook, publicFaqs } from '../../src/lib/content';

describe('books content integrity', () => {
  it('has exactly 15 books in order', () => {
    expect(books.length).toBe(15);
    books.forEach((b, i) => expect(b.number).toBe(i + 1));
  });

  it('each book has at least 12 editorial FAQs', () => {
    for (const b of books) expect(b.faqs.length).toBeGreaterThanOrEqual(12);
  });

  it('each book has at least 12 spoiler-free FAQs for structured data', () => {
    for (const b of books) expect(publicFaqs(b.faqs).length).toBeGreaterThanOrEqual(12);
  });

  it('prev/next links are consistent', () => {
    expect(books[0].prevSlug).toBeNull();
    expect(books[14].nextSlug).toBeNull();
    for (let i = 0; i < books.length - 1; i++) {
      expect(books[i].nextSlug).toBe(books[i + 1].slug);
      expect(books[i + 1].prevSlug).toBe(books[i].slug);
    }
  });

  it('every book slug resolves and is unique', () => {
    const slugs = new Set(books.map((b) => b.slug));
    expect(slugs.size).toBe(15);
    for (const b of books) expect(getBook(b.slug)?.number).toBe(b.number);
  });

  it('FAQ ids and anchors are unique within a book', () => {
    for (const b of books) {
      const ids = new Set(b.faqs.map((f) => f.id));
      expect(ids.size).toBe(b.faqs.length);
    }
  });

  it('preserves exact required titles', () => {
    expect(books[0].title).toBe('The Shed, The Cube, and The Sands of Time');
    expect(books[14].title).toBe('The Center, The Maker, and The Road That Was Always Home');
  });
});

describe('series content', () => {
  it('has 15 ordered settings and >= 20 series FAQs', () => {
    expect(series.settingsInOrder.length).toBe(15);
    expect(seriesFaqs.length).toBeGreaterThanOrEqual(20);
  });
});
