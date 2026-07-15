# Claude prompt — complete Cube Chronicles Cloudflare deployment readiness

You are working inside the repository `btinder1976/Cube-Chronicles-Images` for the official Cube Chronicles website.

Read this file completely, inspect the full repository, and continue until all repository-side work is complete. Do not stop after writing a plan.

## Current state

The site is an Astro SSR application using `@astrojs/cloudflare`. It contains 15 book pages, editorial FAQs, registration/login, community questions and responses, moderation/admin pages, D1 migrations, seed data, SEO files, email adapters, Turnstile support, and Cloudflare documentation.

Recent repository preparation already completed:

1. `src/components/Cover.astro` now uses the committed fallback cover files directly:
   - `/public/covers/book-01.jpg` through `/public/covers/book-15.jpg`
2. `wrangler.toml` no longer contains fake D1/KV/R2/Turnstile IDs.
3. Initial email mode is `log` so the site can be tested before Resend is configured.
4. `docs/CLOUDFLARE_FIRST_DEPLOY.md` contains the human deployment checklist.

## Required work

### 1. Full repository audit

Recursively inspect the project and identify:

- build errors,
- TypeScript errors,
- missing imports,
- Cloudflare runtime incompatibilities,
- broken routes,
- missing static assets,
- malformed structured data,
- invalid links,
- security defects,
- D1 schema/code mismatches,
- authentication/session defects,
- email-flow defects,
- Turnstile-flow defects,
- admin authorization defects,
- accidental exposure of manuscripts or private user information.

Document findings in `docs/final-readiness-audit.md` and fix every clear issue.

### 2. Install and verify

Run:

```bash
npm ci
npm run build
npm run check
npm test
npm run lint:links
npm run verify:seo
```

If `npm run check` lacks required packages, add compatible versions of `@astrojs/check` and `typescript`, update `package-lock.json`, and run the command again.

Run end-to-end tests where practical. Do not claim a command passed unless it actually passed.

### 3. Cloudflare configuration

Ensure the project remains compatible with a Cloudflare Pages Git deployment using:

- production branch: `main`
- build command: `npm run build`
- output directory: `dist`
- Node 20 or later
- required D1 binding name: `DB`

Do not insert fake account IDs. Do not commit secrets.

Keep optional KV and R2 bindings out of the initial deployment unless the application truly requires them. If code assumes they always exist, make those features degrade safely when bindings are absent.

### 4. D1 verification

Compare all SQL used by the application against:

- `migrations/0001_init.sql`
- `db/seed.sql`

Verify:

- table and column names match,
- indexes and foreign keys are appropriate,
- seed operations are idempotent or clearly documented,
- registration, login, sessions, verification, questions, responses, subscriptions, reports, moderation, notification delivery, export, and account deletion use valid schema,
- no raw session or verification token is stored when a secure hash should be used.

Fix all mismatches and add tests where needed.

### 5. Cover and series images

Confirm all files exist:

```text
public/covers/book-01.jpg
...
public/covers/book-15.jpg
```

Confirm the homepage and book listing display all 15 front covers and each cover links to the correct individual book page.

The repository root contains `SeriesImage.png`. Copy it to:

```text
public/seriesimage.png
```

Do not delete the root original unless there is a clear reason. Review the homepage and choose the strongest placement for the series image. Preferred options, in order:

1. a dedicated visual series-introduction section between the hero and the 15-book grid,
2. the hero only if it remains readable and responsive,
3. a wide banner immediately above the book grid.

Do not let the series image overpower or replace the individual book covers. Add descriptive alt text and responsive sizing.

### 6. Content and book navigation

Verify all 15 books have:

- correct title,
- correct number,
- correct cover,
- correct slug,
- correct previous/next navigation,
- manuscript-grounded description,
- manuscript-grounded FAQ content,
- no major spoilers unless clearly labeled,
- no fabricated publication availability or retailer links.

Confirm every homepage cover and `/books` cover opens the matching page.

### 7. Registration and community behavior

Verify the intended behavior:

- users register with name and email,
- email must be verified before posting,
- questions and responses are associated with the user,
- public pages never reveal private email addresses,
- user content is sanitized,
- moderation is enforced before public display where designed,
- subscribers receive a notification when an approved response is posted,
- unsubscribe links work,
- rate-limiting degrades safely if optional KV is absent,
- CSRF and session protections are effective in the Cloudflare runtime.

### 8. Email modes

Keep three clear modes:

- `log` for initial deployment testing,
- `resend` for production delivery,
- any other provider only if fully supported and documented.

Ensure missing Resend credentials do not falsely report a production email as delivered. Log mode should be clearly identified in admin delivery records.

### 9. SEO and AI-search readiness

Verify and improve where needed:

- unique titles and descriptions,
- canonical URLs,
- Book, BookSeries, BreadcrumbList, WebSite, Organization/Person, and appropriate FAQ structured data,
- sitemap,
- robots file,
- RSS,
- Open Graph and social images,
- `llms.txt` and `llms-full.txt`,
- crawlable semantic HTML,
- internal linking between series, books, FAQs, and related questions,
- accessible headings,
- descriptive cover alt text,
- performance-conscious image loading.

Do not promise first-place rankings or use spammy keyword stuffing. Optimize for accuracy, usefulness, authority, accessibility, and clean technical implementation.

### 10. Security and privacy

Review especially:

- admin bootstrap flow,
- role checks,
- session cookies,
- token hashing,
- verification-token expiration,
- passwordless login behavior if used,
- CSRF,
- open redirects,
- HTML injection,
- SQL parameter binding,
- email header/content injection,
- public exports,
- account deletion,
- logs containing secrets or private data.

Never commit real API keys, tokens, Cloudflare IDs tied to a private account, or user data.

### 11. Final documentation

Update or create:

- `docs/final-readiness-audit.md`
- `docs/CLOUDFLARE_FIRST_DEPLOY.md`
- `docs/cloudflare-setup.md`
- `README.md`

The final documentation must clearly separate:

- repository work Claude completed,
- Cloudflare dashboard actions the owner must perform,
- secrets the owner must create,
- first-test settings,
- production settings,
- verification tests after deployment.

### 12. Final response

At completion, report:

- files changed,
- commands run,
- tests passed,
- tests that could not run and why,
- remaining Cloudflare account steps,
- exact build command and output directory,
- exact required binding and secret names,
- any unresolved risk.

Do not stop for routine clarification. Inspect the repository and make reasonable, documented decisions. Preserve the manuscripts and cover artwork. Do not expose unpublished manuscripts on the public site.
