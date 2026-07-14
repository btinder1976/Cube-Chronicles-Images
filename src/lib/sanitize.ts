/**
 * User-content safety: we never allow raw HTML from users. All user text is
 * HTML-escaped and then rendered as plain paragraphs. This eliminates stored
 * XSS by construction rather than trying to filter "safe" tags.
 */

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Normalize incoming user text: trim, collapse excessive blank lines, strip control chars. */
export function normalizeUserText(input: string): string {
  return input
    .replace(/\r\n/g, '\n')
    // strip control characters except tab and newline
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Convert normalized, escaped user text into safe paragraph HTML.
 * Autolinks bare URLs to a safe anchor with rel="nofollow ugc noopener".
 */
export function renderUserText(input: string): string {
  const normalized = normalizeUserText(input);
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs
    .map((p) => {
      const escaped = escapeHtml(p).replace(/\n/g, '<br>');
      const linked = escaped.replace(
        /\b(https?:\/\/[^\s<]+)/g,
        (url) => `<a href="${url}" rel="nofollow ugc noopener" target="_blank">${url}</a>`
      );
      return `<p>${linked}</p>`;
    })
    .join('\n');
}

/** Short plain-text excerpt for notification emails / meta (no HTML). */
export function excerpt(input: string, maxLen = 160): string {
  const text = normalizeUserText(input).replace(/\s+/g, ' ');
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).replace(/\s+\S*$/, '') + '…';
}
