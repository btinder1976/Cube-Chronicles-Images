/** Read-side helpers for approved community content (used by public pages). */
import type { AppEnv } from './env';

export interface PublicQuestion {
  id: string;
  book_slug: string | null;
  title: string;
  body: string;
  slug: string;
  display_name: string;
  created_at: string;
  approved_at: string | null;
  response_count: number;
}

export interface PublicResponse {
  id: string;
  body: string;
  kind: string;
  display_name: string;
  created_at: string;
}

export async function getApprovedQuestionsForBook(env: AppEnv, bookSlug: string, limit = 50): Promise<PublicQuestion[]> {
  const res = await env.DB.prepare(
    `SELECT q.id, q.book_slug, q.title, q.body, q.slug, u.display_name, q.created_at, q.approved_at,
       (SELECT COUNT(*) FROM responses r WHERE r.question_id = q.id AND r.status = 'approved' AND r.deleted_at IS NULL) as response_count
     FROM questions q JOIN users u ON u.id = q.user_id
     WHERE q.book_slug = ? AND q.status = 'approved' AND q.deleted_at IS NULL
     ORDER BY q.approved_at DESC LIMIT ?`
  )
    .bind(bookSlug, limit)
    .all<PublicQuestion>();
  return res.results ?? [];
}

export async function getLatestApprovedQuestions(env: AppEnv, limit = 6): Promise<PublicQuestion[]> {
  const res = await env.DB.prepare(
    `SELECT q.id, q.book_slug, q.title, q.body, q.slug, u.display_name, q.created_at, q.approved_at,
       (SELECT COUNT(*) FROM responses r WHERE r.question_id = q.id AND r.status = 'approved' AND r.deleted_at IS NULL) as response_count
     FROM questions q JOIN users u ON u.id = q.user_id
     WHERE q.status = 'approved' AND q.deleted_at IS NULL
     ORDER BY q.approved_at DESC LIMIT ?`
  )
    .bind(limit)
    .all<PublicQuestion>();
  return res.results ?? [];
}

export async function getApprovedResponses(env: AppEnv, questionId: string): Promise<PublicResponse[]> {
  const res = await env.DB.prepare(
    `SELECT r.id, r.body, r.kind, u.display_name, r.created_at
     FROM responses r JOIN users u ON u.id = r.user_id
     WHERE r.question_id = ? AND r.status = 'approved' AND r.deleted_at IS NULL
     ORDER BY r.approved_at ASC`
  )
    .bind(questionId)
    .all<PublicResponse>();
  return res.results ?? [];
}

/** Safe wrapper: returns [] if the DB/runtime is unavailable (e.g., prerender). */
export async function safe<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}
