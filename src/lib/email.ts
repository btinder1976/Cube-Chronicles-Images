/**
 * Transactional email via a provider adapter. Supported providers:
 *  - "log"          → prints the email to the console (default for local dev)
 *  - "resend"       → https://resend.com  (EMAIL_PROVIDER_API_KEY = re_...)
 *  - "mailchannels" → MailChannels Workers API (no key; requires domain SPF/DKIM)
 *
 * No secrets are hard-coded. Every send is recorded by the caller in
 * notification_deliveries so the admin can audit and resend failures.
 */
import type { AppEnv } from './env';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  ok: boolean;
  provider: string;
  providerId?: string;
  error?: string;
}

export async function sendEmail(env: AppEnv, msg: EmailMessage): Promise<SendResult> {
  const provider = (env.EMAIL_PROVIDER || 'log').toLowerCase();
  const from = `${env.EMAIL_FROM_NAME || 'The Cube Chronicles'} <${env.EMAIL_FROM_ADDRESS || 'no-reply@cubechronicles.com'}>`;
  try {
    if (provider === 'log' || (provider === 'resend' && !env.EMAIL_PROVIDER_API_KEY)) {
      console.log('\n===== [email:log] =====');
      console.log('From:', from);
      console.log('To:', msg.to);
      console.log('Subject:', msg.subject);
      console.log(msg.text);
      console.log('=======================\n');
      return { ok: true, provider: 'log', providerId: 'logged' };
    }

    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.EMAIL_PROVIDER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
      });
      if (!res.ok) return { ok: false, provider, error: `resend ${res.status}: ${await res.text()}` };
      const data = (await res.json()) as { id?: string };
      return { ok: true, provider, providerId: data.id };
    }

    if (provider === 'mailchannels') {
      const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: msg.to }] }],
          from: { email: env.EMAIL_FROM_ADDRESS, name: env.EMAIL_FROM_NAME },
          subject: msg.subject,
          content: [
            { type: 'text/plain', value: msg.text },
            { type: 'text/html', value: msg.html },
          ],
        }),
      });
      if (!res.ok) return { ok: false, provider, error: `mailchannels ${res.status}: ${await res.text()}` };
      return { ok: true, provider };
    }

    return { ok: false, provider, error: `Unknown EMAIL_PROVIDER "${provider}"` };
  } catch (e) {
    return { ok: false, provider, error: String(e) };
  }
}

// ----------------------- Templates -----------------------

function shell(title: string, bodyHtml: string, siteUrl: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f1e7;font-family:Georgia,serif;color:#241c12">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#1b2a4a;color:#f3e6c4;padding:18px 24px;border-radius:10px 10px 0 0">
      <strong style="font-size:18px;letter-spacing:.02em">The Cube Chronicles</strong>
    </div>
    <div style="background:#fffdf7;padding:24px;border:1px solid #e6dcc4;border-top:none;border-radius:0 0 10px 10px">
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#7a6f57;font-size:12px;margin-top:16px">
      Sent by The Cube Chronicles · <a href="${siteUrl}" style="color:#8a6d1f">${siteUrl.replace(/^https?:\/\//, '')}</a>
    </p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<p><a href="${href}" style="display:inline-block;background:#8a6d1f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${label}</a></p>`;
}

export function verificationEmail(siteUrl: string, displayName: string, verifyUrl: string): EmailMessage {
  const html = shell(
    'Confirm your email',
    `<p>Hi ${escape(displayName)},</p>
     <p>Thanks for joining the Cube Chronicles reader community. Please confirm your email address to start asking and answering questions.</p>
     ${button(verifyUrl, 'Confirm my email')}
     <p style="font-size:13px;color:#5c5341">Or paste this link into your browser:<br><span style="word-break:break-all">${verifyUrl}</span></p>
     <p style="font-size:13px;color:#5c5341">If you didn't create this account, you can safely ignore this email.</p>`,
    siteUrl
  );
  const text = `Hi ${displayName},\n\nConfirm your email to join the Cube Chronicles reader community:\n${verifyUrl}\n\nIf you didn't create this account, ignore this email.`;
  return { to: '', subject: 'Confirm your email · The Cube Chronicles', html, text };
}

export function responseNotificationEmail(opts: {
  siteUrl: string;
  bookTitle: string;
  questionTitle: string;
  responseExcerpt: string;
  discussionUrl: string;
  unsubscribeUrl: string;
}): EmailMessage {
  const { siteUrl, bookTitle, questionTitle, responseExcerpt, discussionUrl, unsubscribeUrl } = opts;
  const html = shell(
    'New reply to a discussion you follow',
    `<p>A new response was approved on a discussion you're following.</p>
     <p style="margin:0"><strong>Book:</strong> ${escape(bookTitle)}</p>
     <p style="margin:0 0 12px"><strong>Question:</strong> ${escape(questionTitle)}</p>
     <blockquote style="border-left:3px solid #d9c78f;margin:0 0 16px;padding:4px 0 4px 14px;color:#4a4133">${escape(responseExcerpt)}</blockquote>
     ${button(discussionUrl, 'Read the full reply')}
     <p style="font-size:12px;color:#7a6f57">You're receiving this because you subscribed to this discussion.<br>
     <a href="${unsubscribeUrl}" style="color:#8a6d1f">Unsubscribe from this discussion</a>.</p>`,
    siteUrl
  );
  const text = `New response on a discussion you follow.\n\nBook: ${bookTitle}\nQuestion: ${questionTitle}\n\n"${responseExcerpt}"\n\nRead it: ${discussionUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { to: '', subject: `New reply · ${questionTitle}`, html, text };
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
