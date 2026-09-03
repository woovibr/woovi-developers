---
id: security-leaked-credentials
title: "Leaked or exposed credential: how to remediate"
sidebar_label: Leaked credential
tags:
  - security
  - api
  - leaked-credentials
  - remediation
---

This is Woovi's public remediation documentation for exposed credentials. Use
this page if a Woovi AppID, `clientSecret` or webhook secret key was published in
a public repository, log, ticket, screenshot, npm/composer package, frontend
bundle, or was flagged by a secret scanning tool.

:::danger Treat it as compromised
Any credential that left your controlled environment must be considered
compromised — even if the repository was private, even if the commit was
reverted, and even if the exposure lasted only a few minutes. Rewriting Git
history does **not** remediate a leak; only rotating the credential does.
:::

## TL;DR (do this now)

1. **Rotate or revoke** the credential in the Woovi dashboard — this invalidates the exposed credential immediately.
2. **Update your systems** with the new credential.
3. **Review your statement, transactions and audit trail** for the exposure window, and email [security@woovi.com](mailto:security@woovi.com) if you see any activity you do not recognize.

## 1. Identify the credential type

| Credential | Where it is used | How to recognize it | Risk |
| - | - | - | - |
| **API AppID** | `Authorization` header on calls to `api.woovi.com` | Base64 string that decodes to `Client_Id_<uuid>:Client_Secret_<...>` | **High** — can call the API on behalf of your company, within its assigned scopes |
| **Plugin AppID** | Frontend / checkout | Same format as the API AppID | **Low/Medium** — public by design and limited to plugin routes, but rotation is still recommended |
| **WooviApp `clientSecret`** (OAuth) | Your app's backend, when exchanging the `code` | Returned only once when the app is created at [store.woovi.com](https://store.woovi.com/create) | **High** — allows impersonating your app in the OAuth flow |
| **Account Limits `clientId` / `clientSecret`** | HTTP Basic Auth (`Authorization: Basic ...`) | Credential pair created in the limits dashboard | **High** |
| **Webhook HMAC secret key** | Validating the `X-OpenPix-Signature` header | Secret shown on the webhook detail screen under `API/Plugins` | **Medium** — allows forging webhooks your system would accept as legitimate |

If you cannot tell which type it is, treat it as an API AppID (the most sensitive
case) and follow step 2.

## 2. Rotate or revoke the credential

### API or Plugin AppID

Rotating issues a new AppID and **invalidates the old one immediately**:

1. Go to [app.woovi.com](https://app.woovi.com.br/home/applications/tab/list) and open **API/Plugins → API/Plugins**.
2. Select the application whose key was exposed.
3. Click **Regenerate AppID**.
4. Confirm with your second authentication factor (2FA).
5. Copy the new AppID — it is shown only at that moment.

If the integration is no longer in use, **delete the application** instead of
rotating it. You can also delete it through the API, authenticating with the
exposed AppID itself:

```bash
curl --request DELETE \
  --url https://api.woovi.com/api/v1/application \
  --header 'Authorization: EXPOSED_APPID'
```

This route requires the `APPLICATION_DELETE` scope. Your company's _master_
application cannot be deleted — rotate it from the dashboard instead.

:::tip
If the same credential was shared by several integrations, create one AppID per
integration before rotating. That way the next incident affects only one system.
:::

### WooviApp `clientSecret` (OAuth)

The `clientSecret` is shown only once at creation time and Woovi stores only its
SHA-256 hash — it cannot be recovered or rotated. To remediate:

1. Register a new app at [store.woovi.com/create](https://store.woovi.com/create) with the same redirect URIs and permissions.
2. Migrate your backend to the new `clientId` / `clientSecret`.
3. Delete the old app.

Every company that authorized your app can revoke access at any time at
[store.woovi.com/authorized-apps](https://store.woovi.com/authorized-apps), and
revoking invalidates the access token immediately. Ask your customers to revoke
the old app after the migration.

### Account Limits `clientId` / `clientSecret`

Create a new credential pair in the dashboard, update your integration and delete
the exposed pair.

### Webhook HMAC secret key

The secret key is part of the webhook configuration. To change it, delete the
webhook and create it again — the new webhook gets a new secret key. See
[Validating the webhook payload with HMAC-SHA1](../webhook/seguranca/webhook-hmac.mdx).

Consider migrating to
[public key validation (`x-webhook-signature`)](../webhook/seguranca/webhook-signature-validation.mdx),
which does not rely on a shared secret and therefore cannot leak from your side.

## 3. Assess the impact

Once the credential is rotated, check what happened while it was exposed:

- **Statement and transactions** — look for charges, payments, withdrawals or refunds you do not recognize.
- **Audit trail** — every action on the platform is audited with IP and geolocation.
- **Sessions** — review active sessions and alerts for logins from unknown devices or locations.
- **Webhooks** — if the HMAC secret key leaked, review the events your system processed during the window.

Found something suspicious? Email [security@woovi.com](mailto:security@woovi.com)
right away with the affected AppID (never the full credential value), the time
window and what you observed.

## 4. Prevent the next leak

- **Never commit credentials.** Use environment variables or a secret manager.
- **Restrict scopes.** An AppID with no scopes has full access to every route allowed for its application type. See [Adding scopes to your AppID](../apis/api-scopes.md).
- **Restrict IPs.** Allow only your servers' IPs. See [Adding an IP filter to your API](../apis/api-security-ip-whitelist.md).
- **One key per integration.** Do not reuse AppIDs across services or environments.
- **Disable unused keys.**
- **Never use an API AppID in the frontend.** Use the Plugin type for frontend integrations.
- **Enable MFA** for every user in your company. See [Multi-factor authentication](./security-user-mfa.md).
- **Turn on secret scanning** in your Git provider so you hear about a leak before we do.

## 5. Contact Woovi

| Topic | Channel |
| - | - |
| Leaked credential, suspicious activity, security incident | [security@woovi.com](mailto:security@woovi.com) · [infosec@woovi.com](mailto:infosec@woovi.com) |
| Responsible vulnerability disclosure | [security@woovi.com](mailto:security@woovi.com) |
| Integration questions and support | [ajuda.woovi.com](https://ajuda.woovi.com) |

## For secret scanning platforms

This page is Woovi's canonical public remediation URL and may be referenced in
alerts about leaked Woovi credentials.

- English: `https://developers.woovi.com/en/docs/security/security-leaked-credentials`
- Portuguese: `https://developers.woovi.com/docs/security/security-leaked-credentials`

To report Woovi credentials found in public sources, or to discuss a secret
scanning partner program, email
[security@woovi.com](mailto:security@woovi.com).

See also: [Security Policy](./security-policy.md) and
[Security Guidelines](./security-guidelines.md).
