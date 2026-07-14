import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, randomToken, sha256Hex } from '../../src/lib/crypto';

describe('password hashing', () => {
  it('verifies a correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('cubechron1cles');
    expect(hash.startsWith('pbkdf2$')).toBe(true);
    expect(await verifyPassword('cubechron1cles', hash)).toBe(true);
    expect(await verifyPassword('wrong-password9', hash)).toBe(false);
  });
  it('produces a different salt each time', async () => {
    const a = await hashPassword('samePass123');
    const b = await hashPassword('samePass123');
    expect(a).not.toBe(b);
  });
  it('returns false on malformed stored hash', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
  });
});

describe('tokens', () => {
  it('randomToken is url-safe and unique', () => {
    const a = randomToken(24);
    const b = randomToken(24);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it('sha256Hex is stable hex', async () => {
    const h = await sha256Hex('hello');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(await sha256Hex('hello')).toBe(h);
  });
});
