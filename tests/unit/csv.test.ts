import { describe, it, expect } from 'vitest';
import { toCsv } from '../../src/lib/csv';

describe('toCsv', () => {
  it('serializes rows with a header', () => {
    const csv = toCsv([{ a: 1, b: 'x' }], ['a', 'b']);
    expect(csv).toBe('a,b\n1,x\n');
  });
  it('quotes values with commas, quotes, and newlines', () => {
    const csv = toCsv([{ a: 'he said "hi", ok\nyes', b: 2 }], ['a', 'b']);
    expect(csv).toContain('"he said ""hi"", ok\nyes"');
  });
  it('handles empty input', () => {
    expect(toCsv([], ['x', 'y'])).toBe('x,y\n');
  });
});
