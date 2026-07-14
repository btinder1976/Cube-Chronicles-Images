import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../../lib/env';
import { verifyCsrf } from '../../../lib/csrf';
import { rateLimit, clientIp } from '../../../lib/ratelimit';
import { logAction } from '../../../lib/admin';
import { redirect, redirectErr } from '../../../lib/http';

export const prerender = false;

/**
 * Promote the current signed-in, verified user to admin using ADMIN_BOOTSTRAP_TOKEN.
 * Only succeeds when: token matches AND (no admin exists yet OR the user's email
 * equals ADMIN_EMAIL). Constant-ish behavior and rate-limited to resist guessing.
 */
export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  if (!user) return redirect('/login?next=/admin/bootstrap&msg=needlogin');
  const form = await context.request.formData();
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr('/admin/bootstrap', 'csrf');

  const ip = clientIp(context.request);
  const rl = await rateLimit(env, `bootstrap:${ip}`, 5, 3600);
  if (!rl.allowed) return redirectErr('/admin/bootstrap', 'ratelimited');

  const token = String(form.get('token') || '');
  const expected = env.ADMIN_BOOTSTRAP_TOKEN || '';
  if (!expected || token !== expected) return redirectErr('/admin/bootstrap', 'token');
  if (!user.emailVerified) return redirectErr('/admin/bootstrap', 'forbidden');

  const adminCount = (await env.DB.prepare("SELECT COUNT(*) c FROM users WHERE role='admin' AND deleted_at IS NULL").first<{ c: number }>())?.c ?? 0;
  const isDesignated = env.ADMIN_EMAIL && user.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  if (adminCount > 0 && !isDesignated) return redirectErr('/admin/bootstrap', 'forbidden');

  await env.DB.prepare("UPDATE users SET role='admin', updated_at=? WHERE id=?")
    .bind(new Date().toISOString(), user.id).run();
  await logAction(env, user.id, 'promote-admin', 'user', user.id, 'via bootstrap token');

  // Force re-login so the session picks up the new role.
  return redirect('/admin');
}
