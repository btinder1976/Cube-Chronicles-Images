/**
 * Cloudflare Turnstile server-side verification.
 * If no secret key is configured (local dev), verification is skipped with a
 * console warning so local development works without Turnstile.
 */
import type { AppEnv } from './env';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(
  env: AppEnv,
  token: string | null | undefined,
  ip?: string
): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret || secret.startsWith('1x0000')) {
    // Dev/test key or unset — do not block local development.
    if (!secret) console.warn('[turnstile] No TURNSTILE_SECRET_KEY set; skipping verification.');
    return true;
  }
  if (!token) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (e) {
    console.error('[turnstile] verification error', e);
    return false;
  }
}
