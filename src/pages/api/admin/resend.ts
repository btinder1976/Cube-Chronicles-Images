import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../../lib/env';
import { verifyCsrf } from '../../../lib/csrf';
import { requireAdmin, logAction } from '../../../lib/admin';
import { resendDelivery } from '../../../lib/notify';
import { redirect, redirectErr } from '../../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  if (!requireAdmin(user) || !user) return redirect('/account?err=forbidden');
  const form = await context.request.formData();
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr('/admin/notifications', 'csrf');
  const id = String(form.get('delivery_id') || '');
  if (id) {
    await resendDelivery(env, id);
    await logAction(env, user.id, 'resend', 'notification', id);
  }
  return redirect('/admin/notifications?msg=posted');
}
