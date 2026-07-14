import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { verifyTurnstile } from '../../lib/turnstile';
import { rateLimit, clientIp } from '../../lib/ratelimit';
import { authenticate } from '../../lib/auth';
import { createSession } from '../../lib/session';
import { redirect, redirectErr } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const form = await context.request.formData();
  const nextRaw = String(form.get('next') || '/account');
  const next = nextRaw.startsWith('/') ? nextRaw : '/account';

  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env)))
    return redirectErr('/login', 'csrf');

  const ip = clientIp(context.request);
  const rl = await rateLimit(env, `login:${ip}`, 10, 900);
  if (!rl.allowed) return redirectErr('/login', 'ratelimited');

  const ok = await verifyTurnstile(env, String(form.get('cf-turnstile-response') || ''), ip);
  if (!ok) return redirectErr('/login', 'turnstile');

  const email = String(form.get('email') || '');
  const password = String(form.get('password') || '');
  const result = await authenticate(env, email, password);
  if (!result.ok || !result.user) return redirectErr('/login', 'credentials');

  await createSession(env, context.cookies, result.user.id, {
    ip,
    userAgent: context.request.headers.get('user-agent') || undefined,
  });
  return redirect(next);
}

export function GET(): Response {
  return redirect('/login');
}
