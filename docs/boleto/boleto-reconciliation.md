---
id: boleto-reconciliation
title: Conciliação de liquidação do Boleto
sidebar_label: Conciliação de liquidação
tags:
- boleto
- conciliação
- liquidação
---

# Conciliação de liquidação do Boleto

## Resumo

Um boleto tem **dois momentos** distintos, e diferenciá-los é essencial para
conciliar corretamente:

| Momento | O que significa | Quando acontece |
| --- | --- | --- |
| **Pagamento** | O banco reconheceu que o boleto foi pago | No ato do pagamento |
| **Liquidação** | O valor foi compensado e **creditado na sua conta** | Em até **3 dias úteis** (≈ D+3) após o pagamento |

O webhook de boleto (**`OPENPIX:CHARGE_COMPLETED`**) é disparado no
**pagamento** — veja **[Webhook de Boleto pago](/docs/boleto/boleto-webhook)**.
Para conferência financeira (bater o valor recebido com a venda) e liberação de
produto, o momento que importa é a **liquidação**.

Para a liquidação você tem três caminhos, do mais recomendado ao de reforço:

| Forma | Quando usar |
| --- | --- |
| **Webhook `BOLETO_SETTLED`** | Você quer ser **avisado** no momento em que o valor é creditado, sem polling. É o caminho recomendado. |
| **`GET /api/v1/boleto-transaction`** | Você quer conciliar **em lote**, listando o que liquidou em um período (filtro por `settledStart`/`settledEnd`). |
| **API de cobrança pelo `correlationID`** (`paymentMethods.boleto.status` = `SETTLED` + `settledAt`) | Você já integra a cobrança e quer verificar **uma** venda pontualmente, pelo mesmo `correlationID` que já usa. |

---

## Máquina de status do boleto

O status fica em `paymentMethods.boleto.status` na cobrança. A transição é:

```
CREATED ──pagamento──▶ COMPLETED ──liquidação (até 3 dias úteis)──▶ SETTLED
   │
   └──expiração/cancelamento──▶ CANCELED
```

| `status` | Significado | Campos relevantes |
| --- | --- | --- |
| `CREATED` | Boleto emitido, aguardando pagamento | — |
| `COMPLETED` | Boleto **pago**, aguardando liquidação | `charge.paidAt` |
| `SETTLED` | Boleto **liquidado** (valor creditado na conta) | `paymentMethods.boleto.settledAt` |
| `CANCELED` | Boleto cancelado | — |

:::warning Pagamento ≠ saldo disponível
Em `COMPLETED` o pagamento foi reconhecido, mas o dinheiro ainda **não** está na
conta. Só concilie o recebimento e libere o produto quando o status chegar em
**`SETTLED`**.
:::

---

## Passo 1 — Identificar a venda no pagamento (webhook)

Quando o boleto é **pago**, você recebe o webhook **`OPENPIX:CHARGE_COMPLETED`**.
O payload traz a cobrança e o objeto `boleto`, com o `correlationID` que você
definiu na criação — é por ele que se amarra o pagamento à sua venda. O formato
completo está em **[Webhook de Boleto pago](/docs/boleto/boleto-webhook)**.

Trecho relevante do payload:

```json
{
  "event": "OPENPIX:CHARGE_COMPLETED",
  "charge": {
    "correlationID": "correlation-id-exemplo",
    "status": "COMPLETED",
    "paidAt": "2026-06-05T09:30:00.000Z",
    "paymentMethods": {
      "boleto": { "status": "COMPLETED", "value": 10000 }
    }
  },
  "boleto": {
    "correlationID": "correlation-id-exemplo",
    "status": "COMPLETED",
    "value": 10000
  }
}
```

Guarde o `correlationID` da charge (`charge.correlationID`) e marque a venda como
**paga** (ainda **não** liquidada).

---

## Passo 2 — Acompanhar a liquidação na API de cobrança

A liquidação ocorre em até 3 dias úteis após o pagamento. Para saber quando o
valor foi creditado, **consulte a cobrança** pelo `correlationID` (ou pelo `id`)
e verifique o método de pagamento `boleto`:

