/** Server-side input validation. Pure functions, unit-tested, no I/O. */

export interface FieldError {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldError[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const LIMITS = {
  displayNameMin: 2,
  displayNameMax: 40,
  passwordMin: 10,
  passwordMax: 200,
  questionTitleMin: 8,
  questionTitleMax: 140,
  questionBodyMin: 0,
  questionBodyMax: 4000,
  responseBodyMin: 2,
  responseBodyMax: 6000,
  reportReasonMax: 1000,
} as const;

export function isEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim()) && v.trim().length <= 254;
}

export function validateEmail(v: unknown): ValidationResult<string> {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return err('email', 'Email is required.');
  if (!isEmail(s)) return err('email', 'Please enter a valid email address.');
  return ok(s);
}

export function validateDisplayName(v: unknown): ValidationResult<string> {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (s.length < LIMITS.displayNameMin) return err('displayName', 'Display name is too short.');
  if (s.length > LIMITS.displayNameMax) return err('displayName', 'Display name is too long.');
  if (!/^[\p{L}\p{N} .,'\-_!?]+$/u.test(s))
    return err('displayName', 'Display name contains invalid characters.');
  return ok(s);
}

export function validatePassword(v: unknown): ValidationResult<string> {
  const s = String(v ?? '');
  if (s.length < LIMITS.passwordMin)
    return err('password', `Password must be at least ${LIMITS.passwordMin} characters.`);
  if (s.length > LIMITS.passwordMax) return err('password', 'Password is too long.');
  // encourage a mix without being punishing
  if (!/[a-zA-Z]/.test(s) || !/[0-9]/.test(s))
    return err('password', 'Password must include at least one letter and one number.');
  return ok(s);
}

export function validateQuestion(title: unknown, body: unknown): ValidationResult<{ title: string; body: string }> {
  const errors: FieldError[] = [];
  const t = String(title ?? '').trim().replace(/\s+/g, ' ');
  const b = String(body ?? '').trim();
  if (t.length < LIMITS.questionTitleMin) errors.push({ field: 'title', message: 'Please write a clearer, longer question title.' });
  if (t.length > LIMITS.questionTitleMax) errors.push({ field: 'title', message: 'Question title is too long.' });
  if (b.length > LIMITS.questionBodyMax) errors.push({ field: 'body', message: 'Question details are too long.' });
  if (errors.length) return { ok: false, errors };
  return ok({ title: t, body: b });
}

export function validateResponse(body: unknown): ValidationResult<string> {
  const b = String(body ?? '').trim();
  if (b.length < LIMITS.responseBodyMin) return err('body', 'Your response is empty.');
  if (b.length > LIMITS.responseBodyMax) return err('body', 'Your response is too long.');
  return ok(b);
}

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}
function err(field: string, message: string): ValidationResult<never> {
  return { ok: false, errors: [{ field, message }] };
}
