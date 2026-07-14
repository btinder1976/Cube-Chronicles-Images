import type { APIContext } from 'astro';
import { getEnv } from '../../../lib/env';
import { requireAdmin, logAction } from '../../../lib/admin';
import { toCsv, csvResponse, jsonDownload } from '../../../lib/csv';
import { redirect } from '../../../lib/http';

export const prerender = false;

/**
 * Owner data export. GET /api/admin/export?type=<type>&format=<csv|json>
 * Admin-only. Streams a downloadable file. Never includes password hashes or tokens.
 */
export async function GET(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const user = context.locals.user;
  if (!requireAdmin(user) || !user) return redirect('/account?err=forbidden');

  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'users';
  const format = url.searchParams.get('format') === 'json' ? 'json' : 'csv';

  const queries: Record<string, { sql: string; cols: string[]; file: string }> = {
    users: {
      sql: `SELECT id, email, display_name, email_verified, role, status, consent_email_at, notify_default, created_at
            FROM users WHERE deleted_at IS NULL ORDER BY created_at`,
      cols: ['id', 'email', 'display_name', 'email_verified', 'role', 'status', 'consent_email_at', 'notify_default', 'created_at'],
      file: 'cubechronicles-users',
    },
    questions: {
      sql: `SELECT q.id, q.book_slug, q.title, q.body, q.slug, q.status, q.created_at, q.approved_at, u.display_name, u.email
            FROM questions q JOIN users u ON u.id=q.user_id WHERE q.deleted_at IS NULL ORDER BY q.created_at`,
      cols: ['id', 'book_slug', 'title', 'body', 'slug', 'status', 'created_at', 'approved_at', 'display_name', 'email'],
      file: 'cubechronicles-questions',
    },
    responses: {
      sql: `SELECT r.id, r.question_id, r.body, r.kind, r.status, r.created_at, r.approved_at, u.display_name, u.email
            FROM responses r JOIN users u ON u.id=r.user_id WHERE r.deleted_at IS NULL ORDER BY r.created_at`,
      cols: ['id', 'question_id', 'body', 'kind', 'status', 'created_at', 'approved_at', 'display_name', 'email'],
      file: 'cubechronicles-responses',
    },
    subscriptions: {
      sql: `SELECT s.id, s.question_id, s.status, s.created_at, u.email, u.display_name
            FROM subscriptions s JOIN users u ON u.id=s.user_id ORDER BY s.created_at`,
      cols: ['id', 'question_id', 'status', 'created_at', 'email', 'display_name'],
      file: 'cubechronicles-subscriptions',
    },
    consent: {
      sql: `SELECT id, email, display_name, consent_email_at, notify_default, created_at
            FROM users WHERE deleted_at IS NULL ORDER BY created_at`,
      cols: ['id', 'email', 'display_name', 'consent_email_at', 'notify_default', 'created_at'],
      file: 'cubechronicles-consent',
    },
    notifications: {
      sql: `SELECT id, response_id, question_id, email, status, provider, provider_id, error, created_at
            FROM notification_deliveries ORDER BY created_at DESC`,
      cols: ['id', 'response_id', 'question_id', 'email', 'status', 'provider', 'provider_id', 'error', 'created_at'],
      file: 'cubechronicles-notifications',
    },
    moderation: {
      sql: `SELECT id, admin_id, action, target_type, target_id, note, created_at FROM moderation_actions ORDER BY created_at DESC`,
      cols: ['id', 'admin_id', 'action', 'target_type', 'target_id', 'note', 'created_at'],
      file: 'cubechronicles-moderation-log',
    },
  };

  const def = queries[type];
  if (!def) return new Response('Unknown export type', { status: 400 });

  const rows = (await env.DB.prepare(def.sql).all<Record<string, unknown>>()).results ?? [];
  await logAction(env, user.id, `export:${type}:${format}`, 'export', type);

  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'json') return jsonDownload(`${def.file}-${stamp}.json`, rows);
  return csvResponse(`${def.file}-${stamp}.csv`, toCsv(rows, def.cols));
}
