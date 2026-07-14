import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { verifyTurnstile } from '../../lib/turnstile';
import { rateLimit, clientIp } from '../../lib/ratelimit';
import { validateQuestion } from '../../lib/validation';
import { questionSlug } from '../../lib/slug';
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
  const bookSlug = String(form.get('book_slug') || '');
  const book = bookSlug ? getBook(bookSlug) : undefined;
  const back = book ? `${book.url}#ask` : '/ask';

  if (!user) return redirect(`/login?next=${encodeURIComponent(back)}&msg=needlogin`);
  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr(book ? book.url : '/ask', 'csrf');
  if (!user.emailVerified) return redirectErr('/account', 'needverify');
  if (bookSlug && !book) return redirectErr('/books', 'notfound');

  const ip = clientIp(context.request);
  const rl = await rateLimit(env, `question:${user.id}`, 5, 3600);
  if (!rl.allowed) return redirectErr(book ? book.url : '/ask', 'ratelimited');

  const ok = await verifyTurnstile(env, String(form.get('cf-turnstile-response') || ''), ip);
  if (!ok) return redirectErr(book ? book.url : '/ask', 'turnstile');

  const valid = validateQuestion(form.get('title'), form.get('body'));
  if (!valid.ok) return redirectErr(book ? book.url : '/ask', 'invalid');

  // Unique slug (append short suffix if needed)
  let slug = questionSlug(valid.value.title);
  const clash = await env.DB.prepare('SELECT 1 FROM questions WHERE slug = ?').bind(slug).first();
  if (clash) slug = `${slug}-${uuid().slice(0, 6)}`;

  const id = uuid();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO questions (id, book_slug, user_id, title, body, slug, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(id, bookSlug || null, user.id, valid.value.title, valid.value.body, slug, now, now)
    .run();

  // Auto-subscribe the author if their preference allows (default on).
  const full = await getUserById(env, user.id);
  if (!full || full.notify_default === 1) {
    await ensureSubscription(env, id, user.id);
  }

  return redirect(`${back.replace('#ask', '')}?msg=posted#community`);
}

export function GET(): Response {
  return redirect('/ask');
}
