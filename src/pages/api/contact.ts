import type { APIContext } from 'astro';
import { getEnv, siteUrl } from '../../lib/env';
import { verifyCsrf } from '../../lib/csrf';
import { verifyTurnstile } from '../../lib/turnstile';
import { rateLimit, clientIp } from '../../lib/ratelimit';
import { validateEmail } from '../../lib/validation';
import { sendEmail } from '../../lib/email';
import { escapeHtml, excerpt } from '../../lib/sanitize';
import { redirect, redirectErr } from '../../lib/http';

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  const env = getEnv(context.locals);
  const form = await context.request.formData();

  if (!verifyCsrf(context.request, context.cookies, form, siteUrl(env))) return redirectErr('/contact', 'csrf');
  // Honeypot: real users leave it empty.
  if (String(form.get('website') || '').trim() !== '') return redirect('/contact?msg=posted');

  const ip = clientIp(context.request);
  const rl = await rateLimit(env, `contact:${ip}`, 5, 3600);
  if (!rl.allowed) return redirectErr('/contact', 'ratelimited');

  const ok = await verifyTurnstile(env, String(form.get('cf-turnstile-response') || ''), ip);
  if (!ok) return redirectErr('/contact', 'turnstile');

  const email = validateEmail(form.get('email'));
  const name = String(form.get('name') || '').trim().slice(0, 80);
  const message = String(form.get('message') || '').trim().slice(0, 4000);
  if (!email.ok || !name || message.length < 2) return redirectErr('/contact', 'invalid');

  const admin = env.ADMIN_EMAIL || env.EMAIL_FROM_ADDRESS || '';
  if (admin) {
    await sendEmail(env, {
      to: admin,
      subject: `Contact form: ${excerpt(message, 60)}`,
      text: `From: ${name} <${email.value}>\nIP: ${ip}\n\n${message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email.value)}&gt;</p><p><strong>IP:</strong> ${escapeHtml(ip)}</p><hr><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
    });
  }
  return redirect('/contact?msg=posted');
}

export function GET(): Response {
  return redirect('/contact');
}
