# Privacy & legal launch checklist

> **The starter legal pages are a good-faith starting point, not legal advice.** Have a qualified attorney review everything before launch. Do not claim compliance with any specific law (GDPR, CCPA, COPPA, etc.) without that review.

## Legal pages to review & finalize

- [ ] **Privacy Policy** (`/privacy`) — confirm the data you collect, retention, and rights language; add your legal entity and contact.
- [ ] **Terms of Use** (`/terms`) — set governing law/jurisdiction, dispute resolution, and DMCA/takedown contact.
- [ ] **Community Guidelines** (`/community-guidelines`) — confirm the rules fit your community.
- [ ] **Cookie & Analytics Notice** (`/cookies`) — name your analytics provider (or state none).
- [ ] **Contact** (`/contact`) — confirm `ADMIN_EMAIL` receives messages.

## Minimum age & children

- [ ] Decide and document a **minimum registration age** and any **parental-consent** process (insert into `/terms`).
- [ ] The site is designed for parents, educators, librarians, and lawful registrants. It does **not** collect birthdates or knowingly register children.
- [ ] If you will allow younger users, review COPPA (US) / age-appropriate design codes and add the required flows.

## Data handling (already implemented)

- [x] Email addresses are never shown publicly and are used only for verification and requested notifications.
- [x] Explicit consent checkbox + stored consent timestamp at registration.
- [x] Unsubscribe link in every notification email and in the account page.
- [x] Passwords hashed (PBKDF2); tokens stored as hashes; no secrets in the repo.
- [x] No user personal data committed to Git; all in D1.
- [x] Owner can export and delete user data (admin exports + D1).

## Consent & communications

- [ ] Confirm the registration consent wording with counsel.
- [ ] Confirm transactional-only email posture (no marketing without separate opt-in).
- [ ] Provide a clear route for data access/deletion requests (contact page is wired; document your response SLA).

## Before flipping to public

- [ ] Replace placeholder owner/contact details in all legal pages.
- [ ] Remove the `ADMIN_BOOTSTRAP_TOKEN` (or rotate) once the first admin exists.
- [ ] Verify no development fixtures/fake users exist in the production database (production seed only inserts books + editorial FAQs — no users).
