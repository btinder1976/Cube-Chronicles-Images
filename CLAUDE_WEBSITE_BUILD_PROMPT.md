# Claude Build Prompt — Cube Chronicles Series Website

You are the lead full-stack engineer, information architect, SEO strategist, accessibility specialist, and content editor for the official **Cube Chronicles** book-series website.

## Mission

Build a complete, production-ready website for **CubeChronicles.com** using the manuscripts, book-cover files, and other project files already available in this workspace. Do not merely create a mockup or partial prototype. Implement the complete application, database schema, Cloudflare configuration, content extraction workflow, SEO, structured data, moderation tools, registration, questions, answers, comments, and email notifications.

Work autonomously. Inspect the entire project before coding. Do not ask routine questions that can be answered by examining the files. Make sensible, documented decisions when details are missing. Never invent plot facts that contradict the manuscripts.

## Primary goals

1. Present the Cube Chronicles as a cohesive 15-book historical time-travel adventure series.
2. Give every book its own optimized landing page using its front-cover image.
3. Create authoritative, manuscript-grounded questions and answers for every book.
4. Let registered readers ask questions, post answers or comments, and subscribe to discussion updates.
5. Store user and discussion information in a database that the site owner can inspect and export from Cloudflare.
6. Notify the original question author and subscribed participants by email when a new approved response is posted.
7. Make the site highly accessible, fast, mobile-friendly, secure, SEO-ready, and understandable to search engines and AI answer systems.
8. Build for the intended domain: `https://cubechronicles.com`.

## Mandatory discovery phase

Before changing files:

1. Recursively inventory the workspace.
2. Locate all 15 manuscripts and all book-cover folders.
3. Identify each front-only ebook cover JPG. Prefer filenames containing terms such as `eBook`, `KDP`, `1600x2560`, or equivalent.
4. Do not use paperback wrap PDFs or wrap JPGs as book-card thumbnails when a front-only image exists.
5. Extract and verify for every book:
   - book number
   - exact title
   - subtitle
   - primary historical setting
   - approximate era
   - main characters
   - spoiler-free premise
   - important themes
   - age range
   - series order
   - manuscript filename
   - front-cover filename
6. Create a machine-readable content inventory, such as `src/content/books.json` or individual content files.
7. Record any missing or ambiguous source file in `docs/content-audit.md`; do not silently guess.

## Required book list

Use source files to verify spelling and metadata, but the expected series order is:

1. The Shed, The Cube, and The Sands of Time
2. The Compass, The Coast, and The Edge of the World
3. The River, The Seal, and The Language of Silence
4. The Knot, The Flame, and The Bones That Speak
5. The Shore, The Flame, and The Shape of Water
6. The River, The Wheel, and The City of the Moon
7. The Rope, The Ridge, and The Roof of the World
8. The Seed, The Soil, and The Cities Beneath the Green
9. The Rain, The Cedar, and The Rivers of Silver
10. The Fire, The Threshold, and The Stranger at the Door
11. The Break, The Gold, and The Palace That Rose Again
12. The Song, The Stars, and The Country That Remembers
13. The Canoe, The Compass, and The Shore Beyond the Sky
14. The Crossroads, The Weave, and The Road of All Roads
15. The Center, The Maker, and The Road That Was Always Home

## Recommended technical architecture

Use a Cloudflare-native architecture unless the current repository already has a clearly superior compatible stack.

### Front end

Preferred stack:

- Astro with TypeScript for fast, content-heavy pages and strong static rendering
- minimal client-side JavaScript
- responsive CSS using either well-organized vanilla CSS or Tailwind if already configured
- semantic HTML
- static generation for series and book content
- Cloudflare adapter for dynamic routes

A different framework is acceptable only when it materially improves maintainability and remains fully deployable on Cloudflare.

### Cloudflare services

Use:

- Cloudflare Pages or Workers for deployment
- Cloudflare D1 for users, sessions, questions, answers, comments, subscriptions, moderation records, and email-delivery logs
- Cloudflare Turnstile on registration, login abuse-sensitive flows, question submission, and response submission
- Cloudflare Web Analytics or a privacy-conscious equivalent
- Cloudflare bindings and Wrangler configuration committed to the repository

Use R2 only when needed for owner exports or future media. Existing book-cover assets should normally be optimized and deployed as versioned static assets.

### Email

Implement transactional notifications through a provider adapter. Prefer a straightforward provider such as Resend, Postmark, MailChannels where currently supported, or another Cloudflare Workers-compatible service. Do not hard-code secrets.

