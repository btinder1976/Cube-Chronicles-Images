import { describe, it, expect } from 'vitest';
import { isAdmin } from '../../src/lib/admin';
import type { SessionUser } from '../../src/lib/session';

function user(partial: Partial<SessionUser>): SessionUser {
  return { id: 'u1', email: 'a@b.c', displayName: 'A', role: 'user', status: 'active', emailVerified: true, ...partial };
}

describe('isAdmin', () => {
  it('is true only for active admins', () => {
    expect(isAdmin(user({ role: 'admin' }))).toBe(true);
  });
  it('is false for normal users', () => {
    expect(isAdmin(user({ role: 'user' }))).toBe(false);
  });
  it('is false for suspended/banned admins', () => {
    expect(isAdmin(user({ role: 'admin', status: 'suspended' }))).toBe(false);
    expect(isAdmin(user({ role: 'admin', status: 'banned' }))).toBe(false);
  });
  it('is false for null', () => {
    expect(isAdmin(null)).toBe(false);
  });
});
