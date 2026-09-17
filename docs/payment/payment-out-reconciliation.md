---
id: payment-out-reconciliation
title: Conciliação do pagamento Pix (Pix Out) — correlationID x endToEndId
sidebar_label: Conciliação do pagamento (Pix Out)
sidebar_position: 7
tags:
  - payment
  - transaction
  - conciliação
  - api
---

# Conciliação do pagamento Pix (Pix Out)

## Resumo

Depois de criar um pagamento Pix (Pix Out) via `POST /api/v1/payment` com um
**`correlationID`** próprio, é comum precisar **relacionar** esse
`correlationID` com o **`endToEndId`** (o id oficial da transação Pix, gerado
pelo Banco Central) para fins de conciliação.

| Forma | Quando usar |
| --- | --- |
| **Webhook `OPENPIX:MOVEMENT_CONFIRMED`** | Você quer ser **avisado** no momento em que o pagamento é confirmado, já recebendo `correlationID` e `endToEndId` juntos — sem polling. |
| **`GET /api/v1/payment/{id}`** | Você quer **consultar sob demanda** um pagamento específico, usando o **`correlationID`** que você mesmo definiu. |
| **`GET /api/v1/payment`** | Você quer conciliar **em lote**, listando os pagamentos de um período. |

:::caution GET /api/v1/transaction não retorna o correlationID do pagamento
É comum tentar localizar o `correlationID` consultando
**`GET /api/v1/transaction`** (ou `GET /api/v1/transaction?withdrawal={endToEndId}`)
— mas esse endpoint lista as **transações Pix** (o evento processado pelo Banco
Central), não os **pagamentos** (o pedido que você fez). Por isso a resposta
traz `endToEndId`, `value`, `time`, contas, etc., mas **não** traz o
`correlationID` do pagamento que originou aquela transação.

Para relacionar as duas pontas, use sempre `GET /api/v1/payment/{id}` ou o
webhook `OPENPIX:MOVEMENT_CONFIRMED`, descritos abaixo.
:::

---

## Forma 1 (recomendada) — Webhook `OPENPIX:MOVEMENT_CONFIRMED`

Assim que o pagamento é confirmado, a Woovi dispara o webhook
**`OPENPIX:MOVEMENT_CONFIRMED`** já com o `payment.correlationID` e o
`transaction.endToEndId` no mesmo payload:

```json
{
  "event": "OPENPIX:MOVEMENT_CONFIRMED",
  "payment": {
    "value": 30,
    "status": "CONFIRMED",
    "destinationAlias": "06882328684",
    "comment": "",
    "correlationID": "222a1750-de17-406c-bd0c-25af9a5a5d08"
  },
  "transaction": {
    "value": 30,
    "endToEndId": "E23114447202303161242u80lZNR7nQZ",
    "time": "2023-03-16T12:42:47.526Z"
  }
}
```

Salvando esse mapeamento assim que o webhook chega, você deixa de precisar
consultar a API depois para descobrir o `endToEndId` de um pagamento — ele já
fica disponível no seu sistema desde a confirmação.

