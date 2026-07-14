import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { verifyTurnstile } from '../../lib/turnstile';
import { rateLimit, clientIp } from '../../lib/ratelimit';
import { validateEmail, validateDisplayName, validatePassword } from '../../lib/validation';
import { registerUser } from '../../lib/auth';
import { redirect, redirectErr } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const form = await context.request.formData();

  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env)))
    return redirectErr('/register', 'csrf');

  const ip = clientIp(context.request);
  const rl = await rateLimit(env, `register:${ip}`, 5, 3600);
  if (!rl.allowed) return redirectErr('/register', 'ratelimited');

  const ok = await verifyTurnstile(env, String(form.get('cf-turnstile-response') || ''), ip);
  if (!ok) return redirectErr('/register', 'turnstile');

  const email = validateEmail(form.get('email'));
  const name = validateDisplayName(form.get('displayName'));
  const pass = validatePassword(form.get('password'));
  const consent = form.get('consent') === '1';
  if (!email.ok || !name.ok || !pass.ok || !consent) return redirectErr('/register', 'invalid');

  await registerUser(env, {
    email: email.value,
    displayName: name.value,
    password: pass.value,
    notifyDefault: form.get('notify') === '1',
    consent,
  });

  return redirect('/login?msg=registered');
}

export function GET(): Response {
  return redirect('/register');
}
