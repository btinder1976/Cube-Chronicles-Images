/**
 * CSRF protection using the double-submit cookie pattern plus Origin checks.
 * A random token is stored in a readable cookie and echoed in a hidden form
 * field; state-changing requests must present a matching pair AND a same-origin
 * Origin/Referer header.
 */
import type { AstroCookies } from 'astro';
import { randomToken } from './crypto';

export const CSRF_COOKIE = 'cc_csrf';
const CSRF_FIELD = 'csrf_token';

export function ensureCsrfToken(cookies: AstroCookies): string {
  const existing = cookies.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = randomToken(24);
  cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // must be readable to echo into forms
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export function csrfFieldName(): string {
  return CSRF_FIELD;
}

function sameOrigin(request: Request, siteUrl: string): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedHosts = new Set<string>();
  try {
    allowedHosts.add(new URL(siteUrl).host);
  } catch {
    /* ignore */
  }
  allowedHosts.add(new URL(request.url).host);
  const check = (value: string | null): boolean => {
    if (!value) return false;
    try {
      return allowedHosts.has(new URL(value).host);
    } catch {
      return false;
    }
  };
  // If neither header is present we fail closed for state-changing requests.
  if (!origin && !referer) return false;
  if (origin && !check(origin)) return false;
  if (!origin && referer && !check(referer)) return false;
  return true;
}

/** Verify a submitted form's CSRF token against the cookie and origin. */
export function verifyCsrf(
  request: Request,
  cookies: AstroCookies,
  form: FormData,
  siteUrl: string
): boolean {
  if (!sameOrigin(request, siteUrl)) return false;
  const cookieToken = cookies.get(CSRF_COOKIE)?.value ?? '';
  const formToken = String(form.get(CSRF_FIELD) ?? '');
  if (!cookieToken || !formToken) return false;
  if (cookieToken.length !== formToken.length) return false;
  let diff = 0;
  for (let i = 0; i < cookieToken.length; i++) diff |= cookieToken.charCodeAt(i) ^ formToken.charCodeAt(i);
  return diff === 0;
}
