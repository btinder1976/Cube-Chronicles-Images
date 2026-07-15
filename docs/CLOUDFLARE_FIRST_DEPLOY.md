# Cube Chronicles — first Cloudflare deployment

This checklist is for the first working test deployment. It intentionally starts with D1 and log-only email, then adds production email, Turnstile, the custom domain, KV, and R2 afterward.

## What is already prepared

- Astro SSR with `@astrojs/cloudflare`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Front-only covers at `public/covers/book-01.jpg` through `book-15.jpg`
- D1 migration at `migrations/0001_init.sql`
- Initial data at `db/seed.sql`
- Email provider defaults to `log` in `wrangler.toml`
- Fake Cloudflare resource IDs have been removed from `wrangler.toml`

## Phase 1 — connect GitHub and create the Pages project

1. Sign in to Cloudflare.
2. Open **Workers & Pages**.
3. Select **Create application**.
4. Select **Pages**.
5. Select **Import an existing Git repository**.
6. Authorize/select GitHub repository `btinder1976/Cube-Chronicles-Images`.
7. Use these build settings:
   - Project name: `cubechronicles`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
8. Add environment variable `NODE_VERSION` with value `20` if Cloudflare does not already use Node 20 or later.
9. Save the project. The first build may complete, but dynamic pages will not work until the D1 binding is added.

## Phase 2 — create and bind D1

### Dashboard method

1. In Cloudflare, open **Storage & Databases** → **D1 SQL database**.
2. Select **Create database**.
3. Name it `cubechronicles`.
4. Return to **Workers & Pages** → `cubechronicles` → **Settings** → **Bindings**.
5. Add a **D1 database binding**:
   - Variable name: `DB`
   - Database: `cubechronicles`
6. Save the binding.

### Apply schema and seed data

Run these commands from a local clone of the repository:

```bash
npm install
npx wrangler login
npx wrangler d1 migrations apply cubechronicles --remote
npx wrangler d1 execute cubechronicles --remote --file=./db/seed.sql
```

If Wrangler asks which Cloudflare account to use, choose the account containing the Pages project.

## Phase 3 — test deployment variables

In **Workers & Pages** → `cubechronicles` → **Settings** → **Variables and Secrets**, set:

- `SITE_URL` = the actual temporary Pages URL, such as `https://cubechronicles.pages.dev`
- `EMAIL_PROVIDER` = `log`
- `EMAIL_FROM_NAME` = `The Cube Chronicles`
- `EMAIL_FROM_ADDRESS` = a temporary value such as `no-reply@cubechronicles.com`
- `ADMIN_EMAIL` = the owner's real email address

Redeploy after changing variables.

With `EMAIL_PROVIDER=log`, registration messages are written to Cloudflare logs rather than delivered. This is suitable only for the first technical test.

## Phase 4 — create required secrets

Create strong random values for:

- `SESSION_SECRET`
- `ADMIN_BOOTSTRAP_TOKEN`

Add them under **Variables and Secrets** as encrypted secrets.

Do not commit either value to GitHub.

After deployment:

1. Register an account.
2. Confirm the account using the verification URL visible in logs while email is in log mode.
3. Visit `/admin/bootstrap`.
4. Enter `ADMIN_BOOTSTRAP_TOKEN` once to make the account an administrator.
5. Rotate or remove the bootstrap token after the admin account is established.

## Phase 5 — verify the test site

Check these routes:

- `/`
- `/books`
- all 15 `/books/...` pages
- `/faq`
- `/series-facts`
- `/register`
- `/login`
- `/ask`
- `/robots.txt`
- `/sitemap.xml`
- `/rss.xml`
- `/llms.txt`
- `/llms-full.txt`

Confirm:

- all 15 cover images load,
- every cover links to the correct book page,
- FAQ accordions open,
- registration writes a user to D1,
- login creates a session,
- questions can be submitted,
- moderation pages load for an admin,
- mobile layout is usable,
- no manuscript files or private email addresses are publicly exposed.

## Phase 6 — production email with Resend

1. Create a Resend account.
2. Add and verify the sending domain.
3. Add the DNS records Resend provides.
4. Create an API key.
5. Add encrypted secret `EMAIL_PROVIDER_API_KEY` in Cloudflare.
6. Change `EMAIL_PROVIDER` to `resend`.
7. Set `EMAIL_FROM_ADDRESS` to a verified sender, such as `no-reply@cubechronicles.com`.
8. Redeploy and test registration, verification, replies, subscriptions, and unsubscribe links.

## Phase 7 — Turnstile

1. In Cloudflare, open **Turnstile**.
2. Create a widget for the temporary Pages hostname and later add `cubechronicles.com`.
3. Add normal variable `PUBLIC_TURNSTILE_SITE_KEY` to the Pages project.
4. Add encrypted secret `TURNSTILE_SECRET_KEY`.
5. Redeploy.
6. Test registration, contact, question, response, and report forms.

## Phase 8 — custom domain

After acquiring `CubeChronicles.com`:

1. Open **Workers & Pages** → `cubechronicles` → **Custom domains**.
2. Select **Set up a custom domain**.
3. Enter `cubechronicles.com`.
4. Follow Cloudflare's DNS prompts.
5. Optionally add `www.cubechronicles.com` and redirect it to the apex domain.
6. Change `SITE_URL` to `https://cubechronicles.com`.
7. Add the production hostname to Turnstile and Resend.
8. Redeploy.
9. Submit `https://cubechronicles.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools.

## Phase 9 — optional enhancements

These are not required for the first working deployment:

- `RATE_LIMIT` KV namespace for distributed rate limits
- `EXPORTS` R2 bucket for stored admin exports
- Cloudflare Web Analytics
- generated AVIF/WebP cover derivatives
- redirect from the temporary `*.pages.dev` address to the custom domain

## Series image

The root repository currently contains `SeriesImage.png`. Astro serves public assets from `public/`, so copy it to:

```text
public/seriesimage.png
```

Then reference it in site code as:

```text
/seriesimage.png
```

Review the finished homepage before choosing whether it belongs in the hero, between the series introduction and book grid, or in a dedicated series overview section.
