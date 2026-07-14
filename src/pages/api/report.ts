import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { rateLimit, clientIp } from '../../lib/ratelimit';
import { uuid } from '../../lib/crypto';
import { redirect, redirectErr, refererPath } from '../../lib/http';
import { LIMITS } from '../../lib/validation';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  const form = await context.request.formData();
  const back = refererPath(context.request, '/');

  if (!user) return redirect(`/login?next=${encodeURIComponent(back)}&msg=needlogin`);
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr(back, 'csrf');

  const targetType = String(form.get('target_type') || '');
  const targetId = String(form.get('target_id') || '');
  if (!['question', 'response'].includes(targetType) || !targetId) return redirectErr(back, 'invalid');

  const rl = await rateLimit(env, `report:${user.id}`, 20, 3600);
  if (!rl.allowed) return redirectErr(back, 'ratelimited');

  const reason = String(form.get('reason') || '').slice(0, LIMITS.reportReasonMax);
  await env.DB.prepare(
    `INSERT INTO content_reports (id, target_type, target_id, reporter_id, reason, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`
  )
    .bind(uuid(), targetType, targetId, user.id, reason, new Date().toISOString())
    .run();

  return redirect(`${back.split('#')[0]}?msg=reported`);
}
