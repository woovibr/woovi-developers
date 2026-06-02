---
id: boleto-webhook
title: Webhook de Boleto pago
sidebar_label: Webhook de Boleto
tags:
- boleto
- webhook
---

# Webhook de Boleto pago

## Resumo

Quando um boleto emitido pela Woovi é **pago**, enviamos um webhook para a URL
que você cadastrou. Hoje existe **um único webhook no fluxo de boleto**: o de
**boleto pago**.

:::warning Boleto pago não é o mesmo que saldo disponível
O webhook é disparado no momento em que o **pagamento** do boleto é confirmado.
A **liquidação** — quando o valor de fato entra na sua conta e fica disponível
para saque/transferência — acontece **depois**, tipicamente em **D+3**.

Enquanto não liquida, a transação fica em **Transações a liquidar**. Não trate o
recebimento do webhook como dinheiro disponível; trate como "cobrança quitada".
:::

---

## Qual webhook é disparado

| Item | Valor |
| --- | --- |
| Evento (`event`) | `OPENPIX:CHARGE_COMPLETED` |
| Quando dispara | No pagamento do boleto |
| Método HTTP | `POST` |
| Content-Type | `application/json` |

O boleto usa o **mesmo evento** de uma cobrança Pix concluída
([`OPENPIX:CHARGE_COMPLETED`](/docs/webhook/webhook-events-type)). A diferença
está no corpo: o payload de boleto inclui o objeto **`boleto`** e **não** inclui
o objeto `pix`. Para diferenciar a forma de pagamento, verifique qual desses
objetos está presente, ou olhe `charge.paymentMethods`.

---

## Como cadastrar o webhook

### Pelo aplicativo

1. Acesse a lista de **[API/Plugins → Webhooks](https://app.woovi.com/home/api/list)**.
2. Clique em **[Adicionar webhook](https://app.woovi.com/home/openpix/webhook-create)**.
3. Informe a **URL** do seu endpoint (precisa responder `2xx`).
4. Selecione o evento **`OPENPIX:CHARGE_COMPLETED`**.
5. (Recomendado) Defina uma **HMAC secret key** para validar a assinatura.
6. Salve e mantenha o webhook **ativo**.

### Pela API

Crie o webhook apontando para o seu endpoint. Ele precisa estar **ativo**
(`isActive: true`) e inscrito no evento `OPENPIX:CHARGE_COMPLETED`.

```bash
curl -X POST https://api.woovi.com/api/v1/webhook \
  -H "Authorization: SUA_APP_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "name": "Boleto pago",
      "event": "OPENPIX:CHARGE_COMPLETED",
      "url": "https://seu-dominio.com/webhooks/woovi",
      "authorization": "opcional-token-que-voce-recebe-de-volta",
      "isActive": true
    }
  }'
```

:::tip
O campo `authorization` é devolvido nos cabeçalhos da requisição do webhook
(`Authorization` / `x-openpix-authorization`), permitindo que seu servidor
confirme que a chamada partiu da Woovi.
:::

---

## Payload recebido

O corpo enviado para a sua URL tem o seguinte formato:

```json
{
  "event": "OPENPIX:CHARGE_COMPLETED",
  "charge": {
    "customer": {
      "name": "Dan",
      "taxID": { "taxID": "31324227036", "type": "BR:CPF" },
      "email": "dan@example.com",
      "correlationID": "..."
    },
    "value": 10000,
    "comment": "Pagamento do pedido #123",
    "identifier": "a1b2c3d4...",
    "correlationID": "seu-id-de-correlacao",
    "transactionID": "...",
    "status": "COMPLETED",
    "additionalInfo": [],
    "fee": 100,
    "discount": 0,
    "valueWithDiscount": 10000,
    "expiresDate": "2026-06-10T18:00:00.000Z",
    "createdAt": "2026-06-02T12:00:00.000Z",
    "updatedAt": "2026-06-05T09:30:00.000Z",
    "paidAt": "2026-06-05T09:30:00.000Z",
    "paymentMethods": { "boleto": { "...": "..." } }
  },
  "boleto": {
    "value": 10000,
    "status": "COMPLETED",
    "correlationID": "seu-id-de-correlacao",
    "boletoBarcode": "34191790010104351004791020150008291070026000",
    "boletoDigitable": "34191.79001 01043.510047 91020.150008 2 91070000026000",
    "fee": 100
  },
  "company": {
    "id": "60f...",
    "name": "Sua Empresa LTDA",
    "taxID": "00000000000000"
  }
}
```

### Campos principais

| Campo | Descrição |
| --- | --- |
| `event` | Sempre `OPENPIX:CHARGE_COMPLETED` para este webhook. |
| `charge` | Objeto completo da cobrança (mesmo formato da API de Charge). Use `charge.correlationID` para casar com o seu pedido. |
| `charge.status` | `COMPLETED` quando a cobrança foi quitada. |
| `charge.value` | Valor da cobrança, em **centavos**. |
| `boleto.value` | Valor do boleto, em **centavos**. |
| `boleto.status` | Status do método de pagamento boleto. |
| `boleto.boletoBarcode` | Código de barras do boleto. |
| `boleto.boletoDigitable` | Linha digitável do boleto. |
| `boleto.fee` | Taxa aplicada, em **centavos**. |
| `company` | Dados da sua empresa (`id`, `name`, `taxID`). |

:::note
Todos os valores monetários (`value`, `fee`, `valueWithDiscount`, ...) são
expressos em **centavos** (`10000` = R$ 100,00).
:::

---

## Validando a assinatura

Quando há uma HMAC secret key configurada no webhook, enviamos o cabeçalho
`x-openpix-signature` com a assinatura do corpo da requisição:

- **Algoritmo:** HMAC-SHA1
- **Chave:** a HMAC secret key cadastrada no seu webhook
- **Mensagem:** o corpo **bruto** (raw body) da requisição, exatamente como recebido
- **Encoding:** Base64

Recalcule a assinatura no seu servidor e compare com o cabeçalho recebido. Veja o
passo a passo completo, com exemplos em várias linguagens, em
**[Validando o HMAC do webhook](/docs/webhook/seguranca/webhook-hmac)**.

:::warning
Use o **corpo bruto** (string exata recebida) no cálculo da assinatura. Se você
serializar o JSON novamente após o parse, a assinatura não vai bater.
:::

---

## Boas práticas

- **Responda rápido com `2xx`.** Processe o webhook de forma assíncrona; em caso
  de falha (timeout ou status diferente de `2xx`), reenviamos a notificação.
- **Seja idempotente.** O mesmo evento pode chegar mais de uma vez. Use
  `charge.correlationID` / `charge.identifier` como chave para não processar duas
  vezes.
- **Não conte como saldo.** Este webhook indica **boleto pago**, não **valor
  liquidado/disponível**. A liquidação ocorre depois (≈ D+3).

---

## Resumo rápido

| Pergunta | Resposta |
| --- | --- |
| Qual webhook recebo no boleto? | `OPENPIX:CHARGE_COMPLETED`, no **pagamento** do boleto. |
| O dinheiro já está disponível? | **Não.** Pagamento ≠ liquidação. A liquidação é posterior (≈ D+3). |
| Como diferencio de Pix? | O payload de boleto traz o objeto `boleto` e não traz `pix`. |
| Como cadastro? | Painel (**API/Plugins → Webhooks**) ou via API `POST /api/v1/webhook`. |
| Como valido a origem? | Cabeçalho `x-openpix-signature` (HMAC-SHA1 + Base64 do raw body). |
