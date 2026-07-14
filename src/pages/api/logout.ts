import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { destroySession } from '../../lib/session';
import { redirect, redirectErr } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const form = await context.request.formData();
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env)))
    return redirectErr('/account', 'csrf');
  await destroySession(env, context.cookies);
  return redirect('/?msg=loggedout');
}

export function GET(): Response {
  return redirect('/');
}
