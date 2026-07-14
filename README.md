# The Cube Chronicles — Official Website

Production-ready website for **CubeChronicles.com**, the official home of _The Cube Chronicles_, a 15-book historical time-travel adventure series by Jeremy Tinder.

Built with **Astro + TypeScript** on **Cloudflare** (Pages/Workers, D1, KV, R2, Turnstile). Static, content-heavy pages are prerendered; authentication, the moderated reader community, and the admin area run on the Cloudflare runtime.

## What's inside

- **Homepage, books index, and 15 individual book pages** — every book has its own optimized landing page using its front-only cover, spoiler-free description, characters, themes, reading-order navigation, purchase buttons, and a manuscript-grounded FAQ.
- **269 editorial FAQs** (245 book-level + 24 series-level), grounded strictly in the manuscripts, with spoiler answers gated behind disclosures and excluded from structured data.
- **Registration, email verification, sessions, and login** — passwords hashed with PBKDF2 (Web Crypto), HttpOnly cookies, session rotation.
- **Moderated community Q&A** — questions, answers, and comments default to pending; subscriptions; email notifications on approval; report-abuse; soft deletes.
- **Admin area** — dashboard, moderation queues, user management, notification log with resend, and CSV/JSON exports.
- **SEO & AI-readability** — per-page titles/descriptions/canonicals, Open Graph/Twitter, JSON-LD (`WebSite`, `BookSeries`, `Book`, `BreadcrumbList`, `FAQPage`), `sitemap.xml`, `robots.txt`, RSS, `llms.txt`, and `llms-full.txt`.
- **Security** — CSRF protection, Turnstile, rate limiting, strict CSP + secure headers, parameterized D1 queries, server-side sanitization.
- **Tests** — 46 unit, 3 integration (real local D1), 7 end-to-end (real SSR server).

## Quick start (local development)

```bash
npm install
cp .dev.vars.example .dev.vars          # fill in local values (EMAIL_PROVIDER="log" is fine)

# Set up the local database
npm run db:migrate:local
npm run db:seed:local

# Generate optimized cover derivatives (place source covers first — see docs/cloudflare-setup.md)
npm run images:optimize

npm run dev                              # http://localhost:4321
```

Reading the site never requires an account. To post, register, confirm your email (printed to the console with `EMAIL_PROVIDER="log"`), then ask/answer on a book page.

To become the first admin: sign in, confirm your email, visit `/admin/bootstrap`, and enter your `ADMIN_BOOTSTRAP_TOKEN`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server (Astro + platform proxy) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the build with `wrangler pages dev` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) — see `playwright.config.ts` |
| `npm run lint:links` | Broken-link check over `dist/` |
| `npm run verify:seo` | SEO + JSON-LD validation over `dist/` |
| `npm run images:optimize` | Generate AVIF/WebP/JPEG cover derivatives |
| `npm run db:migrate:local` / `:remote` | Apply D1 migrations |
| `npm run db:seed:local` / `:remote` | Seed books + editorial FAQs |
| `npm run deploy` | Build and deploy to Cloudflare Pages |

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how it's built and why
- [`docs/content-audit.md`](docs/content-audit.md) — sources and how content was verified
- [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md) — create D1/KV/R2, Turnstile, deploy
- [`docs/domain-setup.md`](docs/domain-setup.md) — point cubechronicles.com at Cloudflare
- [`docs/email-setup.md`](docs/email-setup.md) — configure the email provider
- [`docs/admin-guide.md`](docs/admin-guide.md) — moderating and exporting data
- [`docs/seo-checklist.md`](docs/seo-checklist.md) — SEO/performance verification
- [`docs/privacy-launch-checklist.md`](docs/privacy-launch-checklist.md) — legal review before launch
- [`docs/launch-checklist.md`](docs/launch-checklist.md) — full go-live steps

## Important constraints honored

The full manuscripts are never published. No book facts, reviews, ratings, ISBNs, or retailer links are fabricated. The guiding presence called "the Maker" is never depicted as a character. No secrets or personal user data are committed to the repository.
