# Launch checklist

Work top to bottom. Details are in the linked docs.

## 1. Content
- [x] 15 books verified against manuscripts and covers (`docs/content-audit.md`).
- [x] 269 editorial FAQs (245 book + 24 series), spoiler answers gated.
- [ ] Add real cover images to `scripts/source-covers/` and run `npm run images:optimize` (see `docs/cloudflare-setup.md`).
- [ ] Add real retailer/purchase links in `src/content/retailers.json` (placeholders show clearly until then).

## 2. Cloudflare resources (`docs/cloudflare-setup.md`)
- [ ] `wrangler d1 create cubechronicles` → paste `database_id`.
- [ ] `wrangler kv namespace create RATE_LIMIT` and `SESSION` → paste IDs.
- [ ] (optional) `wrangler r2 bucket create cubechronicles-exports`.
- [ ] `npm run db:migrate:remote && npm run db:seed:remote`.

## 3. Secrets & vars
- [ ] `SESSION_SECRET`, `TURNSTILE_SECRET_KEY`, `EMAIL_PROVIDER_API_KEY`, `ADMIN_BOOTSTRAP_TOKEN` set via `wrangler pages secret put`.
- [ ] `[vars]` in `wrangler.toml`: `SITE_URL`, `EMAIL_*`, `ADMIN_EMAIL`, `PUBLIC_TURNSTILE_SITE_KEY`.
- [ ] Confirm `.dev.vars` / `.env` are **not** committed (they're git-ignored).

## 4. Email (`docs/email-setup.md`)
- [ ] Verify sending domain (SPF/DKIM/DMARC).
- [ ] Send a test verification + notification email.

## 5. Turnstile
- [ ] Add site key (`[vars]`) and secret key (secret).

## 6. Domain (`docs/domain-setup.md`)
- [ ] Point `cubechronicles.com` nameservers at Cloudflare.
- [ ] Add custom domains to the Pages project; redirect `www` → apex.
- [ ] SSL/TLS: Full (strict).

## 7. Build & verify
- [ ] `npm run build`
- [ ] `npm test` (unit) — expect 46 passing.
- [ ] `npm run db:migrate:local && npm run db:seed:local && npx vitest run --config vitest.integration.config.ts` — expect 3 passing.
- [ ] `npm run test:e2e` — expect 7 passing (set `PW_CHROME_PATH` in sandboxes).
- [ ] `npm run verify:seo` and `npm run lint:links` — expect passing.

## 8. Deploy
- [ ] `npm run deploy` (or connect Git in the Pages dashboard).

## 9. First admin (`docs/admin-guide.md`)
- [ ] Register → confirm email → `/admin/bootstrap` with the token → verify dashboard.
- [ ] Rotate/remove `ADMIN_BOOTSTRAP_TOKEN`.

## 10. Legal (`docs/privacy-launch-checklist.md`)
- [ ] Attorney review of all legal pages; set minimum age/consent stance.
- [ ] Replace placeholder contact/owner details.

## 11. Post-launch
- [ ] Submit `sitemap.xml` to Google Search Console & Bing.
- [ ] Run Lighthouse (target 90+) and axe accessibility pass.
- [ ] Validate structured data (Rich Results Test).
- [ ] Enable Cloudflare Web Analytics; update `/cookies` accordingly.
- [ ] Watch the admin queues and the notification delivery log.
