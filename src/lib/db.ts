/**
 * Thin, typed helpers over Cloudflare D1. All queries are parameterized.
 * Row shapes mirror the migration schema in /migrations.
 */
import type { AppEnv } from './env';

export interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  email_verified: number;
  role: string; // 'user' | 'admin'
  status: string; // 'active' | 'suspended' | 'banned'
  consent_email_at: string | null;
  notify_default: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface QuestionRow {
  id: string;
  book_slug: string | null;
  user_id: string;
  title: string;
  body: string;
  slug: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'archived'
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  deleted_at: string | null;
}

export interface ResponseRow {
  id: string;
  question_id: string;
  user_id: string;
  body: string;
  kind: string; // 'answer' | 'comment'
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  deleted_at: string | null;
}

export function db(env: AppEnv): D1Database {
  return env.DB;
}

export async function getUserByEmail(env: AppEnv, email: string): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL')
    .bind(email.toLowerCase())
    .first<UserRow>();
}

export async function getUserById(env: AppEnv, id: string): Promise<UserRow | null> {
  return env.DB.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL')
    .bind(id)
    .first<UserRow>();
}

export async function nowIso(): Promise<string> {
  return new Date().toISOString();
}
