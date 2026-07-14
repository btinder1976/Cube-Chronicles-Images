import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../../lib/env';
import { verifyCsrf } from '../../../lib/csrf';
import { requireAdmin, moderateQuestion, moderateResponse, moderateUser, logAction } from '../../../lib/admin';
import { redirect, redirectErr, refererPath } from '../../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  const back = refererPath(context.request, '/admin');
  if (!requireAdmin(user) || !user) return redirect('/account?err=forbidden');
  const form = await context.request.formData();
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr(back, 'csrf');

  const type = String(form.get('type') || '');
  const id = String(form.get('id') || '');
  const action = String(form.get('action') || '');
  if (!id || !action) return redirectErr(back, 'invalid');

  if (type === 'question') {
    await moderateQuestion(env, user.id, id, action, {
      title: form.get('title') != null ? String(form.get('title')) : undefined,
      body: form.get('body') != null ? String(form.get('body')) : undefined,
    });
    return redirect(`${back.split('#')[0].split('?')[0]}?msg=posted`);
  }
  if (type === 'response') {
    const res = await moderateResponse(env, user.id, id, action, {
      body: form.get('body') != null ? String(form.get('body')) : undefined,
    });
    if (!res.ok) return redirectErr(back, 'invalid');
    return redirect(`${back.split('#')[0].split('?')[0]}?msg=posted`);
  }
  if (type === 'user') {
    const ok = await moderateUser(env, user.id, id, action);
    if (!ok) return redirectErr(back, 'forbidden');
    return redirect(`${back.split('#')[0].split('?')[0]}?msg=posted`);
  }
  if (type === 'report') {
    const st = action === 'dismiss' ? 'dismissed' : 'reviewed';
    await env.DB.prepare('UPDATE content_reports SET status=?, reviewed_at=? WHERE id=?')
      .bind(st, new Date().toISOString(), id).run();
    await logAction(env, user.id, action, 'report', id);
    return redirect(`${back.split('#')[0].split('?')[0]}?msg=posted`);
  }
  return redirectErr(back, 'invalid');
}
