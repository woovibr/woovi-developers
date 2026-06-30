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

Este guia mostra como, a partir do webhook de pagamento, acompanhar a
**liquidação** consultando a **API de cobrança** pelo status **`SETTLED`** e pelo
campo **`settledAt`** do método de pagamento `boleto`.

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

## Fluxo recomendado

1. Crie a cobrança com um `correlationID` próprio da sua venda.
2. Ao receber `OPENPIX:CHARGE_COMPLETED`, marque a venda como **paga** e guarde o
   `correlationID` da charge (`charge.correlationID`).
3. Consulte a API de cobrança pelo `correlationID` e verifique
   `paymentMethods.boleto.status`. Quando for **`SETTLED`**, use
   `paymentMethods.boleto.settledAt` como a **data de liquidação**, concilie o
   recebimento e libere o produto.

---

## Perguntas frequentes

**Qual a diferença entre `paidAt` e `settledAt`?**
`paidAt` é quando o pagamento foi reconhecido; `settledAt` é quando o valor foi
efetivamente creditado na sua conta (≈ D+3). Para conciliação, use `settledAt`.

**Posso liberar o produto no `COMPLETED`?**
Só se aceitar o risco de o valor ainda não estar na conta. Para liberar com o
dinheiro garantido, aguarde o `SETTLED`.