Required environment variables should include names such as:

- `EMAIL_PROVIDER_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `SITE_URL`
- `SESSION_SECRET`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `ADMIN_EMAIL`

Include a development email logger so local development works without sending real messages.

## Design direction

The site should feel cinematic, historical, mysterious, warm, family-centered, and adventurous. It must not look like a generic SaaS template.

Use the covers as the primary visual language. Derive a restrained series palette from deep indigo, warm gold, cream, parchment, and each book’s accent color. Maintain excellent contrast.

Do not alter the cover art. Use the front-only covers as supplied.

### Global interface requirements

- responsive header
- series logo or text treatment
- navigation: Home, The Books, Series FAQ, Ask a Question, About, Privacy
- prominent “Explore the Books” call to action
- footer with series navigation, legal links, contact link, and copyright
- skip-to-content link
- visible keyboard focus styles
- reduced-motion support
- responsive images with explicit width and height
- lazy loading below the fold

## Homepage

Create a rich homepage about the series as a whole.

Required sections:

1. Hero section introducing The Cube Chronicles as a 15-book historical time-travel adventure.
2. Strong spoiler-free series summary based on manuscript evidence.
3. A complete visual bookshelf/grid containing the front cover for every book in reading order.
4. Every cover must be clickable and lead to that book’s dedicated page.
5. Each card must include book number, exact title, setting, and concise teaser.
6. “Start with Book One” section.
7. “Journey through the ancient world” section grouping or mapping the historical settings.
8. Series themes section: family, history, faith, craft, courage, responsibility, and homecoming, but only where supported by the manuscripts.
9. Reader-age and parent/educator guidance.
10. Selected series FAQs.
11. Latest approved community questions.
12. Newsletter or release-update signup only if implemented with explicit consent and unsubscribe support.

Do not overwhelm the page with long summaries. Use layered links to deeper pages.

## Books index

Create `/books/` with all 15 books in order.

Include filters or navigational groupings by:

- book number
- historical region
- approximate era
- major theme

Keep all book links crawlable without JavaScript.

## Individual book pages

Create a stable, descriptive URL for every book, for example:

`/books/01-the-shed-the-cube-and-the-sands-of-time/`

Every book page must include:

- front-only cover
- exact title and subtitle
- “Book X of 15”
- spoiler-free description grounded in the manuscript
- historical place and era
- main characters appearing in that installment
- themes and learning topics
- “What readers will discover” section
- appropriate reader age guidance
- reading-order navigation: Previous Book / Series / Next Book
- purchase buttons configured from editable data, with placeholder URLs clearly marked until real retailer links are supplied
- static editorial FAQ section
- community Q&A section
- question-submission call to action
- breadcrumb navigation

Do not expose manuscript spoilers in meta descriptions, card teasers, or above-the-fold copy.

## Editorial FAQ generation

For each of the 15 books, read the manuscript and write **at least 12 useful, natural-language questions and concise answers**. Also create at least 20 series-wide FAQs.

These should resemble legitimate reader, parent, teacher, librarian, and search-engine questions, including patterns such as:

- What is this book about?
- Is this book part of a series?
- Do the books need to be read in order?
- What age is the book appropriate for?
- Where and when is the story set?
- Is the history based on real civilizations?
- Who are the main characters?
- Does the book contain fantasy or time travel?
- Is it suitable for classrooms or homeschool reading?
- What themes does the story explore?
- Is the book frightening or violent?
- Does the story contain religious or faith themes?
- How long is the book?
- What can a reader learn about the historical culture?
- Which book comes before or after it?

Requirements:

- Answer from manuscript evidence.
- Keep answers direct, factual, and useful.
- Clearly label spoiler-free answers.
- Put spoiler answers behind a disclosure control and do not include spoiler content in FAQ structured data.
- Avoid keyword stuffing.
- Avoid repetitive answers across all 15 pages.
- Store editorial FAQs separately from community submissions.
- Give each FAQ a stable ID and dedicated anchor link.

## Community questions, answers, and comments

Build a moderated discussion system attached to each book and optionally to the series as a whole.

### Registration requirements

A person must register before posting a question, answer, or comment.

Collect only:

- display name
- email address
- password or secure passwordless login identifier
- consent timestamp for required transactional email
- optional notification preferences

Do not publicly display email addresses.

Use secure authentication. Preferred options:

- passwordless email magic links, or
- passwords hashed with a Cloudflare Workers-compatible, security-reviewed approach

Use secure, HttpOnly, SameSite cookies and expiring sessions. Implement email verification before posting.

### Discussion behavior

- Registered and verified users can ask a question on a book page.
- Registered users can submit answers or comments.
- Questions and responses default to `pending` until approved by an administrator.
- The question author automatically subscribes to approved responses.
- Other users may explicitly subscribe or unsubscribe.
- When an approved answer/comment is posted, send an email notification to subscribed users.
- Each email must contain the book title, question title, a short response excerpt, a direct discussion link, and an unsubscribe link.
- Avoid duplicate notifications to the person posting the response.
- Do not send emails for rejected, deleted, or unapproved content.
- Rate-limit posting and authentication attempts.
- Protect forms with Turnstile.
- Sanitize all user content and render it safely.
- Add report-abuse functionality.
- Add soft deletion and moderation audit logs.
- Prevent search engines from indexing pending, rejected, thin, or private content.

## Owner/admin area

Create a protected admin area, such as `/admin/`.

Required features:

- administrator login restricted by configured admin identity
- dashboard counts
- pending questions
- pending responses/comments
- approve, reject, edit, archive, and delete controls
- view registered users without exposing passwords or secrets
- notification delivery log
- resend failed notification option
- export users as CSV
- export questions/responses as CSV or JSON
- export consent and subscription records
- search and filter records
- ban or suspend abusive accounts

The owner must be able to access data through Cloudflare D1 and through the admin export tools. Do not store personal data in public repository files, static JSON, browser localStorage, or publicly accessible R2 objects.

## Suggested D1 schema

Create migrations for at least:

- `users`
- `email_verification_tokens`
- `sessions`
- `books`
- `editorial_faqs`
- `questions`
- `responses`
- `subscriptions`
- `notification_deliveries`
- `content_reports`
- `moderation_actions`
- `rate_limit_events` if application-level rate tracking is used

Include:

- UUID or safe unique IDs
- created and updated timestamps
- moderation status
- foreign keys
- indexes for book, status, user, slug, and recency queries
- unique constraints where appropriate
- soft-delete timestamps

Never commit real user information.

## Privacy, consent, and legal pages

Create editable starter pages for:

- Privacy Policy
- Terms of Use
- Community Guidelines
- Cookie/Analytics notice where required
- Contact

Clearly state that email addresses are used for account verification and requested discussion notifications. Include unsubscribe controls. Add an owner checklist stating that legal text must be reviewed before launch.

Do not collect birth dates from children. The site should be designed primarily for parents, educators, librarians, and readers who can lawfully register. Add a configurable minimum-age/parental-consent notice based on the owner’s legal review. Do not claim legal compliance without review.

## SEO requirements

Implement technical and editorial SEO thoroughly, but do not promise or claim guaranteed rankings.

### On-page SEO

Every indexable page needs:

- unique title tag
- unique meta description
- canonical URL
- one clear H1
- logical H2/H3 hierarchy
- descriptive internal links
- useful alt text for covers, such as book title and series number
- Open Graph metadata
- X/Twitter card metadata
- social-sharing image configuration

### Structured data

Use valid JSON-LD where appropriate:

- `WebSite`
- `Organization` or `Person` for the author/publisher, based on confirmed project facts
- `BookSeries`
- `Book` for each title
- `BreadcrumbList`
- `FAQPage` for visible editorial FAQs only
- `DiscussionForumPosting` or appropriate discussion markup only when the visible content and schema eligibility are genuinely satisfied
- `ProfilePage` only when applicable

Do not mark community questions as editorial FAQ content. Do not add review or aggregate-rating schema unless real reviews and valid ratings exist.

For each `Book` schema object include only verified values. Include ISBN, publication date, retailer offers, format, and page count only when confirmed in project files or editable data.

### Crawlability

Create:

- `/sitemap-index.xml` or `/sitemap.xml`
- `robots.txt`
- RSS or Atom feed for new approved questions or official updates
- clean permanent URLs
- custom 404 page
- redirects file for future slug changes

Exclude from indexing:

- admin pages
- account pages
- verification links
- unsubscribe tokens
- pending discussions
- internal API routes

### AI-search and answer-engine discoverability

Build for clarity and citation, not manipulation.

- Use concise answer-first paragraphs beneath question headings.
- Use stable anchors for every editorial FAQ.
- Provide an HTML series facts page.
- Create `/llms.txt` summarizing the site, canonical content areas, series order, and allowed crawl targets.
- Optionally create `/llms-full.txt` containing concise public series and book summaries, not full copyrighted manuscripts.
- Add author and series entity pages with consistent facts.
- Include updated dates on editorial pages.
- Make important facts visible in HTML, not hidden only in scripts.
- Do not expose full manuscripts, unpublished chapters, private notes, or copyrighted source text.
- Do not use doorway pages, hidden text, fake reviews, fabricated citations, or mass-generated low-value pages.

## Performance requirements

Target excellent Core Web Vitals.

- optimize cover JPGs into responsive WebP/AVIF derivatives while retaining original files
- serve correct dimensions and `srcset`
- avoid layout shift
- preload only the true hero image
- lazy-load the rest
- minimize JavaScript
- cache static assets aggressively with content hashes
- use server rendering only for pages that require it
- include a performance budget in documentation

## Accessibility requirements

Meet WCAG 2.2 AA as closely as practical.

- keyboard-accessible navigation and forms
- semantic landmarks
- correct labels and error summaries
- no color-only status indicators
- sufficient contrast
- accessible accordion/disclosure behavior
- accessible modal behavior or avoid modals
- descriptive form instructions
- status messages using appropriate ARIA live regions
- cover alt text that is informative but not excessively long
- automated accessibility tests plus manual checklist

## Security requirements

- validate and sanitize all input server-side
- parameterized D1 queries only
- CSRF protection for state-changing requests
- secure session rotation and revocation
- Turnstile server-side token verification
- rate limiting
- content-length limits
- strict authorization checks for admin actions
- Content Security Policy
- secure headers
- no secrets committed
- generic authentication error messages
- audit logging for moderation
- dependency audit

## Required repository deliverables

Produce all code and configuration needed to run and deploy the site, including:

- complete application source
- extracted book metadata/content files
- all 15 book routes
- homepage and books index
- series FAQ page
- registration, login, verification, logout, passwordless or password-reset flows
- question, response, subscription, reporting, and moderation features
- D1 migrations and seed data
- Wrangler/Cloudflare configuration templates
- `.dev.vars.example` or `.env.example`
- deployment scripts
- tests
- `README.md`
- `docs/architecture.md`
- `docs/content-audit.md`
- `docs/cloudflare-setup.md`
- `docs/domain-setup.md`
- `docs/email-setup.md`
- `docs/admin-guide.md`
- `docs/seo-checklist.md`
- `docs/privacy-launch-checklist.md`
- `docs/launch-checklist.md`

## Testing requirements

Add and run:

- unit tests for validation, slugs, permissions, and notification rules
- integration tests for registration, verification, posting, moderation, and notification subscription
- end-to-end tests for core visitor and administrator journeys
- structured-data validation tests
- broken-link checks
- sitemap checks
- accessibility tests
- production build
- local D1 migration test

Fix failures before declaring completion.

## Seed content rules

- Seed the 15 verified books.
- Seed manuscript-grounded editorial FAQs.
- Do not seed fake community members, fake testimonials, fake reviews, or fake user engagement in production.
- Development-only fixtures must be clearly marked and excluded from production seeding.

## Completion workflow

Proceed in phases without waiting for routine approval:

1. Audit files and produce content inventory.
2. Establish architecture and project structure.
3. Build static series/book content and design system.
4. Implement D1 schema and authentication.
5. Implement Q&A, moderation, subscriptions, and notifications.
6. Add SEO, structured data, sitemap, robots, feeds, and AI-readable files.
7. Add admin exports and Cloudflare setup documentation.
8. Test accessibility, security, performance, and production build.
9. Review every book page against its manuscript and cover.
10. Provide a final completion report listing files created, commands run, test results, Cloudflare resources the owner must create, environment variables required, and any remaining manual launch steps.

## Important constraints

- Never publish or expose the full manuscripts.
- Never fabricate book facts, awards, reviews, sales, ratings, ISBNs, publication dates, or retailer links.
- Never claim that SEO work guarantees first position in Google or AI results.
- Never place private user data in Git.
- Never send notifications without a valid subscription or transactional purpose.
- Never depict or invent the Maker as a visible character; follow the Book 15 source material’s restraint.
- Preserve exact book-title spelling from the source manuscripts and approved covers.
- Prefer accurate, substantial content over keyword repetition.

Begin now by inventorying the workspace and writing `docs/content-audit.md`. Continue through implementation and testing until the site is deployable.