# Admin & moderation guide

## Becoming an admin

1. Register on the site and confirm your email.
2. Visit `/admin/bootstrap` and enter the `ADMIN_BOOTSTRAP_TOKEN` you configured.
3. You now have admin access at `/admin`. Rotate or remove the bootstrap token afterward. Additional admins can only be granted by promoting the account whose email equals `ADMIN_EMAIL`, or by an admin editing the `users.role` column in D1.

## The dashboard (`/admin`)

Shows live counts: pending questions, pending responses, open reports, failed notifications, registered users, approved questions. Each card links to the relevant queue. Urgent items are highlighted.

## Moderating questions (`/admin/questions`)

Filter by status (pending / approved / rejected / archived). For each question you can:

- **Approve** — publishes it publicly and lets people reply.
- **Save edit** — fix a typo or clarify wording (title/body).
- **Reject** — keeps it out of public view.
- **Archive** — retire an old thread.
- **Delete** — soft-delete (recoverable in D1).

Approving a question does **not** send email. The author is auto-subscribed when they post (if their preference allows), so they'll be notified when an **answer** is approved.

## Moderating responses (`/admin/responses`)

Same controls. **Approving a response emails all active, verified subscribers of its question — except the response's author** — and records each send in the notification log.

## Reports (`/admin/reports`)

Readers can report a question or response. Open reports appear here; jump to the item, take action, then mark the report **reviewed** or **dismiss** it.

## Users (`/admin/users`)

Search by name/email. **Suspend** (temporary) or **Ban** (permanent) abusive accounts; suspended/banned users are signed out immediately and cannot post. You cannot action yourself or other admins from the UI. Passwords and tokens are never shown.

## Notifications (`/admin/notifications`)

Full delivery log with provider and status. Filter to failures and **Resend** any failed delivery.

## Exports (`/admin/exports`)

Download **CSV or JSON** for: users, consent & subscription records, questions, responses, subscriptions, the notification log, and the moderation audit log. Exports never include password hashes or security tokens, and each export is written to the moderation audit log.

## Direct database access

All data is in your Cloudflare D1 database `cubechronicles`. Query it any time:

```bash
wrangler d1 execute cubechronicles --remote --command \
  "SELECT status, COUNT(*) FROM questions GROUP BY status;"
```

Every moderator action is recorded in `moderation_actions` (who did what, when, to which item).
