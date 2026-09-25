---
id: ted-webhooks
title: Webhooks de TED
sidebar_label: Webhooks de TED
sidebar_position: 5
tags:
  - ted
  - webhook
---

# Webhooks de TED

A TED é liquidada pelo BACEN de forma assíncrona. Os webhooks de TED avisam
quando uma TED enviada foi liquidada ou falhou, quando uma TED chegou na sua
conta, e quando uma devolução foi confirmada.

## Eventos

| Evento | Quando dispara | `ted.status` |
| --- | --- | --- |
| `TED_OUT_CONFIRMED` | Uma TED que você enviou foi liquidada no BACEN | `COMPLETED` |
| `TED_OUT_REJECTED` | Uma TED que você enviou não foi liquidada. O débito foi estornado e o saldo voltou; `errorCode` e `reason` trazem o motivo | `FAILED` |
| `TED_IN_CONFIRMED` | Uma TED chegou e foi creditada na sua conta | `COMPLETED` |
| `TED_IN_REJECTED` | Uma TED para você foi recusada na chegada e devolvida ao remetente; `errorCode` e `reason` trazem o motivo | `REFUNDED` |
| `TED_REFUND_SENT_CONFIRMED` | Uma TED que você recebeu foi devolvida ao remetente, e o BACEN confirmou a devolução. É a resposta a [`POST /api/v1/ted/{correlationID}/refund`](./ted-refund-api.mdx) | `COMPLETED` |
| `TED_REFUND_RECEIVED_CONFIRMED` | Uma TED que você enviou foi devolvida pela instituição de destino, e o valor voltou para a sua conta | `COMPLETED` |

Não existe webhook para `PROCESSING` ou `SCHEDULED`: a resposta de
[`POST /api/v1/ted`](./ted-send-api.mdx) já traz esse estado.

## Como cadastrar o webhook

Cada webhook se inscreve em **um** evento. Para acompanhar uma TED enviada,
cadastre um webhook para `TED_OUT_CONFIRMED` e outro para `TED_OUT_REJECTED`.

### Pelo aplicativo

1. Acesse a lista de **[API/Plugins → Webhooks](https://app.woovi.com/home/api/list)**.
2. Clique em **[Adicionar webhook](https://app.woovi.com/home/openpix/webhook-create)**.
3. Informe a **URL** do seu endpoint.
4. Selecione o evento de TED.
5. Salve e mantenha o webhook **ativo**.

### Pela API

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/webhook \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "webhook": {
      "name": "TED liquidada",
      "event": "TED_OUT_CONFIRMED",
      "url": "https://seu-dominio.com/webhooks/woovi",
      "authorization": "opcional-token-que-voce-recebe-de-volta",
      "isActive": true
    }
  }'
```

Veja [Webhook API](../webhook/webhook-api.mdx) para o restante da API de
webhooks. A lista de eventos disponíveis também sai em
[`GET /api/v1/webhook/events`](/api#tag/webhook/GET/api/v1/webhook/events).

## Payload

O corpo tem o nome do evento e o objeto `ted`, no mesmo formato de
[`GET /api/v1/ted/{correlationID}`](./ted-get-api.md#consultar-uma-ted):

```json
{
  "event": "TED_OUT_REJECTED",
  "ted": {
    "correlationID": "payout-20260203-1",
    "nuop": "1234567820260203000001",
    "status": "FAILED",
    "type": "PAYMENT",
    "direction": "OUT",
    "value": 150050,
    "moveDate": "2026-02-03",
    "accountId": "6290ccfd42831958a405debc",
    "sender": {
      "name": "Empresa LTDA",
      "document": "12345678000199",
      "ispb": "12345678",
      "agency": 1234,
      "account": 567890,
      "accountType": "CACC"
    },
    "receiver": {
      "name": "Joao da Silva",
      "document": "12345678901",
      "ispb": "87654321",
      "agency": 4321,
      "account": 98765,
      "accountType": "CACC"
    },
    "errorCode": "INSUFFICIENT_BALANCE",
    "reason": "Saldo insuficiente",
    "bcbCode": null,
    "createdAt": "2026-02-03T14:30:00.000Z",
    "updatedAt": "2026-02-03T14:31:02.000Z"
  }
}
```

Use o `correlationID` para achar a TED no seu sistema. O payload de cada evento
está na [API Reference](/api#tag/webhook).

:::note Motivo da falha
Decida pelo `event` e pelo `errorCode`. O `reason` é o `errorCode` explicado
para mostrar ao usuário, e nos webhooks vem sempre em português. O `bcbCode` é o
código do BACEN, para o suporte. Veja
[Por que uma TED falhou](./ted-api-getting-started.md#por-que-uma-ted-falhou).
:::

## Validando e respondendo

- **Assinatura**: valide o header `x-webhook-signature` (RSA-SHA256) com a chave
  pública da Woovi. Veja [Validação de assinatura](../webhook/seguranca/webhook-signature-validation.mdx).
  Se o webhook tiver uma HMAC secret key, o header `x-openpix-signature` também
  é enviado, por compatibilidade ([HMAC](../webhook/seguranca/webhook-hmac.mdx)).
- **Resposta**: qualquer `2xx` confirma o recebimento. Qualquer outra resposta,
  ou um _timeout_, gera nova tentativa. Veja
  [Retentativas](../webhook/webhook-retry.md) e [Timeout](../webhook/webhook-timeout.md).
- **Duplicidade**: a entrega é _at least once_, então o mesmo evento pode chegar
  mais de uma vez. Deduplique pelo par `event` + `ted.correlationID`.

:::tip Não perdeu nada?
Se o seu endpoint ficou fora do ar, consulte a TED com
[`GET /api/v1/ted/{correlationID}`](./ted-get-api.md#consultar-uma-ted): o
`status` dela é sempre o estado atual.
:::
