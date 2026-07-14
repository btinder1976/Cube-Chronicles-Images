import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { ensureSubscription } from '../../lib/notify';
import { redirect, redirectErr, refererPath } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  const form = await context.request.formData();
  const back = refererPath(context.request, '/');

  if (!user) return redirect(`/login?next=${encodeURIComponent(back)}&msg=needlogin`);
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr(back, 'csrf');
  if (!user.emailVerified) return redirectErr('/account', 'needverify');

  const questionId = String(form.get('question_id') || '');
  const action = String(form.get('action') || 'subscribe');
  const q = await env.DB.prepare("SELECT id FROM questions WHERE id = ? AND status = 'approved'").bind(questionId).first();
  if (!q) return redirectErr(back, 'notfound');

  if (action === 'unsubscribe') {
    await env.DB.prepare(
      "UPDATE subscriptions SET status = 'unsubscribed' WHERE question_id = ? AND user_id = ?"
    ).bind(questionId, user.id).run();
    return redirect(`${back.split('#')[0]}?msg=unsubscribed`);
  }
  await ensureSubscription(env, questionId, user.id);
  return redirect(`${back.split('#')[0]}?msg=subscribed`);
}
