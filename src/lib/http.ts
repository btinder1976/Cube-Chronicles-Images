/** Small helpers for form-handling API routes (POST → redirect with flash). */
import type { APIContext } from 'astro';

export function redirect(to: string, status = 303): Response {
  return new Response(null, { status, headers: { Location: to } });
}

export function redirectMsg(base: string, msg: string): Response {
  const sep = base.includes('?') ? '&' : '?';
  return redirect(`${base}${sep}msg=${encodeURIComponent(msg)}`);
}

export function redirectErr(base: string, err: string): Response {
  const sep = base.includes('?') ? '&' : '?';
  return redirect(`${base}${sep}err=${encodeURIComponent(err)}`);
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** Parse a urlencoded/multipart form body once. */
export async function form(context: APIContext): Promise<FormData> {
  return context.request.formData();
}

/** Referer path fallback for redirect targets. */
export function refererPath(request: Request, fallback = '/'): string {
  const ref = request.headers.get('referer');
  if (!ref) return fallback;
  try {
    const u = new URL(ref);
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
