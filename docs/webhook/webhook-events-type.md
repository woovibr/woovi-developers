---
title: "Tipos de eventos do Webhook"
description: "Tipos de eventos do Webhook"
tags:
  - webhook
---

## Tipos de eventos do Webhook

O Webhook é um recurso que permite que a Woovi envie notificações para sua aplicação quando um evento ocorre. 
Por exemplo, quando uma cobrança é paga, a Woovi envia uma notificação para o seu servidor.

Abaixo, você pode ver uma lista de todos os eventos que a Woovi envia para sua aplicação.

:::tip Obtenha a lista de eventos via API
Você também pode obter a lista completa de eventos disponíveis programaticamente através da nossa API. 
Consulte o endpoint [GET /api/v1/webhook/events](https://developers.woovi.com/api#tag/webhook/paths/~1api~1v1~1webhook~1events/get) na referência da API.
:::

## Eventos de cobrança

Os eventos de cobrança são enviados quando uma cobrança é paga.

### OPENPIX:CHARGE_COMPLETED

Esse evento é enviado quando uma cobrança é paga.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-charge-payload)

### OPENPIX:CHARGE_EXPIRED

Esse evento é enviado quando uma cobrança expira.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-charge-expired)

### OPENPIX:CHARGE_CREATED

Esse evento é enviado quando uma cobrança é criada.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-charge-created)

### OPENPIX:CHARGE_COMPLETED_NOT_SAME_CUSTOMER_PAYER

Esse evento é enviado quando uma cobrança é paga com um `payer` diferente do `customer`.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-charge-completed-not-same-payer-payload)

## Eventos de transação

Os eventos de transação são enviados quando uma transação é recebida.

### OPENPIX:TRANSACTION_RECEIVED

Esse evento é enviado quando uma transação é recebida, seja ela de uma cobrança ou de um QR code estático.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-transaction-received)

### OPENPIX:TRANSACTION_REFUND_RECEIVED (DEPRECATED)

Esse evento é enviado quando é realizado o reembolso de uma transação.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-refund-payload)

### PIX_TRANSACTION_REFUND_RECEIVED_CONFIRMED

Esse evento é enviado quando uma transação de reembolso é recebida e confirmada.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-refund-received-confirmed)

### PIX_TRANSACTION_REFUND_RECEIVED_REJECTED

Esse evento é enviado quando uma transação de reembolso é recebida mas é rejeitada.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-refund-received-rejected)

### PIX_TRANSACTION_REFUND_SENT_CONFIRMED

Esse evento é enviado quando uma transação de reembolso é enviada e confirmada.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-refund-sent-confirmed)

### PIX_TRANSACTION_REFUND_SENT_REJECTED

Esse evento é enviado quando uma transação de reembolso é enviada mas é rejeitada.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-refund-sent-rejected)

## Eventos de Pagamento Instantâneo

### OPENPIX:MOVEMENT_CONFIRMED

Esse evento é enviado quando um pagamento é confirmado.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-payment-payload#pagamento-confirmado)

### OPENPIX:MOVEMENT_FAILED

Esse evento é enviado quando um pagamento confirmado falha.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-payment-payload#falha-no-pagamento)

### OPENPIX:MOVEMENT_REMOVED

Esse evento é enviado quando um pagamento é removido.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-payment-payload#pagamento-removido)

## Eventos de Movimentos

### OPENPIX:DISPUTE_CREATED
Esse evento é enviado quando uma disputa é criada

[Ver exemplo de payload →](/docs/webhook/examples/webhook-created-payload)

### OPENPIX:DISPUTE_ACCEPTED
Esse evento é enviado quando uma disputa é aceita 

[Ver exemplo de payload →](/docs/webhook/examples/webhook-accepted-payload)

### OPENPIX:DISPUTE_REJECTED
Esse evento é enviado quando uma disputa é rejeitada

[Ver exemplo de payload →](/docs/webhook/examples/webhook-rejected-payload)

### OPENPIX:DISPUTE_CANCELED
Esse evento é enviado quando uma disputa é cancelada

[Ver exemplo de payload →](/docs/webhook/examples/webhook-canceled-payload)

## Eventos de Registro de contas 

### ACCOUNT_REGISTER_APPROVED
Esse evento é enviado quando um registro de subconta é aprovado no compliance.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-account-register-approved-payload)

### ACCOUNT_REGISTER_REJECTED
Esse evento é enviado quando um registro de subconta é reprovado no compliance.

### ACCOUNT_REGISTER_PENDING
Esse evento é enviado quando um registro de subconta está em análise.

[Ver exemplo de payload →](/docs/webhook/examples/webhook-account-register-pending-payload)

## Eventos de Pix Automatico

### PIX_AUTOMATIC_APPROVED
Esse evento é enviado quando um pix automatico é aprovado

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_approved)

### PIX_AUTOMATIC_REJECTED
Esse evento é enviado quando um pix automatico é rejeitado

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_rejected)

### PIX_AUTOMATIC_COBR_CREATED
Esse evento é enviado quando uma cobrança de pix automatico é criada

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_created)

### PIX_AUTOMATIC_COBR_APPROVED
Esse evento é enviado quando uma cobrança de pix automatico é aprovada

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_approved)

### PIX_AUTOMATIC_COBR_REJECTED
Esse evento é enviado quando uma cobrança de pix automatico é rejeitada

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_rejected)

### PIX_AUTOMATIC_COBR_COMPLETED
Esse evento é enviado quando uma cobrança de pix automatico é paga

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_completed)

### PIX_AUTOMATIC_COBR_TRY_REJECTED
Esse evento é enviado quando uma tentativa de cobrança é rejeitada

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_try_rejected)

### PIX_AUTOMATIC_COBR_TRY_REQUESTED
Esse evento é enviado quando uma tentativa de cobrança é realizada

[Ver exemplo de payload →](/docs/pix-automatic/webhooks/pix-automatic-webhooks#pix_automatic_cobr_try_requested)

