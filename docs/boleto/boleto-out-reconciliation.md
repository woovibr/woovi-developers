---
id: boleto-out-reconciliation
title: Conciliação do pagamento de boleto
sidebar_label: Conciliação do pagamento
tags:
- boleto
- payment
- conciliação
- api
---

# Conciliação do pagamento de boleto

## Resumo

Depois de **pagar um boleto** pela API (fluxo *Boleto OUT* — veja
**[Como pagar um boleto via API](/docs/boleto/boleto-out-api)**), o pagamento é
processado de forma **assíncrona**. Este guia mostra as duas formas de
**conciliar** e saber que o boleto foi efetivamente pago:

| Forma | Quando usar |
| --- | --- |
| **Webhook `OPENPIX:MOVEMENT_CONFIRMED`** | Você quer ser **avisado** no momento em que o pagamento é confirmado, sem ficar consultando a API. |
| **`GET /api/v1/payment/{id}`** | Você quer **consultar** o estado atual do pagamento pontualmente (polling ou verificação sob demanda). |

Nas duas formas, a amarração com a sua operação é feita pelo **`correlationID`**
que você definiu na criação do pagamento.

:::note Valores em centavos
Todos os valores (`value`) são expressos em **centavos** (`300` = R$ 3,00).
:::

---

## Máquina de status do pagamento

```
CREATED ──aprovação──▶ APPROVED ──▶ PROCESSING ──▶ CONFIRMED
                                        │
                                        └──falha──▶ FAILED
```

| `status` | Significado |
| --- | --- |
| `CREATED` | Pagamento criado, aguardando aprovação |
| `APPROVED` | Aprovado; pagamento do boleto disparado ao provedor |
| `PROCESSING` | Em processamento no provedor |
| `CONFIRMED` | Boleto **pago** (estado final) |
| `FAILED` | Falha no processamento (estado final) |

A conciliação acontece nos estados finais: **`CONFIRMED`** (pago) ou **`FAILED`**
(falha).

---

## Forma 1 — Webhook `OPENPIX:MOVEMENT_CONFIRMED`

Quando o pagamento do boleto é confirmado, a Woovi dispara o webhook
**`OPENPIX:MOVEMENT_CONFIRMED`** para a URL configurada na sua conta. É o mesmo
evento de confirmação de PIX OUT, mas no pagamento de boleto o payload traz um
objeto **`boleto`** (com `barcode` e `expiresDate`):

```json
{
  "event": "OPENPIX:MOVEMENT_CONFIRMED",
  "account": {
    "accountId": "6843167bb88789ea9046003f"
  },
  "payment": {
    "value": 300,
    "status": "CONFIRMED",
    "comment": "teste boleto out",
    "correlationID": "boleto-out-teste-006",
    "metadata": {}
  },
  "boleto": {
    "barcode": "34191091725285164077229826090002215000000000300",
    "expiresDate": "2026-07-08T02:59:59.999Z"
  }
}
```

| Campo | Descrição |
| --- | --- |
| `event` | `OPENPIX:MOVEMENT_CONFIRMED` no pagamento confirmado |
| `account.accountId` | Conta de origem que pagou o boleto |
| `payment.value` | Valor pago, **em centavos** |
| `payment.status` | `CONFIRMED` (pago) |
| `payment.correlationID` | O `correlationID` que **você** definiu ao criar o pagamento |
| `payment.metadata` | Metadados que você enviou na criação (se houver) |
| `boleto.barcode` | Código de barras do boleto pago |
| `boleto.expiresDate` | Data de vencimento do boleto (ISO 8601) |

Ao receber o webhook, use o **`payment.correlationID`** para localizar o
pagamento na sua base e marcá-lo como **pago**.

:::info Em caso de falha
Quando o pagamento falha, o evento disparado é **`OPENPIX:MOVEMENT_FAILED`**, com
`payment.status` em `FAILED` e um objeto `error` com o motivo. Veja
**[Payload de Pagamentos](/docs/webhook/examples/webhook-payment-payload)** e a
**[lista de erros de pagamento](/docs/payment/payment-failed-errors)**.
:::

Para receber esse evento, crie um webhook selecionando o evento
**`OPENPIX:MOVEMENT_CONFIRMED`** — veja
**[Tipos de eventos do Webhook](/docs/webhook/webhook-events-type#openpixmovement_confirmed)**.
A criação em si pode ser feita
**[via plataforma](/docs/webhook/platform/webhook-platform-api)** ou
**[via API](/docs/webhook/api/webhook-api)**; para validar a assinatura, veja
**[Validando o HMAC do webhook](/docs/webhook/seguranca/webhook-hmac)**.

---

## Forma 2 — Consultar o pagamento (`GET /api/v1/payment/{id}`)

Se preferir consultar em vez de receber o webhook, use o endpoint de pagamento
passando o `correlationID` (ou o `id`) do pagamento:

[Get one Payment request](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment~1%7Bid%7D/get>)

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/payment/boleto-out-teste-006 \
  --header 'Authorization: {APP_ID}'
```

A resposta traz o `payment` com o **`status`** atual:

```json
{
  "payment": {
    "status": "CONFIRMED",
    "value": 300,
    "comment": "teste boleto out",
    "correlationID": "boleto-out-teste-006",
    "sourceAccountId": "6843167bb88789ea9046003f"
  }
}
```

Concilie olhando o campo **`payment.status`**:

- **`CONFIRMED`** → boleto pago (estado final, pode conciliar).
- **`FAILED`** → pagamento falhou (estado final).
- **`CREATED` / `APPROVED` / `PROCESSING`** → ainda em andamento; consulte
  novamente mais tarde.

---

## Fluxo recomendado

1. Crie e aprove o pagamento com um `correlationID` próprio da sua operação
   (veja **[Como pagar um boleto via API](/docs/boleto/boleto-out-api)**).
2. Prefira o **webhook `OPENPIX:MOVEMENT_CONFIRMED`** para ser avisado da
   confirmação sem polling. Amarre pelo `payment.correlationID`.
3. Como alternativa ou reforço, consulte **`GET /api/v1/payment/{correlationID}`**
   e verifique `payment.status` até chegar em `CONFIRMED` (pago) ou `FAILED`
   (falha).
