---
id: charge
sidebar_position: 0
title: Charge
tags:
  - qrcode
  - charge
  - payment
---
A Charge allows you to receive payment via Pix.

The charge has a fixed amount and can only be paid once.

Charge is ideal for reconciling your payments.

## Use cases

- Accept payments in physical stores
- Accept payments in ecommerce
- Accept single payments
- Accept payments with interest and penalties
- Accept recurring payments (see also [Subscriptions/Recurrence](./subscription-recurrence))

## Charge types

Within charges, we have two types: Charges and Charges with maturity.

The charge type determines how it will behave when it reaches the expiration date.

In our APIs, we use the `type` property to represent the type of a charge.

### Charge (cob)

A charge (cob), after passing the expiration date, can no longer be paid; Our system will change the billing status to `EXPIRED`.

Charges in our APIs are represented by the `DYNAMIC` type.

For more information on how you can create a charge using our API, see [How to use the API to create a charge (cob)?](./charge/how-to-create-charge-using-api)

### Charge with maturity (cobv)

A due charge (cobv), after passing its expiration date, can still be paid; With the difference that there will be a penalty and interest.

Due charges in our APIs are represented by the `OVERDUE` type.

For more information on how you can create a due charge using our API, see [How do I use the API to create a due charge (cobv)?](./charge/how-to-create-cobv-using- api)