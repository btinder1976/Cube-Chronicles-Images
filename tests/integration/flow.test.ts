/**
 * Integration test against a real local Cloudflare D1 (via wrangler's platform
 * proxy). Exercises: password hashing, email verification, question +
 * subscription, response moderation, and the notification exclusion rule
 * (the response author is never emailed; subscribers are).
 *
 * Requires migrations applied to local state first:
 *   npm run db:migrate:local
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getPlatformProxy } from 'wrangler';
import type { AppEnv } from '../../src/lib/env';
import { registerUser, verifyEmailToken, authenticate, issueVerification } from '../../src/lib/auth';
import { getUserByEmail } from '../../src/lib/db';
import { ensureSubscription, notifyResponseApproved } from '../../src/lib/notify';
import { moderateResponse } from '../../src/lib/admin';
import { uuid, randomToken, sha256Hex } from '../../src/lib/crypto';

let proxy: Awaited<ReturnType<typeof getPlatformProxy>>;
let env: AppEnv;

beforeAll(async () => {
  proxy = await getPlatformProxy();
  env = proxy.env as unknown as AppEnv;
  env.EMAIL_PROVIDER = 'log';
  env.SITE_URL = 'http://localhost:4321';
});

afterAll(async () => {
  await proxy?.dispose();
});

async function makeVerifiedUser(email: string, name: string): Promise<string> {
  await registerUser(env, { email, displayName: name, password: 'cubechron1cles', notifyDefault: true, consent: true });
  const u = await getUserByEmail(env, email);
  // Verify via a token we control (registerUser emails a token we can't capture).
  const token = randomToken(32);
  await env.DB.prepare(
    'INSERT INTO email_verification_tokens (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(uuid(), u!.id, await sha256Hex(token), new Date().toISOString(), new Date(Date.now() + 3600e3).toISOString()).run();
  const res = await verifyEmailToken(env, token);
  expect(res.ok).toBe(true);
  return u!.id;
}

describe('end-to-end community flow', () => {
  const stamp = Date.now();
  const authorEmail = `author_${stamp}@example.com`;
  const responderEmail = `responder_${stamp}@example.com`;
  const adminEmail = `admin_${stamp}@example.com`;

  it('registers, hashes passwords, and verifies email', async () => {
    const authorId = await makeVerifiedUser(authorEmail, 'Question Asker');
    expect(authorId).toBeTruthy();
    // Correct password authenticates; wrong one does not.
    expect((await authenticate(env, authorEmail, 'cubechron1cles')).ok).toBe(true);
    expect((await authenticate(env, authorEmail, 'wrongpass123')).ok).toBe(false);
  });

  it('approving a response notifies subscribers but never the response author', async () => {
    const authorId = (await getUserByEmail(env, authorEmail))!.id;
    const responderId = await makeVerifiedUser(responderEmail, 'Helpful Responder');
    const adminId = await makeVerifiedUser(adminEmail, 'Moderator');
    await env.DB.prepare("UPDATE users SET role='admin' WHERE id=?").bind(adminId).run();

    // An approved question by the author on book 1.
    const qId = uuid();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO questions (id, book_slug, user_id, title, body, slug, status, created_at, updated_at, approved_at)
       VALUES (?, '01-the-shed-the-cube-and-the-sands-of-time', ?, 'Is book one scary?', '', ?, 'approved', ?, ?, ?)`
    ).bind(qId, authorId, `is-book-one-scary-${stamp}`, now, now, now).run();

    // Author subscribes (auto-subscribe on posting); responder does NOT subscribe.
    await ensureSubscription(env, qId, authorId);

    // Responder posts a pending answer.
    const rId = uuid();
    await env.DB.prepare(
      `INSERT INTO responses (id, question_id, user_id, body, kind, status, created_at, updated_at)
       VALUES (?, ?, ?, 'Not at all — just a little adventure tension.', 'answer', 'pending', ?, ?)`
    ).bind(rId, qId, responderId, now, now).run();

    // Admin approves → notifications fire.
    const result = await moderateResponse(env, adminId, rId, 'approve');
    expect(result.ok).toBe(true);
    expect(result.notified).toBeTruthy();
    // Exactly one notification: to the subscribed author. The responder (author of
    // the response) is excluded even if they were subscribed.
    expect(result.notified!.sent).toBe(1);

    const deliveries = await env.DB.prepare(
      'SELECT user_id, status FROM notification_deliveries WHERE response_id = ?'
    ).bind(rId).all<{ user_id: string; status: string }>();
    expect(deliveries.results.length).toBe(1);
    expect(deliveries.results[0].user_id).toBe(authorId);
    expect(deliveries.results[0].status).toBe('sent');

    // Response is now approved.
    const r = await env.DB.prepare('SELECT status FROM responses WHERE id=?').bind(rId).first<{ status: string }>();
    expect(r?.status).toBe('approved');
  });

  it('does not double-notify when the responder is also a subscriber', async () => {
    const authorId = (await getUserByEmail(env, authorEmail))!.id;
    const responderId = (await getUserByEmail(env, responderEmail))!.id;
    const adminId = (await getUserByEmail(env, adminEmail))!.id;
    const now = new Date().toISOString();
    const qId = uuid();
    await env.DB.prepare(
      `INSERT INTO questions (id, book_slug, user_id, title, body, slug, status, created_at, updated_at, approved_at)
       VALUES (?, '01-the-shed-the-cube-and-the-sands-of-time', ?, 'Second question?', '', ?, 'approved', ?, ?, ?)`
    ).bind(qId, authorId, `second-question-${stamp}`, now, now, now).run();
    // Both author AND responder subscribe.
    await ensureSubscription(env, qId, authorId);
    await ensureSubscription(env, qId, responderId);
    const rId = uuid();
    await env.DB.prepare(
      `INSERT INTO responses (id, question_id, user_id, body, kind, status, created_at, updated_at)
       VALUES (?, ?, ?, 'My own follow-up answer.', 'answer', 'pending', ?, ?)`
    ).bind(rId, qId, responderId, now, now).run();
    const result = await moderateResponse(env, adminId, rId, 'approve');
    // Only the author is notified; the responder (subscribed) is excluded as the author.
    expect(result.notified!.sent).toBe(1);
  });
});
