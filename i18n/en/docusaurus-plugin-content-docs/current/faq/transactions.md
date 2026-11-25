---
id: faq-transactions
title: Transactions
sidebar_label: Transactions
tags:
- faq
- transaction
---

### What is a transaction?

A transaction represents any Pix financial movement on the platform.

To access them, select the `Transações` (Transactions) menu.

![Menu Transactions](/img/FAQ/transactions-menu.png)


### What is a standalone Pix?

It's a transaction sent directly to your Pix key without a previously shared charge or static QR code.

Example: a customer transfers an amount to your company's Pix key instead of scanning the charge's QR code.

### Is a fee charged for standalone Pix?

Yes, if the customer sends a standalone Pix to the random key of your Woovi virtual account, a fee of R$ 0.50 applies.

### How do I find a transaction?

The best way to find a Pix transaction is by its endToEndId.

Just search `Transações` (Transactions) for the endToEndId of the transaction you want to find.

![endToEndId](/img/FAQ/endToEndId.png)

The end customer can find this information on the payment receipt.

### What is an endToEndId?

It's a unique identifier that every Pix transaction has. It's usually shown on the payment receipt provided by every bank.

It's generated automatically by Pix (Bacen) and is unique for each transaction.

Example of an endToEndId shown in a transaction's details:

![endToEndId Detail](/img/FAQ/endToEndId-detail.png)

### Where do I find the endToEndId on the bank receipt?

Example of an endToEndId shown on a payment receipt:

![endToEndId Pag](/img/FAQ/pag-endToEndId.png)

The endToEndId usually starts with the uppercase letter `E`.

### Can I refund a transaction?

Yes, you can fully refund a transaction on the platform within 90 days.

Just go to `Transações` (Transactions)

![Menu Transactions](/img/FAQ/transactions-menu.png)

Search for the transaction you want to refund

![Transactions](/img/FAQ/transactions.png)

And click the `Reembolsar` (Refund) button

![Transactions detail](/img/FAQ/transaction-detail.png)

Then confirm the transaction's endToEndId by typing its last 4 characters.

![Refund transactions](/img/FAQ/refund.png)

Remember, once completed, a refund cannot be undone.

### How do I resend a transaction's webhooks?
You can resend a transaction's webhooks by opening its details and triggering them with the `Reenviar Webhook` (Resend webhook) button. 

You'll find the button right below the `Webhooks` table, as shown below.

![Webhooks transactions](/img/FAQ/transaction_webhooks.png)

### How do I see the logs of a transaction's webhook?
Click a row in the webhooks table to see the logs of that specific webhook.

![Webhooks transactions log](/img/FAQ/transaction_webhooks_log.png)

### What is a transaction's `type`?

The `type` value indicates the kind of transaction. It can
currently be one of the following:

- `PAYMENT`: The transaction is a payment.
- `WITHDRAW`: The transaction is a withdrawal.
