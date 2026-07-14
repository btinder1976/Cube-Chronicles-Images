import { describe, it, expect } from 'vitest';
import { slugify, questionSlug, isValidBookSlug } from '../../src/lib/slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('The Shed, The Cube, and The Sands of Time')).toBe('the-shed-the-cube-and-the-sands-of-time');
  });
  it('strips apostrophes and commas', () => {
    expect(slugify("Ellie's World, Revisited")).toBe('ellies-world-revisited');
  });
  it('expands ampersands', () => {
    expect(slugify('Q & A')).toBe('q-and-a');
  });
  it('trims leading/trailing separators', () => {
    expect(slugify('  --Hello!!  ')).toBe('hello');
  });
});

describe('questionSlug', () => {
  it('bounds to max words', () => {
    const s = questionSlug('is this book okay for a sensitive eight year old reader please', 8);
    expect(s.split('-').length).toBeLessThanOrEqual(8);
  });
  it('falls back for empty input', () => {
    expect(questionSlug('!!!')).toBe('question');
  });
});

describe('isValidBookSlug', () => {
  it('accepts NN-title form', () => {
    expect(isValidBookSlug('01-the-shed-the-cube-and-the-sands-of-time')).toBe(true);
  });
  it('rejects malformed', () => {
    expect(isValidBookSlug('the-shed')).toBe(false);
    expect(isValidBookSlug('1-x')).toBe(false);
  });
});
