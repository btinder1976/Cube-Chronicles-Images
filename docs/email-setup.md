# Email setup

The site sends two kinds of transactional email: **email verification** and **discussion notifications** (plus the contact form to the owner). Delivery goes through a provider adapter selected by `EMAIL_PROVIDER`.

## Options

### `log` (default for local dev)
Prints the full email to the console instead of sending. No configuration. Use for local development and tests.

```
EMAIL_PROVIDER="log"
```

### `resend` (recommended for production)
1. Create a [Resend](https://resend.com) account and verify your sending domain (`cubechronicles.com`) with the DNS records they provide (SPF, DKIM).
2. Create an API key.
3. Configure:

```
EMAIL_PROVIDER="resend"                       # in wrangler.toml [vars]
EMAIL_FROM_ADDRESS="no-reply@cubechronicles.com"
EMAIL_FROM_NAME="The Cube Chronicles"
```
4. Store the key as a secret:
```bash
npx wrangler pages secret put EMAIL_PROVIDER_API_KEY
```

### `mailchannels`
Workers-native, no API key, but you must publish SPF/DKIM and a MailChannels domain-lockdown record for your domain. Set `EMAIL_PROVIDER="mailchannels"`. Confirm MailChannels is available for your account/region before relying on it.

## Required variables

| Variable | Where | Purpose |
|---|---|---|
| `EMAIL_PROVIDER` | `[vars]` | `resend` \| `mailchannels` \| `log` |
| `EMAIL_PROVIDER_API_KEY` | secret | provider key (Resend) |
| `EMAIL_FROM_ADDRESS` | `[vars]` | From address (on a verified domain) |
| `EMAIL_FROM_NAME` | `[vars]` | Friendly From name |
| `SITE_URL` | `[vars]` | Used to build verification/unsubscribe links |
| `ADMIN_EMAIL` | `[vars]` | Recipient of contact-form messages |

## Deliverability checklist

- [ ] SPF record includes your provider.
- [ ] DKIM signing enabled and verified.
- [ ] DMARC record published (`p=none` to start, then tighten).
- [ ] `EMAIL_FROM_ADDRESS` is on the verified domain.
- [ ] Send yourself a verification email and a notification email end-to-end.

## Auditing & resending

Every notification send is recorded in the `notification_deliveries` table with status and provider response. The admin **Notifications** tab lists all deliveries, filters to failures, and offers a one-click **Resend**.
