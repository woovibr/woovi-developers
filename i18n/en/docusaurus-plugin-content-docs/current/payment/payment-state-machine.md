---
id: payment-state-machine
sidebar_position: 6
title: Payment State Machine
tags:
  - payment
  - api
---

## How the Payment State Machine works

A Payment has the following states.

### Requested

The Requested state means a user has requested a payment to a Pix key, and it is awaiting approval.

This state can move to the following states:

- Processing
- Failed

### Processing

The Processing state means the payment was approved, the transaction was created and is now being processed.

This state can move to the following states:

- Confirmed
- Failed

### Confirmed

The Confirmed state means the payment transaction was confirmed, and the given Pix key received the funds.

This is a final state; once reached, it cannot change anymore.

### Failed

The Failed state means an error occurred while creating or during the payment transaction.

This is a final state; once reached, it cannot change anymore.
