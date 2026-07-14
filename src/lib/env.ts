/**
 * Typed access to the Cloudflare runtime environment (bindings + vars).
 *
 * With @astrojs/cloudflare, bindings live on `Astro.locals.runtime.env`.
 * During local `astro dev`, platformProxy provides the same shape backed by
 * wrangler's local D1/KV/R2. We never read secrets at module scope.
 */

export interface AppEnv {
  // Bindings
  DB: D1Database;
  RATE_LIMIT?: KVNamespace;
  EXPORTS?: R2Bucket;
  // Vars
  SITE_URL?: string;
  EMAIL_PROVIDER?: string;
  EMAIL_PROVIDER_API_KEY?: string;
  EMAIL_FROM_ADDRESS?: string;
  EMAIL_FROM_NAME?: string;
  ADMIN_EMAIL?: string;
  SESSION_SECRET?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  ADMIN_BOOTSTRAP_TOKEN?: string;
}

export interface AppLocals {
  runtime?: { env: AppEnv };
}

/** Retrieve the runtime env from Astro locals, throwing if the DB is missing. */
export function getEnv(locals: unknown): AppEnv {
  const env = (locals as AppLocals)?.runtime?.env;
  if (!env || !env.DB) {
    throw new Error(
      'Cloudflare runtime env is unavailable. Ensure D1 binding "DB" is configured (wrangler.toml) and platformProxy is enabled for local dev.'
    );
  }
  return env;
}

/** Best-effort env access that returns undefined instead of throwing (for optional features). */
export function tryEnv(locals: unknown): AppEnv | undefined {
  return (locals as AppLocals)?.runtime?.env;
}

export function siteUrl(env: AppEnv): string {
  return (env.SITE_URL || 'https://cubechronicles.com').replace(/\/+$/, '');
}
