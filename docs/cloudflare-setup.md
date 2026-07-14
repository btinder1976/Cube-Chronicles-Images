# Cloudflare setup

Everything below runs in **your** Cloudflare account. Nothing here contains secrets. Replace each `REPLACE_ME_*` in `wrangler.toml` with the IDs you get.

## 0. Prerequisites

```bash
npm install
npx wrangler login
```

## 1. Create the D1 database

```bash
npx wrangler d1 create cubechronicles
```

Copy the printed `database_id` into `wrangler.toml` → `[[d1_databases]] database_id`.

Apply the schema and seed the books + editorial FAQs:

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

(Use the `:local` variants for local development first.)

## 2. Create KV namespaces

```bash
npx wrangler kv namespace create RATE_LIMIT
npx wrangler kv namespace create SESSION
```

Paste each returned `id` into `wrangler.toml` (`RATE_LIMIT` and `SESSION`). `SESSION` is required by the Astro Cloudflare adapter; `RATE_LIMIT` backs application rate limiting.

## 3. (Optional) Create the R2 export bucket

```bash
npx wrangler r2 bucket create cubechronicles-exports
```

Exports also stream directly from the admin UI, so R2 is optional.

## 4. Turnstile

1. Dashboard → Turnstile → **Add site** for `cubechronicles.com`.
2. Put the **site key** in `wrangler.toml` `[vars] PUBLIC_TURNSTILE_SITE_KEY` (public).
3. Store the **secret key** as a secret (below). If Turnstile keys are absent locally, verification is skipped so dev still works.

## 5. Cover images

The original front-only covers live on the author's machine and are **not** committed. Before building:

1. Copy each book's front-only ebook cover (the `*eBook_KDP_1600x2560.jpg` file) into `scripts/source-covers/` named `book-01.jpg` … `book-15.jpg`.
2. Run `npm run images:optimize`. This writes AVIF/WebP/JPEG derivatives into `public/covers/generated/` and a fallback `public/covers/book-XX.jpg`.

If a source is missing, a tasteful placeholder is generated so the build never breaks — but supply the real covers before going live. Original cover art is never altered.

## 6. Secrets

Set secrets for the Pages project (never commit these):

```bash
npx wrangler pages secret put SESSION_SECRET
npx wrangler pages secret put TURNSTILE_SECRET_KEY
npx wrangler pages secret put EMAIL_PROVIDER_API_KEY      # if using Resend
npx wrangler pages secret put ADMIN_BOOTSTRAP_TOKEN
```

Non-secret vars (`SITE_URL`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, `EMAIL_PROVIDER`, `ADMIN_EMAIL`, `PUBLIC_TURNSTILE_SITE_KEY`) live in `wrangler.toml [vars]`.

## 7. Deploy

```bash
npm run deploy        # astro build && wrangler pages deploy ./dist
```

Or connect the Git repo in the Cloudflare Pages dashboard with build command `npm run build` and output directory `dist`, and add the same bindings there.

## 8. First admin

1. Visit the deployed site, register, and confirm your email.
2. Go to `/admin/bootstrap`, enter `ADMIN_BOOTSTRAP_TOKEN`.
3. You're now an admin. Rotate/remove the bootstrap token afterward.

## 9. Analytics (optional)

Enable **Cloudflare Web Analytics** for the domain (no cookies, privacy-friendly). If you add its script, it's already allowed by the CSP (`static.cloudflareinsights.com`). Update `/cookies` to name your choice.
