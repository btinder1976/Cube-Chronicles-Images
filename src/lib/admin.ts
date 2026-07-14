/** Admin guards, moderation actions, and audit logging. */
import type { AstroCookies } from 'astro';
import type { AppEnv } from './env';
import type { SessionUser } from './session';
import { uuid } from './crypto';
import { notifyResponseApproved } from './notify';

export function isAdmin(user: SessionUser | null): boolean {
  return !!user && user.role === 'admin' && user.status === 'active';
}

/** Returns the admin user or null. Pages call this and redirect if null. */
export function requireAdmin(user: SessionUser | null): SessionUser | null {
  return isAdmin(user) ? user : null;
}

export async function logAction(
  env: AppEnv,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  note?: string
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO moderation_actions (id, admin_id, action, target_type, target_id, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(uuid(), adminId, action, targetType, targetId, note ?? null, new Date().toISOString())
    .run();
}

export interface DashboardCounts {
  pendingQuestions: number;
  pendingResponses: number;
  openReports: number;
  users: number;
  failedNotifications: number;
  approvedQuestions: number;
}

export async function dashboardCounts(env: AppEnv): Promise<DashboardCounts> {
  const q = async (sql: string, ...binds: unknown[]) =>
    (await env.DB.prepare(sql).bind(...binds).first<{ c: number }>())?.c ?? 0;
  return {
    pendingQuestions: await q("SELECT COUNT(*) c FROM questions WHERE status='pending' AND deleted_at IS NULL"),
    pendingResponses: await q("SELECT COUNT(*) c FROM responses WHERE status='pending' AND deleted_at IS NULL"),
    openReports: await q("SELECT COUNT(*) c FROM content_reports WHERE status='open'"),
    users: await q('SELECT COUNT(*) c FROM users WHERE deleted_at IS NULL'),
    failedNotifications: await q("SELECT COUNT(*) c FROM notification_deliveries WHERE status='failed'"),
    approvedQuestions: await q("SELECT COUNT(*) c FROM questions WHERE status='approved' AND deleted_at IS NULL"),
  };
}

const VALID_QUESTION_ACTIONS = new Set(['approve', 'reject', 'archive', 'delete', 'restore', 'edit']);
const VALID_RESPONSE_ACTIONS = new Set(['approve', 'reject', 'delete', 'restore', 'edit']);
const VALID_USER_ACTIONS = new Set(['ban', 'suspend', 'activate']);

export async function moderateQuestion(
  env: AppEnv,
  adminId: string,
  id: string,
  action: string,
  editValue?: { title?: string; body?: string }
): Promise<boolean> {
  if (!VALID_QUESTION_ACTIONS.has(action)) return false;
  const now = new Date().toISOString();
  if (action === 'approve')
    await env.DB.prepare("UPDATE questions SET status='approved', approved_at=?, updated_at=? WHERE id=?").bind(now, now, id).run();
  else if (action === 'reject')
    await env.DB.prepare("UPDATE questions SET status='rejected', updated_at=? WHERE id=?").bind(now, id).run();
  else if (action === 'archive')
    await env.DB.prepare("UPDATE questions SET status='archived', updated_at=? WHERE id=?").bind(now, id).run();
  else if (action === 'delete')
    await env.DB.prepare('UPDATE questions SET deleted_at=?, updated_at=? WHERE id=?').bind(now, now, id).run();
  else if (action === 'restore')
    await env.DB.prepare("UPDATE questions SET deleted_at=NULL, status='pending', updated_at=? WHERE id=?").bind(now, id).run();
  else if (action === 'edit' && editValue)
    await env.DB.prepare('UPDATE questions SET title=COALESCE(?,title), body=COALESCE(?,body), updated_at=? WHERE id=?')
      .bind(editValue.title ?? null, editValue.body ?? null, now, id).run();
  await logAction(env, adminId, action, 'question', id);
  return true;
}

export async function moderateResponse(
  env: AppEnv,
  adminId: string,
  id: string,
  action: string,
  editValue?: { body?: string }
): Promise<{ ok: boolean; notified?: { sent: number; failed: number } }> {
  if (!VALID_RESPONSE_ACTIONS.has(action)) return { ok: false };
  const now = new Date().toISOString();
  let notified;
  if (action === 'approve') {
    await env.DB.prepare("UPDATE responses SET status='approved', approved_at=?, updated_at=? WHERE id=?").bind(now, now, id).run();
    // Fire notifications to subscribers (excluding the author).
    notified = await notifyResponseApproved(env, id);
  } else if (action === 'reject')
    await env.DB.prepare("UPDATE responses SET status='rejected', updated_at=? WHERE id=?").bind(now, id).run();
  else if (action === 'delete')
    await env.DB.prepare('UPDATE responses SET deleted_at=?, updated_at=? WHERE id=?').bind(now, now, id).run();
  else if (action === 'restore')
    await env.DB.prepare("UPDATE responses SET deleted_at=NULL, status='pending', updated_at=? WHERE id=?").bind(now, id).run();
  else if (action === 'edit' && editValue)
    await env.DB.prepare('UPDATE responses SET body=COALESCE(?,body), updated_at=? WHERE id=?').bind(editValue.body ?? null, now, id).run();
  await logAction(env, adminId, action, 'response', id);
  return { ok: true, notified };
}

export async function moderateUser(env: AppEnv, adminId: string, id: string, action: string): Promise<boolean> {
  if (!VALID_USER_ACTIONS.has(action)) return false;
  // Never let an admin lock themselves out.
  if (id === adminId) return false;
  const now = new Date().toISOString();
  const status = action === 'ban' ? 'banned' : action === 'suspend' ? 'suspended' : 'active';
  await env.DB.prepare('UPDATE users SET status=?, updated_at=? WHERE id=?').bind(status, now, id).run();
  if (status !== 'active') await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id).run();
  await logAction(env, adminId, action, 'user', id);
  return true;
}
