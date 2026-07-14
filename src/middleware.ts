/**
 * Global middleware:
 *  - attaches the current session user to locals (available in every page)
 *  - ensures a CSRF token cookie exists
 *  - applies security headers to every HTML response
 *  - blocks indexing of private areas via X-Robots-Tag
 */
import { defineMiddleware } from 'astro:middleware';
import { tryEnv } from './lib/env';
import { getSessionUser } from './lib/session';
import { ensureCsrfToken } from './lib/csrf';
import { securityHeaders } from './lib/security';

const NOINDEX_PREFIXES = ['/admin', '/account', '/api', '/verify', '/unsubscribe', '/logout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const env = tryEnv(context.locals);

  // Session (best-effort; static prerendered pages won't have runtime env)
  context.locals.user = null;
  if (env?.DB) {
    try {
      context.locals.user = await getSessionUser(env, context.cookies);
    } catch {
      context.locals.user = null;
    }
    ensureCsrfToken(context.cookies);
  }

  const response = await next();

  // Only decorate HTML/text responses (skip static assets handled by CDN)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    for (const [k, v] of Object.entries(securityHeaders())) response.headers.set(k, v);
    const path = new URL(context.request.url).pathname;
    if (NOINDEX_PREFIXES.some((p) => path.startsWith(p))) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
  }
  return response;
});
