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
processado de forma **assíncrona**. Este guia mostra as três formas de
**conciliar** e saber que o boleto foi efetivamente pago:

| Forma | Quando usar |
| --- | --- |
| **Webhook `OPENPIX:MOVEMENT_CONFIRMED`** | Você quer ser **avisado** no momento em que o pagamento é confirmado, sem ficar consultando a API. |
| **`GET /api/v1/payment/{id}`** | Você quer **consultar** o estado atual de **um** pagamento pontualmente (polling ou verificação sob demanda). |
| **`GET /api/v1/boleto-transaction`** | Você quer conciliar **em lote**, listando todos os boletos pagos em um período — e precisa da **tarifa** cobrada em cada um. |

Nas duas primeiras formas, a amarração com a sua operação é feita pelo
**`correlationID`** que você definiu na criação do pagamento. A terceira atende
aos dois casos: **listar** as transações de um período ou consultar **uma**
transação específica pelo **`boletoTransactionID`**, o id público da transação.

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
**[via API](/docs/webhook/webhook-api)**; para validar a assinatura, veja
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

## Forma 3 — Listar as transações de boleto (`GET /api/v1/boleto-transaction`)

As duas formas anteriores respondem sobre **um** pagamento. Quando o que você
precisa é fechar um período — conferir tudo que foi pago entre duas datas, com a
**tarifa** de cada boleto — use a API de transações de boleto.

Filtre por `type=BOLETO_OUT` para trazer apenas os boletos que a **sua empresa
pagou** (sem `BOLETO_OUT`, a listagem também traz os boletos que os seus
pagadores pagaram):

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/boleto-transaction?type=BOLETO_OUT&start=2026-07-01T00:00:00.000Z&end=2026-07-31T23:59:59.000Z' \
  --header 'Authorization: {APP_ID}'
```

```json
{
  "status": "OK",
  "pageInfo": {
    "skip": 0,
    "limit": 100,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "boletoTransactions": [
    {
      "boletoTransactionID": "btx_019f6123d8ff7332a4a16de2ed15a3cb",
      "type": "BOLETO_OUT",
      "status": "CONFIRMED",
      "value": 3827,
      "fee": 115,
      "createdAt": "2026-07-14T14:59:27.103Z"
    }
  ]
}
```

Concilie pelo campo **`status`**: **`CONFIRMED`** é o boleto pago. O **`value`** é
o valor que saiu da sua conta e o **`fee`** é a tarifa cobrada pela operação.

Para o detalhe de **uma** transação, consulte pelo `boletoTransactionID` — é o
mesmo id que a listagem devolve e que você pode guardar na sua base para conferir
a transação depois, sem varrer o período de novo:

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/boleto-transaction/btx_019f6123d8ff7332a4a16de2ed15a3cb \
  --header 'Authorization: {APP_ID}'
```

```json
{
  "boletoTransaction": {
    "boletoTransactionID": "btx_019f6123d8ff7332a4a16de2ed15a3cb",
    "type": "BOLETO_OUT",
    "status": "CONFIRMED",
    "value": 3827,
    "fee": 115,
    "createdAt": "2026-07-14T14:59:27.103Z"
  }
}
```

:::note De onde vem o `boletoTransactionID`
No **boleto OUT** o id vem da **listagem**: o webhook `OPENPIX:MOVEMENT_CONFIRMED`
não o inclui — ele identifica o pagamento pelo `payment.correlationID`. Já no
**boleto IN** o id chega direto no webhook `BOLETO_SETTLED`, e aí você consulta a
transação sem listar nada — veja
**[Conciliação de liquidação do Boleto](/docs/boleto/boleto-reconciliation)**.
:::

:::note Escopos da aplicação
A listagem exige o escopo **`BOLETO_TRANSACTION_GET_LIST`** e o detalhe exige
**`BOLETO_TRANSACTION_GET`**. Sem o escopo correspondente a chamada responde
**`403`**.
:::

:::note Boleto OUT não tem `settledAt` nem `charge`
Esses dois campos aparecem só em transações **`BOLETO_IN`** — a liquidação é o
crédito na sua conta de um boleto que o seu pagador pagou. No `BOLETO_OUT` o
estado final é o **`status`** `CONFIRMED`.
:::

Os filtros de data (`start`/`end`) e a paginação (`skip`/`limit`) estão descritos
na **[referência da API](https://developers.woovi.com/api#tag/boleto)**.

---

## Fluxo recomendado

1. Crie e aprove o pagamento com um `correlationID` próprio da sua operação
   (veja **[Como pagar um boleto via API](/docs/boleto/boleto-out-api)**).
2. Prefira o **webhook `OPENPIX:MOVEMENT_CONFIRMED`** para ser avisado da
   confirmação sem polling. Amarre pelo `payment.correlationID`.
3. Como alternativa ou reforço, consulte **`GET /api/v1/payment/{correlationID}`**
   e verifique `payment.status` até chegar em `CONFIRMED` (pago) ou `FAILED`
   (falha).
4. No fechamento do dia ou do mês, rode **`GET /api/v1/boleto-transaction?type=BOLETO_OUT`**
   com o período desejado para conferir todos os pagamentos de uma vez e apurar as
   tarifas.
