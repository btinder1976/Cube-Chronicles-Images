import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { rateLimit } from '../../lib/ratelimit';
import { issueVerification } from '../../lib/auth';
import { getUserById } from '../../lib/db';
import { redirect, redirectErr } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  const form = await context.request.formData();
  if (!user) return redirect('/login?msg=needlogin');
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr('/account', 'csrf');
  if (user.emailVerified) return redirect('/account');

  const rl = await rateLimit(env, `resend:${user.id}`, 3, 3600);
  if (!rl.allowed) return redirectErr('/account', 'ratelimited');

  const full = await getUserById(env, user.id);
  if (full) await issueVerification(env, full.id, full.email, full.display_name);
  return redirect('/account?msg=registered');
}
