---
id: subscription-recurrence
title: Subscriptions and Recurring Billing
tags:
  - subscription
  - recurrence
  - payment
---

Subscriptions and Recurring Billing lets you charge your customers on a predefined schedule. In the API, each recurring billing is a **subscription** (`/api/v1/subscriptions`).

The platform generates the charges, each one with a dynamic Pix QR Code, from the subscription settings and sends email/SMS/WhatsApp messages to charge your customer automatically.

## Use cases

- SaaS subscriptions - Software as a Service
- Monthly fees for services - such as gyms, schools, etc.

## Subscriptions and Recurring Billing or Pix Automático?

With **Subscriptions and Recurring Billing**, Woovi generates and sends your customer a new charge with a Pix QR Code every cycle, and they pay it as usual. With **Pix Automático**, the Central Bank's official modality, the customer authorizes once in their bank app and the payments are made automatically; in the API, the subscription has type `PIX_RECURRING` and the authorization status lives in the `pixRecurring` object.

Both use the same route, `/api/v1/subscriptions`. See the [Pix Automático](/docs/pix-automatic/pix-automatic-what-is-it) documentation.
