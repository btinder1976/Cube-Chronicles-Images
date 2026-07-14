# Architecture

## Stack

- **Framework:** Astro 5 + TypeScript, `output: 'server'` with the `@astrojs/cloudflare` adapter.
- **Hosting:** Cloudflare Pages (the build in `dist/` includes a `_worker.js` for SSR routes).
- **Database:** Cloudflare D1 (SQLite) via the `DB` binding.
- **KV:** `RATE_LIMIT` (rate-limit counters) and `SESSION` (required by the adapter's session driver).
- **R2:** `EXPORTS` (optional; owner exports also stream directly).
- **Bot protection:** Cloudflare Turnstile (server-verified).
- **Email:** provider adapter (Resend / MailChannels / dev `log`).

## Rendering strategy

Pages that are purely editorial are **prerendered** to static HTML for speed and cacheability:
`/`'s legal/marketing siblings — `/about`, `/faq`, `/series-facts`, `/ask`, `/privacy`, `/terms`, `/community-guidelines`, `/cookies`, `/404`, plus `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`.

Pages that need per-request data are **server-rendered**:

- `/` (homepage) — shows latest approved community questions.
- `/books` — server-side region/era/theme filtering from query params (with an always-present crawlable full list).
- `/books/[slug]` — approved community Q&A, submission forms, session-aware UI.
- `/contact` — CSRF-tokened form.
- All `/account`, `/admin`, `/api/*`, `/rss.xml`, auth pages.

> Note: because the homepage and books index are server-rendered, they are not emitted as static files in `dist/` — this is expected.

## Data flow

```
src/content/*.json  ──►  src/lib/content.ts  ──►  Astro pages (static editorial content, FAQs)
                     └─►  migrations/seed derived copy in D1 (books, editorial_faqs) for admin/joins

Browser ──► Astro SSR route ──► src/lib/* (auth, session, community, admin) ──► D1 (parameterized)
                                                     └─► email adapter ──► provider
```

Editorial content has a single source of truth: `src/content/books.json`, `series.json`, and `series-faqs.json`. `db/seed.sql` is **generated** from those files (`scripts/make_seed.py`) so D1 holds a queryable copy for the admin and for foreign-key references from community rows.

## Directory map

```
src/
  content/        books.json, series.json, series-faqs.json, retailers.json
  lib/            env, crypto, session, auth, csrf, turnstile, ratelimit, security,
                  validation, sanitize, db, content, community, notify, admin, email,
                  csv, http, slug, retailers
  layouts/        Base.astro
  components/     Header, Footer, Seo, JsonLd, BookCard, Cover, Breadcrumbs,
                  FaqList, Turnstile, Flash, PrevNext, AdminNav
  pages/
    index, books/index, books/[slug], faq, about, series-facts, ask, contact,
    privacy, terms, community-guidelines, cookies, 404,
    register, login, verify, unsubscribe, account/index,
    admin/(index,questions,responses,reports,users,notifications,exports,bootstrap),
    api/(register,login,logout,questions,responses,report,subscribe,contact,
         preferences,resend-verification, admin/(moderate,resend,bootstrap,export)),
    robots.txt, sitemap.xml, rss.xml, llms.txt, llms-full.txt
  middleware.ts   session hydration, CSRF cookie, security headers, noindex for private areas
migrations/       0001_init.sql
db/               seed.sql (generated)
scripts/          optimize-images, make_seed, normalize_books, make_series_faqs,
                  check-links, verify-seo
tests/            unit/*, integration/*, e2e/*
```

## Security model

- **Passwords:** PBKDF2-HMAC-SHA-256, 210k iterations, per-user salt (Web Crypto). Only the hash is stored.
- **Sessions:** random token in an HttpOnly/Secure/SameSite=Lax cookie; only the SHA-256 hash is stored in D1; sessions expire (30 days) and rotate on login; revoked on ban/suspend.
- **Email verification & unsubscribe:** tokens stored as hashes / random opaque strings; required before posting.
- **CSRF:** double-submit cookie + same-origin Origin/Referer checks on every state-changing POST.
- **Turnstile:** server-verified on register, login, question, response, and contact.
- **Rate limiting:** KV counters (D1 fallback) per action and per IP/user.
- **Input:** validated server-side; user text is escaped and rendered as plain paragraphs (no HTML injection possible).
- **Headers:** strict CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; `X-Robots-Tag: noindex` on `/admin`, `/account`, `/api`, and token URLs.
- **Authorization:** admin actions gated by `role='admin'` server-side; an admin cannot ban/suspend themselves or other admins via the UI.

## Notifications

When an admin approves a response, `notifyResponseApproved` emails every **active, verified** subscriber of the question **except the response's author**, logging each attempt in `notification_deliveries`. Failed deliveries can be resent from the admin Notifications tab. The rule is unit-tested (`shouldNotify`) and integration-tested against real D1.

## Performance budget

Targets for a book page (the heaviest content page):

| Metric | Budget |
|---|---|
| HTML (SSR) | < 60 KB gzipped |
| CSS | < 20 KB gzipped (scoped + global, mostly inlined) |
| JavaScript shipped | ~0 KB of framework JS (Astro ships none by default); only Turnstile's async script on form pages |
| LCP image | one preloaded cover (`fetchpriority=high`), responsive AVIF/WebP/JPEG |
| CLS | ~0 — every image has explicit `width`/`height`/`aspect-ratio` |
| Fonts | system font stack (no web-font download) |

Covers are served as AVIF/WebP/JPEG at 320/480/640/960 widths with `srcset`/`sizes`; only the book-hero cover is eager/high-priority, the rest lazy-load.
