/**
 * Rate limiting. Uses the KV binding when available (fast, TTL-based counters),
 * otherwise falls back to a D1-backed sliding window on rate_limit_events.
 * Fails open on infrastructure errors so a KV outage never locks users out.
 */
import type { AppEnv } from './env';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function rateLimit(
  env: AppEnv,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const bucketKey = `rl:${key}`;
  try {
    if (env.RATE_LIMIT) {
      const raw = await env.RATE_LIMIT.get(bucketKey);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= limit) {
        return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds };
      }
      await env.RATE_LIMIT.put(bucketKey, String(count + 1), { expirationTtl: windowSeconds });
      return { allowed: true, remaining: limit - count - 1, retryAfterSeconds: 0 };
    }
    // D1 fallback: count events in the window
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const row = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM rate_limit_events WHERE bucket = ? AND created_at > ?'
    )
      .bind(key, since)
      .first<{ c: number }>();
    const count = row?.c ?? 0;
    if (count >= limit) return { allowed: false, remaining: 0, retryAfterSeconds: windowSeconds };
    await env.DB.prepare(
      'INSERT INTO rate_limit_events (id, bucket, created_at) VALUES (?, ?, ?)'
    )
      .bind(crypto.randomUUID(), key, new Date().toISOString())
      .run();
    return { allowed: true, remaining: limit - count - 1, retryAfterSeconds: 0 };
  } catch (e) {
    console.error('[ratelimit] error (failing open):', e);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0'
  );
}
