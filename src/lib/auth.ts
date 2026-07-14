/** Registration, email verification, and login orchestration over D1. */
import type { AppEnv } from './env';
import { hashPassword, verifyPassword, uuid, randomToken, sha256Hex } from './crypto';
import { getUserByEmail, type UserRow } from './db';
import { sendEmail, verificationEmail } from './email';
import { siteUrl } from './env';

const VERIFICATION_TTL_HOURS = 48;

export interface RegisterInput {
  email: string;
  displayName: string;
  password: string;
  notifyDefault: boolean;
  consent: boolean;
}

export interface RegisterOutcome {
  ok: boolean;
  userId?: string;
  // We always show the same message to avoid leaking which emails are registered.
  message: string;
}

export async function registerUser(env: AppEnv, input: RegisterInput): Promise<RegisterOutcome> {
  const genericMessage =
    'Check your inbox — if the address is new, we just sent a confirmation link. You must confirm before posting.';
  const existing = await getUserByEmail(env, input.email);
  const now = new Date().toISOString();

  if (existing) {
    // If unverified, resend verification. If verified, do nothing revealing.
    if (existing.email_verified === 0) {
      await issueVerification(env, existing.id, existing.email, existing.display_name);
    }
    return { ok: true, message: genericMessage };
  }

  const id = uuid();
  const passwordHash = await hashPassword(input.password);
  await env.DB.prepare(
    `INSERT INTO users
       (id, email, display_name, password_hash, email_verified, role, status,
        consent_email_at, notify_default, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 'user', 'active', ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.email.toLowerCase(),
      input.displayName,
      passwordHash,
      input.consent ? now : null,
      input.notifyDefault ? 1 : 0,
      now,
      now
    )
    .run();

  await issueVerification(env, id, input.email, input.displayName);
  return { ok: true, userId: id, message: genericMessage };
}

export async function issueVerification(
  env: AppEnv,
  userId: string,
  email: string,
  displayName: string
): Promise<void> {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expires = new Date(now.getTime() + VERIFICATION_TTL_HOURS * 3600 * 1000);
  // Invalidate previous unused tokens for this user.
  await env.DB.prepare('DELETE FROM email_verification_tokens WHERE user_id = ? AND used_at IS NULL')
    .bind(userId)
    .run();
  await env.DB.prepare(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(uuid(), userId, tokenHash, now.toISOString(), expires.toISOString())
    .run();

  const url = `${siteUrl(env)}/verify?token=${encodeURIComponent(token)}`;
  const msg = verificationEmail(siteUrl(env), displayName, url);
  msg.to = email;
  await sendEmail(env, msg);
}

export async function verifyEmailToken(env: AppEnv, token: string): Promise<{ ok: boolean; message: string }> {
  if (!token) return { ok: false, message: 'Missing verification token.' };
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    'SELECT * FROM email_verification_tokens WHERE token_hash = ?'
  )
    .bind(tokenHash)
    .first<{ id: string; user_id: string; expires_at: string; used_at: string | null }>();
  if (!row || row.used_at) return { ok: false, message: 'This verification link is invalid or already used.' };
  if (new Date(row.expires_at).getTime() < Date.now())
    return { ok: false, message: 'This verification link has expired. Please request a new one.' };

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE email_verification_tokens SET used_at = ? WHERE id = ?').bind(now, row.id),
    env.DB.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').bind(now, row.user_id),
  ]);
  return { ok: true, message: 'Your email is confirmed. You can now take part in discussions.' };
}

export interface LoginOutcome {
  ok: boolean;
  user?: UserRow;
  message: string;
}

export async function authenticate(env: AppEnv, email: string, password: string): Promise<LoginOutcome> {
  const generic = 'Incorrect email or password.';
  const user = await getUserByEmail(env, email);
  // Always run a hash comparison to reduce timing signal, even if user is absent.
  const stored = user?.password_hash ?? 'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const valid = await verifyPassword(password, stored);
  if (!user || !valid) return { ok: false, message: generic };
  if (user.status === 'banned' || user.status === 'suspended')
    return { ok: false, message: 'This account is not permitted to sign in. Contact the site owner.' };
  return { ok: true, user, message: 'Signed in.' };
}