[Consultar cobrança](https://developers.woovi.com.br/api#tag/charge/paths/~1api~1v1~1charge~1%7Bid%7D/get)

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/charge/correlation-id-exemplo \
  --header 'Authorization: SUA_APP_ID'
```

Enquanto **não** liquidou, o status segue `COMPLETED`:

```json
{
  "charge": {
    "correlationID": "correlation-id-exemplo",
    "status": "COMPLETED",
    "paidAt": "2026-06-05T09:30:00.000Z",
    "paymentMethods": {
      "boleto": {
        "method": "BOLETO",
        "correlationID": "correlation-id-exemplo",
        "status": "COMPLETED",
        "value": 10000,
        "fee": 100
      }
    }
  }
}
```

Quando liquida, o status vai para **`SETTLED`** e o campo **`settledAt`** passa a
existir com a data da liquidação:

```json
{
  "charge": {
    "correlationID": "correlation-id-exemplo",
    "status": "COMPLETED",
    "paidAt": "2026-06-05T09:30:00.000Z",
    "paymentMethods": {
      "boleto": {
        "method": "BOLETO",
        "correlationID": "correlation-id-exemplo",
        "status": "SETTLED",
        "settledAt": "2026-06-10T13:01:55.000Z",
        "value": 10000,
        "fee": 100
      }
    }
  }
}
```

- **`paymentMethods.boleto.status === "SETTLED"`** → o valor foi liquidado.
- **`paymentMethods.boleto.settledAt`** → data/hora da liquidação (ISO 8601).

Esse é o momento seguro para conciliar o recebimento e liberar o produto.

:::note
Valores monetários (`value`, `fee`) são expressos em **centavos**
(`10000` = R$ 100,00).
:::

---

## Webhook de liquidação — `BOLETO_SETTLED`

Em vez de consultar a cobrança até virar `SETTLED`, você pode receber o webhook
**`BOLETO_SETTLED`**, disparado no momento em que o valor é **creditado na sua
conta**. Ele dispensa o polling do passo anterior.

O corpo repete os blocos `charge` e `boleto` do `OPENPIX:CHARGE_COMPLETED` de
boleto — quem já trata o evento de pagamento reaproveita o mesmo parsing — e
acrescenta o **`boleto.settledAt`**:

```json
{
  "event": "BOLETO_SETTLED",
  "charge": {
    "correlationID": "minha-venda-123",
    "value": 242898,
    "status": "COMPLETED"
  },
  "boleto": {
    "boletoTransactionID": "btx_019fa55beec9775faf8a069d64dcde54",
    "value": 245000,
    "status": "SETTLED",
    "boletoBarcode": "34191120100002428981103069645110772982609000",
    "boletoDigitable": "34191103036964511077129826090002112010000242898",
    "fee": 299,
    "settledAt": "2026-07-27T10:00:00.000Z"
  }
}
```

Amarre pelo **`charge.correlationID`**, o mesmo que você já usa no evento de
pagamento.

:::note `boleto.value` pode ser maior que `charge.value`
`charge.value` é o valor **emitido**; `boleto.value` é o que o pagador
**efetivamente pagou**, que fica acima do emitido quando o boleto é pago depois do
vencimento (juros e multa). Concilie o crédito pelo `boleto.value`.
:::

Guarde o **`boletoTransactionID`**: é o id público da transação, e com ele você
consulta o detalhe na API abaixo.

Para configurar a URL e validar a assinatura, veja
**[Webhook](/docs/webhook/webhook-events-type)**.

---

## Conciliação em lote — `GET /api/v1/boleto-transaction`

Para fechar um período, liste as transações filtrando pela **data de liquidação**
(`settledStart` / `settledEnd`) e por `type=BOLETO_IN`:

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/boleto-transaction?type=BOLETO_IN&settledStart=2026-07-01T00:00:00.000Z&settledEnd=2026-07-31T23:59:59.000Z' \
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
      "boletoTransactionID": "btx_019fa55beec9775faf8a069d64dcde54",
      "type": "BOLETO_IN",
      "status": "CONFIRMED",
      "value": 245000,
      "fee": 299,
      "createdAt": "2026-07-26T13:04:11.212Z",
      "settledAt": "2026-07-27T10:00:00.000Z",
      "charge": {
        "value": 242898,
        "status": "COMPLETED",
        "boletoBarcode": "34191120100002428981103069645110772982609000",
        "boletoDigitable": "34191103036964511077129826090002112010000242898"
      }
    }
  ]
}
```

Existem **dois intervalos de data independentes**, porque respondem perguntas
diferentes: `start`/`end` filtram por **criação** e `settledStart`/`settledEnd`
por **liquidação**. Para conferência financeira use o de liquidação — as duas datas
voltam em todo item, então dá para bater uma contra a outra.

O detalhe de uma transação sai pelo id recebido no webhook:

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/boleto-transaction/btx_019fa55beec9775faf8a069d64dcde54 \
  --header 'Authorization: {APP_ID}'
```

:::note Escopos da aplicação
A listagem exige **`BOLETO_TRANSACTION_GET_LIST`** e o detalhe exige
**`BOLETO_TRANSACTION_GET`**. Sem o escopo, a chamada responde **`403`**.
:::

---

## Fluxo recomendado

1. Crie a cobrança com um `correlationID` próprio da sua venda.
2. Ao receber `OPENPIX:CHARGE_COMPLETED`, marque a venda como **paga** e guarde o
   `correlationID` da charge (`charge.correlationID`).
3. Assine o webhook **`BOLETO_SETTLED`**. Ao recebê-lo, use `boleto.settledAt` como
   a **data de liquidação**, concilie o recebimento pelo `boleto.value` e libere o
   produto. Guarde o `boleto.boletoTransactionID`.
4. No fechamento do período, rode
   **`GET /api/v1/boleto-transaction?type=BOLETO_IN`** com `settledStart`/`settledEnd`
   para conferir tudo que liquidou de uma vez.
5. Se preferir não depender de webhook, consulte a API de cobrança pelo
   `correlationID` e verifique `paymentMethods.boleto.status`. Quando for
   **`SETTLED`**, use `paymentMethods.boleto.settledAt` como a **data de
   liquidação**, concilie o recebimento e libere o produto.

---

## Perguntas frequentes

**Qual a diferença entre `paidAt` e `settledAt`?**
`paidAt` é quando o pagamento foi reconhecido; `settledAt` é quando o valor foi
efetivamente creditado na sua conta (≈ D+3). Para conciliação, use `settledAt`.

**Posso liberar o produto no `COMPLETED`?**
Só se aceitar o risco de o valor ainda não estar na conta. Para liberar com o
dinheiro garantido, aguarde o `SETTLED`.