Para receber esse evento, crie um webhook selecionando o evento
**`OPENPIX:MOVEMENT_CONFIRMED`** — veja
**[Tipos de eventos do Webhook](/docs/webhook/webhook-events-type#openpixmovement_confirmed)**
e o **[Payload de Pagamentos](/docs/webhook/examples/webhook-payment-payload)**.
A criação pode ser feita **[via plataforma](/docs/webhook/platform/webhook-platform-api)**
ou **[via API](/docs/webhook/webhook-api)**; para validar a assinatura, veja
**[Validando o HMAC do webhook](/docs/webhook/seguranca/webhook-hmac)**.

:::info Em caso de falha
Quando o pagamento falha, o evento disparado é **`OPENPIX:MOVEMENT_FAILED`**,
com `payment.status` em `FAILED` e um objeto `error` com o motivo. Veja a
**[lista de erros de pagamento](/docs/payment/payment-failed-errors)**.
:::

---

## Forma 2 — Consultar pelo correlationID (`GET /api/v1/payment/{id}`)

Se preferir consultar sob demanda em vez de depender do webhook, use o
endpoint de pagamento passando o **`correlationID`** (ou o `id` interno) que
você definiu na criação:

[Get one Payment request](</api#tag/payment-request-access/GET/api/v1/payment/{id}>)

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/payment/222a1750-de17-406c-bd0c-25af9a5a5d08 \
  --header 'Authorization: {APP_ID}'
```

A resposta traz o `payment` (com `correlationID`, `status`, `value`, etc.) e,
quando a transação já existe, o objeto `transaction` com o `endToEndId`:

```json
{
  "payment": {
    "status": "CONFIRMED",
    "value": 30,
    "correlationID": "222a1750-de17-406c-bd0c-25af9a5a5d08",
    "destinationAlias": "06882328684"
  },
  "transaction": {
    "value": 30,
    "endToEndId": "E23114447202303161242u80lZNR7nQZ",
    "time": "2023-03-16T12:42:47.526Z"
  },
  "destination": {
    "name": "...",
    "taxID": "...",
    "pixKey": "...",
    "bank": "..."
  }
}
```

`payment.correlationID` e `transaction.endToEndId` vêm juntos na mesma
resposta — não é necessária nenhuma outra chamada para relacioná-los.

:::tip
O `correlationID` também é a chave de idempotência do pagamento — reuse-o em
retentativas até o pagamento chegar a um estado final (`CONFIRMED` ou
`FAILED`). Veja **[Idempotência em Pagamentos](/docs/payment/payment-idempotency)**
e a **[Máquina de Estados do Pagamento](/docs/payment/payment-state-machine)**.
:::

---

## Forma 3 — Listar em lote (`GET /api/v1/payment`)

Para fechar um período inteiro de uma vez — em vez de consultar pagamento por
pagamento — use a listagem, filtrando por data:

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/payment?start=2026-06-01T00:00:00Z&end=2026-06-30T23:59:59Z&limit=100' \
  --header 'Authorization: {APP_ID}'
```

Cada item da lista já traz `payment.correlationID` e `transaction.endToEndId`
juntos. Veja os detalhes de paginação em
**[Como consultar e listar Pagamentos?](/docs/payment/payment-how-to-list)**.

---

## E o reembolso? Como vincular um reembolso à transação original

O mesmo tipo de dúvida aparece na direção contrária: depois de estornar uma
cobrança recebida, como saber a qual cobrança original aquele reembolso
pertence?

A resposta é a mesma lógica: **use o identificador da cobrança original**
(`correlationID`, `transactionID` ou id interno) como âncora — tanto para criar
quanto para consultar os reembolsos, já que todo reembolso é criado e
consultado **dentro do contexto da cobrança que ele estorna**:

- **Criar:** `POST /api/v1/charge/{id}/refund` — veja
  **[Como criar um reembolso de uma cobrança usando a API?](/docs/refund/charge-refund-create-api)**
- **Consultar todos os reembolsos de uma cobrança:** `GET /api/v1/charge/{id}/refund`
  — veja **[Como buscar todos os reembolsos de uma cobrança usando a API?](/docs/refund/charge-refund-get-all-api)**

Assim, a partir do `correlationID` que você já usa para identificar a cobrança
no seu sistema, você chega direto em todos os reembolsos associados a ela, sem
precisar cruzar dados manualmente entre cobrança, transação e estorno.

---

## Fluxo recomendado

1. Crie o pagamento com um `correlationID` próprio, estável por operação (veja
   **[Idempotência em Pagamentos](/docs/payment/payment-idempotency)**).
2. Prefira o **webhook `OPENPIX:MOVEMENT_CONFIRMED`** para capturar
   `correlationID` e `endToEndId` juntos no momento da confirmação, sem
   polling.
3. Como alternativa ou reforço, consulte
   **`GET /api/v1/payment/{correlationID}`** sob demanda.
4. Para fechamento de período, use **`GET /api/v1/payment`** com `start`/`end`.
5. Para reembolsos de cobranças, ancore sempre pelo `correlationID`/`id` da
   **cobrança original** ao criar (`POST /api/v1/charge/{id}/refund`) e ao
   consultar (`GET /api/v1/charge/{id}/refund`).
6. Reserve **`GET /api/v1/transaction`** para consultar o histórico de
   transações Pix recebidas ou o detalhe de uma transação pelo `endToEndId` —
   não para localizar o `correlationID` de um pagamento.
