# SEO, performance & accessibility checklist

> SEO work improves discoverability and clarity. It does **not** guarantee any specific ranking in Google or AI answer engines.

## Automated checks (run these)

```bash
npm run build
npm run verify:seo     # titles, descriptions, canonicals, single H1, valid JSON-LD, sitemap/robots
npm run lint:links     # no broken internal links
npm test               # unit tests incl. content integrity (15 books, >=12 public FAQs each)
```

## On-page SEO (implemented)

- [x] Unique `<title>` and meta description per page.
- [x] Canonical URL on every page.
- [x] Exactly one `<h1>` per page; logical H2/H3 hierarchy.
- [x] Descriptive internal links; crawlable book links without JS.
- [x] Informative cover `alt` text (title + series number).
- [x] Open Graph + Twitter card metadata; social image at `/og/cube-chronicles-og.png`.

## Structured data (implemented)

- [x] `WebSite` + `BookSeries` on the homepage.
- [x] `Book` + `BreadcrumbList` + `FAQPage` on each book page.
- [x] `FAQPage` on the series FAQ.
- [x] `AboutPage` + `Person` on About; `BookSeries` on Series facts.
- [x] **Spoiler FAQs are excluded** from `FAQPage` structured data.
- [x] No review/rating schema (no real reviews exist); no fabricated ISBNs/offers — retailer offers appear only when real links are configured.

Validate with Google's Rich Results Test and Schema.org validator after deploy.

## Crawlability (implemented)

- [x] `sitemap.xml` (all public pages + 15 books).
- [x] `robots.txt` (allows content, disallows `/admin`, `/account`, `/api`, auth URLs; points to sitemap).
- [x] RSS feed at `/rss.xml` (new approved questions + book catalog).
- [x] Custom 404.
- [x] `X-Robots-Tag: noindex` on private areas via middleware.

## AI / answer-engine readability (implemented)

- [x] `/llms.txt` — site summary, key facts, series order, allowed crawl targets.
- [x] `/llms-full.txt` — concise per-book public summaries (no manuscript text).
- [x] Answer-first FAQ paragraphs beneath question headings, each with a stable anchor.
- [x] `/series-facts` HTML facts page.
- [x] Consistent entity facts across Home/About/Series-facts; "updated" dates on editorial pages.

## Performance (implemented)

- [x] Astro ships ~0 framework JS; only Turnstile's async script on form pages.
- [x] Covers: AVIF/WebP/JPEG at 4 widths with `srcset`/`sizes`; hero preloaded, rest lazy.
- [x] Explicit image dimensions + `aspect-ratio` → no layout shift.
- [x] System font stack (no web-font download).
- [x] CSS mostly inlined; static assets content-hashed and cacheable.
- See the performance budget in `docs/architecture.md`.

Run **Lighthouse** on the deployed site and aim for 90+ across the board.

## Accessibility (WCAG 2.2 AA targets)

- [x] Skip-to-content link; semantic landmarks (`header`/`nav`/`main`/`footer`).
- [x] Visible keyboard focus styles; `prefers-reduced-motion` honored.
- [x] Accessible disclosure (native `<details>`) for FAQs and reply forms — no custom JS widgets.
- [x] Labeled form fields, hints, and `role="alert"`/`role="status"` flash messages.
- [x] Color is never the sole status indicator (text labels on badges).
- [x] Sufficient contrast in the indigo/gold/cream palette.

Manual pass before launch: tab through the homepage, a book page, and the register/login/ask forms; test with a screen reader; run axe DevTools.
