import { describe, it, expect } from 'vitest';
import { validateEmail, validateDisplayName, validatePassword, validateQuestion, validateResponse } from '../../src/lib/validation';

describe('validateEmail', () => {
  it('accepts a valid email and lowercases it', () => {
    const r = validateEmail('Reader@Example.COM');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('reader@example.com');
  });
  it('rejects invalid', () => {
    expect(validateEmail('nope').ok).toBe(false);
    expect(validateEmail('').ok).toBe(false);
  });
});

describe('validateDisplayName', () => {
  it('accepts a normal name', () => {
    expect(validateDisplayName('Book Nerd 42').ok).toBe(true);
  });
  it('rejects too short / control chars', () => {
    expect(validateDisplayName('a').ok).toBe(false);
    expect(validateDisplayName('bad<script>').ok).toBe(false);
  });
});

describe('validatePassword', () => {
  it('requires length + letter + number', () => {
    expect(validatePassword('abcdefghij').ok).toBe(false); // no number
    expect(validatePassword('abc12').ok).toBe(false); // too short
    expect(validatePassword('cubechron1cles').ok).toBe(true);
  });
});

describe('validateQuestion', () => {
  it('requires a substantive title', () => {
    expect(validateQuestion('short', '').ok).toBe(false);
    const ok = validateQuestion('Is this good for a 9 year old?', 'Some detail');
    expect(ok.ok).toBe(true);
  });
});

describe('validateResponse', () => {
  it('rejects empty and accepts real text', () => {
    expect(validateResponse('').ok).toBe(false);
    expect(validateResponse('Yes, absolutely.').ok).toBe(true);
  });
});
