import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { redirect, redirectErr } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  const form = await context.request.formData();
  if (!user) return redirect('/login?msg=needlogin');
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr('/account', 'csrf');

  const notify = form.get('notify') === '1' ? 1 : 0;
  await env.DB.prepare('UPDATE users SET notify_default = ?, updated_at = ? WHERE id = ?')
    .bind(notify, new Date().toISOString(), user.id)
    .run();
  return redirect('/account?msg=subscribed');
}
