/**
 * Notification dispatch. When a response is approved, email every active,
 * verified subscriber of its question — except the response's own author —
 * and log each attempt in notification_deliveries for auditing/resending.
 */
import type { AppEnv } from './env';
import { siteUrl } from './env';
import { uuid, randomToken, sha256Hex } from './crypto';
import { sendEmail, responseNotificationEmail } from './email';
import { excerpt } from './sanitize';
import { getBook } from './content';

interface SubscriberRow {
  user_id: string;
  email: string;
  display_name: string;
  status: string;
  email_verified: number;
  unsubscribe_token: string;
}

/**
 * Pure notification-eligibility rule (unit-tested). A subscriber is notified
 * for a response only if they are NOT the response's author, their account is
 * active, and their email is verified.
 */
export function shouldNotify(
  sub: { user_id: string; status: string; email_verified: number },
  responseAuthorId: string
): boolean {
  if (sub.user_id === responseAuthorId) return false;
  if (sub.status !== 'active') return false;
  if (sub.email_verified !== 1) return false;
  return true;
}

/** Ensure a subscription exists for (user, question). Used to auto-subscribe authors. */
export async function ensureSubscription(env: AppEnv, questionId: string, userId: string): Promise<void> {
  const existing = await env.DB.prepare(
    'SELECT id FROM subscriptions WHERE question_id = ? AND user_id = ?'
  )
    .bind(questionId, userId)
    .first<{ id: string }>();
  if (existing) {
    await env.DB.prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?").bind(existing.id).run();
    return;
  }
  await env.DB.prepare(
    `INSERT INTO subscriptions (id, question_id, user_id, status, unsubscribe_token, created_at)
     VALUES (?, ?, ?, 'active', ?, ?)`
  )
    .bind(uuid(), questionId, userId, randomToken(24), new Date().toISOString())
    .run();
}

export async function unsubscribeByToken(env: AppEnv, token: string): Promise<boolean> {
  const res = await env.DB.prepare(
    "UPDATE subscriptions SET status = 'unsubscribed' WHERE unsubscribe_token = ? AND status = 'active'"
  )
    .bind(token)
    .run();
  return (res.meta.changes ?? 0) > 0;
}

/**
 * Send notifications for a freshly approved response. Idempotent per
 * (delivery) because we only send to active subscriptions and log every send.
 */
export async function notifyResponseApproved(env: AppEnv, responseId: string): Promise<{ sent: number; failed: number }> {
  const resp = await env.DB.prepare(
    `SELECT r.id, r.user_id as author_id, r.body, r.question_id,
            q.title as question_title, q.slug as question_slug, q.book_slug as book_slug
     FROM responses r JOIN questions q ON q.id = r.question_id
     WHERE r.id = ?`
  )
    .bind(responseId)
    .first<{
      id: string;
      author_id: string;
      body: string;
      question_id: string;
      question_title: string;
      question_slug: string;
      book_slug: string | null;
    }>();
  if (!resp) return { sent: 0, failed: 0 };

  const subs = await env.DB.prepare(
    `SELECT s.user_id, s.unsubscribe_token, u.email, u.display_name, u.status, u.email_verified
     FROM subscriptions s JOIN users u ON u.id = s.user_id
     WHERE s.question_id = ? AND s.status = 'active'`
  )
    .bind(resp.question_id)
    .all<SubscriberRow>();

  const book = resp.book_slug ? getBook(resp.book_slug) : undefined;
  const bookTitle = book ? book.title : 'The Cube Chronicles';
  const base = siteUrl(env);
  const discussionUrl = resp.book_slug
    ? `${base}/books/${resp.book_slug}/#q-${resp.question_slug}`
    : `${base}/community/#q-${resp.question_slug}`;
  const exc = excerpt(resp.body, 180);

  let sent = 0;
  let failed = 0;
  for (const s of subs.results ?? []) {
    // Do not notify the author of this very response, banned/suspended, or unverified users.
    if (!shouldNotify(s, resp.author_id)) continue;

    const unsubscribeUrl = `${base}/unsubscribe?token=${encodeURIComponent(s.unsubscribe_token)}`;
    const msg = responseNotificationEmail({
      siteUrl: base,
      bookTitle,
      questionTitle: resp.question_title,
      responseExcerpt: exc,
      discussionUrl,
      unsubscribeUrl,
    });
    msg.to = s.email;
    const result = await sendEmail(env, msg);

    await env.DB.prepare(
      `INSERT INTO notification_deliveries
        (id, response_id, question_id, user_id, email, status, provider, provider_id, error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        uuid(),
        resp.id,
        resp.question_id,
        s.user_id,
        s.email,
        result.ok ? 'sent' : 'failed',
        result.provider,
        result.providerId ?? null,
        result.error ?? null,
        new Date().toISOString()
      )
      .run();

    if (result.ok) sent++;
    else failed++;
  }
  return { sent, failed };
}

/** Resend a single previously-failed delivery by its id. */
export async function resendDelivery(env: AppEnv, deliveryId: string): Promise<boolean> {
  const d = await env.DB.prepare(
    `SELECT nd.*, q.title as question_title, q.slug as question_slug, q.book_slug as book_slug,
            r.body as body, s.unsubscribe_token as unsubscribe_token
     FROM notification_deliveries nd
     JOIN questions q ON q.id = nd.question_id
     JOIN responses r ON r.id = nd.response_id
     LEFT JOIN subscriptions s ON s.question_id = nd.question_id AND s.user_id = nd.user_id
     WHERE nd.id = ?`
  )
    .bind(deliveryId)
    .first<any>();
  if (!d) return false;
  const base = siteUrl(env);
  const book = d.book_slug ? getBook(d.book_slug) : undefined;
  const msg = responseNotificationEmail({
    siteUrl: base,
    bookTitle: book ? book.title : 'The Cube Chronicles',
    questionTitle: d.question_title,
    responseExcerpt: excerpt(d.body, 180),
    discussionUrl: d.book_slug
      ? `${base}/books/${d.book_slug}/#q-${d.question_slug}`
      : `${base}/community/#q-${d.question_slug}`,
    unsubscribeUrl: `${base}/unsubscribe?token=${encodeURIComponent(d.unsubscribe_token ?? '')}`,
  });
  msg.to = d.email;
  const result = await sendEmail(env, msg);
  await env.DB.prepare(
    'UPDATE notification_deliveries SET status = ?, provider_id = ?, error = ?, created_at = ? WHERE id = ?'
  )
    .bind(result.ok ? 'sent' : 'failed', result.providerId ?? null, result.error ?? null, new Date().toISOString(), deliveryId)
    .run();
  return result.ok;
}
