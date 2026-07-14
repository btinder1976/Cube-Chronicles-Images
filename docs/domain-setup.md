# Domain setup — cubechronicles.com

## 1. Add the site to Cloudflare

1. Cloudflare dashboard → **Add a site** → `cubechronicles.com`.
2. Choose a plan (Free is fine to start).
3. Cloudflare shows two **nameservers**. At your domain registrar, replace the current nameservers with those. Propagation is usually minutes to a few hours.

## 2. Attach the domain to the Pages project

1. Pages → your `cubechronicles` project → **Custom domains** → **Set up a custom domain**.
2. Add `cubechronicles.com` and `www.cubechronicles.com`.
3. Cloudflare creates the required `CNAME`/`A` records automatically when the zone is on Cloudflare.

## 3. Redirect www → apex (or vice-versa)

Pick one canonical host. The site's canonical URLs use the apex (`https://cubechronicles.com`). Add a **Bulk Redirect** or a Redirect Rule:

- `www.cubechronicles.com/*` → `https://cubechronicles.com/$1` (301).

Keep `SITE_URL` in `wrangler.toml` set to the canonical apex so canonicals, sitemap, RSS, and structured data all agree.

## 4. HTTPS

Cloudflare provisions a universal SSL certificate automatically. Set **SSL/TLS → Overview → Full (strict)**. The app already sends HSTS.

## 5. Verify

- `https://cubechronicles.com/` loads.
- `https://cubechronicles.com/robots.txt` lists the sitemap.
- `https://cubechronicles.com/sitemap.xml` lists all pages.
- `https://www.cubechronicles.com/` redirects to the apex.

## 6. After launch

Submit the sitemap in **Google Search Console** and **Bing Webmaster Tools** (`https://cubechronicles.com/sitemap.xml`).
