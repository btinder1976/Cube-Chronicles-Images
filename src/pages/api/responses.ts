import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { verifyTurnstile } from '../../lib/turnstile';
import { rateLimit, clientIp } from '../../lib/ratelimit';
import { validateResponse } from '../../lib/validation';
import { uuid } from '../../lib/crypto';
import { ensureSubscription } from '../../lib/notify';
import { getBook } from '../../lib/content';
import { getUserById } from '../../lib/db';
import { redirect, redirectErr } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  const form = await context.request.formData();
  const questionId = String(form.get('question_id') || '');
  const bookSlug = String(form.get('book_slug') || '');
  const book = bookSlug ? getBook(bookSlug) : undefined;
  const back = book ? `${book.url}#community` : '/books';

  if (!user) return redirect(`/login?next=${encodeURIComponent(back)}&msg=needlogin`);
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr(book ? book.url : '/books', 'csrf');
  if (!user.emailVerified) return redirectErr('/account', 'needverify');

  // The question must exist and be approved to accept replies.
  const q = await env.DB.prepare("SELECT id FROM questions WHERE id = ? AND status = 'approved' AND deleted_at IS NULL")
    .bind(questionId)
    .first<{ id: string }>();
  if (!q) return redirectErr(book ? book.url : '/books', 'notfound');

  const ip = clientIp(context.request);
  const rl = await rateLimit(env, `response:${user.id}`, 12, 3600);
  if (!rl.allowed) return redirectErr(book ? book.url : '/books', 'ratelimited');

  const ok = await verifyTurnstile(env, String(form.get('cf-turnstile-response') || ''), ip);
  if (!ok) return redirectErr(book ? book.url : '/books', 'turnstile');

  const valid = validateResponse(form.get('body'));
  if (!valid.ok) return redirectErr(book ? book.url : '/books', 'invalid');

  const kind = form.get('kind') === 'comment' ? 'comment' : 'answer';
  const id = uuid();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO responses (id, question_id, user_id, body, kind, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(id, questionId, user.id, valid.value, kind, now, now)
    .run();

  // Subscribe the responder if their default preference allows.
  const full = await getUserById(env, user.id);
  if (!full || full.notify_default === 1) await ensureSubscription(env, questionId, user.id);

  return redirect(`${back.split('#')[0]}?msg=posted#community`);
}

export function GET(): Response {
  return redirect('/books');
}
