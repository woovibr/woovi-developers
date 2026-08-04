---
title: Adicionando escopos ao seu AppID
tags:
  - api
  - security
  - scopes
---

Para aumentar a segurança das suas integrações, você pode restringir um AppID para que ele tenha acesso apenas às rotas da API que ele realmente precisa, atribuindo **escopos** (scopes) a ele.

Um AppID com escopos definidos só consegue acessar os endpoints liberados para o(s) escopo(s) atribuído(s). Por exemplo, ao atribuir apenas o escopo `CHARGE_POST` a um AppID, ele poderá exclusivamente criar cobranças, e nada mais.

É possível atribuir múltiplos escopos a um mesmo AppID conforme a necessidade da sua integração.

## Adicionando escopos ao criar uma nova API/Plugin

Ao criar uma nova API ou Plugin (veja o passo a passo em [Primeiros Passos](./api-getting-started.md)), você pode selecionar os escopos desejados durante o fluxo de criação, antes de confirmar a geração do AppID.

## Adicionando escopos a um AppID já existente

Você também pode editar os escopos de uma API/Plugin já criada. Para isso, acesse os detalhes da API na [lista de APIs](https://app.woovi.com.br/home/applications/tab/list) e adicione ou remova os escopos desejados.

:::caution
Caso nenhum escopo seja definido, o AppID mantém acesso completo a todas as rotas liberadas para o tipo de API/Plugin escolhido.
:::

## Catálogo de escopos disponíveis

Os escopos abaixo estão organizados por recurso:

### ACCOUNT

- `ACCOUNT_GET`
- `ACCOUNT_GET_LIST`
- `ACCOUNT_POST`
- `ACCOUNT_DELETE`
- `ACCOUNT_WITHDRAW_POST`

### ACCOUNT_REGISTER

- `ACCOUNT_REGISTER_POST`
- `ACCOUNT_REGISTER_PATCH`
- `ACCOUNT_REGISTER_GET`
- `ACCOUNT_REGISTER_DELETE`
- `ACCOUNT_REGISTER_UNLOCKED_POST`

### APPLICATION

- `APPLICATION_POST`
- `APPLICATION_DELETE`
- `APPLICATION_ROTATE_POST`

### AUTH

- `TOKEN_VALIDATE_GET`

### CASHBACK_FIDELITY

- `CASHBACK_FIDELITY_BALANCE_GET`
- `CASHBACK_FIDELITY_POST`

### CHARGE

- `CHARGE_GET`
- `CHARGE_GET_LIST`
- `CHARGE_POST`
- `CHARGE_PATCH`
- `CHARGE_DELETE`
- `CHARGE_BRCODE_IMAGE_GET`
- `CHARGE_IMAGE_GET`

### CHARGE_REFUND

- `CHARGE_REFUND_GET_LIST`
- `CHARGE_REFUND_POST`

### COMPANY

- `COMPANY_GET`

### CUSTOMER

- `CUSTOMER_GET`
- `CUSTOMER_GET_LIST`
- `CUSTOMER_POST`
- `CUSTOMER_PATCH`

### DECODE

- `DECODE_EMV_POST`

### DISPUTE

- `DISPUTE_POST`
- `DISPUTE_GET`
- `DISPUTE_GET_LIST`

### GIFTBACK

- `GIFTBACK_BALANCE_GET`

### PARTNER

- `PARTNER_COMPANY_POST`
- `PARTNER_COMPANY_GET`
- `PARTNER_COMPANY_GET_LIST`
- `PARTNER_APPLICATION_POST`

### PAYMENT

- `PAYMENT_GET`
- `PAYMENT_GET_LIST`
- `PAYMENT_POST`
- `PAYMENT_APPROVE_POST`

### PIX_QRCODE

- `PIX_QRCODE_GET`
- `PIX_QRCODE_GET_LIST`
- `PIX_QRCODE_POST`
- `PIX_QRCODE_DELETE`

### PSP

- `PSP_GET_LIST`

### REFUND

- `REFUND_GET`
- `REFUND_GET_LIST`
- `REFUND_POST`

### STATEMENT

- `STATEMENT_GET`

### SUBACCOUNT

- `SUBACCOUNT_GET`
- `SUBACCOUNT_GET_LIST`
- `SUBACCOUNT_POST`
- `SUBACCOUNT_WITHDRAW_POST`
- `SUBACCOUNT_TRANSFER_POST`
- `SUBACCOUNT_DELETE`
- `SUBACCOUNT_DEBIT_POST`

### SUBSCRIPTION

- `SUBSCRIPTION_GET`
- `SUBSCRIPTION_GET_LIST`
- `SUBSCRIPTION_POST`
- `SUBSCRIPTION_VALUE_PUT`
- `SUBSCRIPTION_CANCEL_PUT`
- `SUBSCRIPTION_INSTALLMENT_GET_LIST`
- `SUBSCRIPTION_INSTALLMENT_GET`
- `SUBSCRIPTION_INSTALLMENT_COBR_POST`
- `SUBSCRIPTION_INSTALLMENT_COBR_RETRY_POST`

### TRANSACTION

- `TRANSACTION_GET`
- `TRANSACTION_GET_LIST`

### TRANSFER

- `TRANSFER_POST`

### WEBHOOK

- `WEBHOOK_GET`
- `WEBHOOK_GET_LIST`
- `WEBHOOK_POST`
- `WEBHOOK_DELETE`
- `WEBHOOK_IPS_GET`
- `WEBHOOK_EVENTS_GET_LIST`
- `WEBHOOK_TOGGLE_ACTIVATION_GET`

:::info
Artigo Original [https://ajuda.woovi.com/hc/duvidas-frequentes/articles/1769459329-adicionado-escopos-no-app_id](https://ajuda.woovi.com/hc/duvidas-frequentes/articles/1769459329-adicionado-escopos-no-app_id)
:::
