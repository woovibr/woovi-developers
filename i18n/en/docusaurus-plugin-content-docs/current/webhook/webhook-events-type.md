---
title: "Webhook Event Types"
description: "Webhook Event Types"
tags:
  - webhook
---

## Webhook Event Types

Webhook is a feature that allows Woovi to send notifications to your application when an event occurs.
For example, when a charge is paid, Woovi sends a notification to your server.

Below, you can see a list of all events that Woovi sends to your application.

:::tip Get the list of events via API
You can also programmatically get the complete list of available events through our API.
Check the [GET /api/v1/webhook/events](https://developers.woovi.com/api#tag/webhook/paths/~1api~1v1~1webhook~1events/get) endpoint in the API reference.
:::

## Charge Events

Charge events are sent when a charge status changes.

### OPENPIX:CHARGE_COMPLETED

This event is sent when a charge is fully paid.

[See payload example →](/docs/webhook/examples/webhook-charge-payload)

### OPENPIX:CHARGE_EXPIRED

This event is sent when a charge expires without being paid.

[See payload example →](/docs/webhook/examples/webhook-charge-expired)

### OPENPIX:CHARGE_CREATED

This event is sent when a new charge is created.

[See payload example →](/docs/webhook/examples/webhook-charge-created)

### OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER

This event is sent when a charge is paid by a `payer` different from the `customer` associated with the charge.

[See payload example →](/docs/webhook/examples/webhook-charge-completed-not-same-payer-payload)

## Transaction Events

Transaction events are sent when a Pix transaction is received.

### OPENPIX:TRANSACTION_RECEIVED

This event is sent when a Pix transaction is received, whether from a charge or a static QR code.

[See payload example →](/docs/webhook/examples/webhook-transaction-received)

### OPENPIX:TRANSACTION_REFUND_RECEIVED (DEPRECATED)

This event is sent when a transaction refund is processed.

[See payload example →](/docs/webhook/examples/webhook-refund-payload)

### PIX_TRANSACTION_REFUND_RECEIVED_CONFIRMED

This event is sent when a refund transaction is received and confirmed by the bank.

[See payload example →](/docs/webhook/examples/webhook-refund-received-confirmed)

### PIX_TRANSACTION_REFUND_RECEIVED_REJECTED

This event is sent when a refund transaction is received but rejected.

[See payload example →](/docs/webhook/examples/webhook-refund-received-rejected)

### PIX_TRANSACTION_REFUND_SENT_CONFIRMED

This event is sent when a refund transaction is sent and confirmed.

[See payload example →](/docs/webhook/examples/webhook-refund-sent-confirmed)

### PIX_TRANSACTION_REFUND_SENT_REJECTED

This event is sent when a refund transaction is sent but rejected.

[See payload example →](/docs/webhook/examples/webhook-refund-sent-rejected)

## Instant Payment Events

### OPENPIX:MOVEMENT_CONFIRMED

This event is sent when a payment is confirmed by the bank.

[See payload example →](/docs/webhook/examples/webhook-payment-payload#pagamento-confirmado)

### OPENPIX:MOVEMENT_FAILED

This event is sent when a confirmed payment fails during bank processing.

[See payload example →](/docs/webhook/examples/webhook-payment-payload#falha-no-pagamento)

### OPENPIX:MOVEMENT_REMOVED

This event is sent when a scheduled or pending payment is removed/cancelled by the user.

[See payload example →](/docs/webhook/examples/webhook-payment-payload#pagamento-removido)

## Dispute Events

### OPENPIX:DISPUTE_CREATED
This event is sent when a new dispute is created (Pix Special Return Mechanism).

[See payload example →](/docs/webhook/examples/webhook-created-payload)

### OPENPIX:DISPUTE_ACCEPTED
This event is sent when a dispute is accepted and the amount will be returned.

[See payload example →](/docs/webhook/examples/webhook-accepted-payload)

### OPENPIX:DISPUTE_REJECTED
This event is sent when a dispute is rejected.

[See payload example →](/docs/webhook/examples/webhook-rejected-payload)

### OPENPIX:DISPUTE_CANCELED
This event is sent when a dispute is canceled.

[See payload example →](/docs/webhook/examples/webhook-canceled-payload)

## Account Registration Events

Events for platforms using customer onboarding (OpenPix for Platforms).

### ACCOUNT_REGISTER_APPROVED
This event is sent when a subaccount registration is approved in compliance.

[See payload example →](/docs/webhook/examples/webhook-account-register-approved-payload)

### ACCOUNT_REGISTER_REJECTED
This event is sent when a subaccount registration is rejected in compliance.

### ACCOUNT_REGISTER_PENDING
This event is sent when a subaccount registration is under review.

## Pix Automatic Events

Events related to the recurring payment feature (similar to direct debit).

### PIX_AUTOMATIC_APPROVED
This event is sent when a Pix Automatic authorization is granted by the payer.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_approved)

### PIX_AUTOMATIC_REJECTED
This event is sent when a Pix Automatic authorization is denied or canceled.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_rejected)

### PIX_AUTOMATIC_COBR_CREATED
This event is sent when a recurring Pix Automatic charge is created.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_created)

### PIX_AUTOMATIC_COBR_APPROVED
This event is sent when a recurring Pix Automatic charge is approved/scheduled.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_approved)

### PIX_AUTOMATIC_COBR_REJECTED
This event is sent when a recurring Pix Automatic charge execution fails.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_rejected)

### PIX_AUTOMATIC_COBR_COMPLETED
This event is sent when a recurring Pix Automatic charge is successfully paid.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_completed)

### PIX_AUTOMATIC_COBR_TRY_REJECTED
This event is sent when a charge attempt is rejected.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_try_rejected)

### PIX_AUTOMATIC_COBR_TRY_REQUESTED
This event is sent when a charge attempt is made.

[See payload example →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_try_requested)


