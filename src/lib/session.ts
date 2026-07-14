/**
 * Session management backed by D1. We store only a SHA-256 hash of the session
 * token; the raw token lives only in the user's HttpOnly cookie. Sessions
 * expire and can be revoked. A fresh session id is issued on login (rotation).
 */
import type { AstroCookies } from 'astro';
import type { AppEnv } from './env';
import { randomToken, sha256Hex, uuid } from './crypto';
import type { UserRow } from './db';
import { getUserById } from './db';

export const SESSION_COOKIE = 'cc_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function createSession(
  env: AppEnv,
  cookies: AstroCookies,
  userId: string,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<void> {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const id = uuid();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      tokenHash,
      now.toISOString(),
      expires.toISOString(),
      meta.ip ?? null,
      (meta.userAgent ?? '').slice(0, 300) || null
    )
    .run();
  cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_SECONDS));
}

export async function destroySession(env: AppEnv, cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Resolve the current user from the session cookie, or null. Cleans expired sessions lazily. */
export async function getSessionUser(env: AppEnv, cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.expires_at as expires_at, u.* FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?`
  )
    .bind(tokenHash)
    .first<UserRow & { expires_at: string }>();
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    cookies.delete(SESSION_COOKIE, { path: '/' });
    return null;
  }
  if (row.deleted_at || row.status === 'banned') return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    status: row.status,
    emailVerified: row.email_verified === 1,
  };
}

export async function requireUser(env: AppEnv, cookies: AstroCookies): Promise<SessionUser | null> {
  return getSessionUser(env, cookies);
}

export async function loadFullUser(env: AppEnv, id: string): Promise<UserRow | null> {
  return getUserById(env, id);
}
