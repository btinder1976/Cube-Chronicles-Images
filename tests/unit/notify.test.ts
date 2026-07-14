import { describe, it, expect } from 'vitest';
import { shouldNotify } from '../../src/lib/notify';

const base = { user_id: 'u2', status: 'active', email_verified: 1 };

describe('shouldNotify', () => {
  it('notifies a verified, active, non-author subscriber', () => {
    expect(shouldNotify(base, 'author1')).toBe(true);
  });
  it('never notifies the author of the response', () => {
    expect(shouldNotify({ ...base, user_id: 'author1' }, 'author1')).toBe(false);
  });
  it('skips unverified subscribers', () => {
    expect(shouldNotify({ ...base, email_verified: 0 }, 'author1')).toBe(false);
  });
  it('skips suspended/banned subscribers', () => {
    expect(shouldNotify({ ...base, status: 'suspended' }, 'author1')).toBe(false);
    expect(shouldNotify({ ...base, status: 'banned' }, 'author1')).toBe(false);
  });
});
