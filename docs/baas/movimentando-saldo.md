---
id: movimentando-saldo
title: Saque, transferência e extrato
tags:
  - baas
  - api
  - transfer
sidebar_position: 9
---

Este documento mostra como movimentar o saldo das contas do modo BaaS: saque, transferência entre contas e extrato.

## Saque de uma conta (API Master)

Envia o saldo da conta para a conta bancária de destino configurada para ela. O `value` é em **centavos**:

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/account/6290ccfd42831958a405debc/withdraw \
  --header 'Authorization: <MASTER_APP_ID>' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "value": 7000 }'
```

Resposta `200`:

```json
{
  "withdraw": {
    "account": {
      "accountId": "6290ccfd42831958a405debc",
      "isDefault": false,
      "balance": {
        "total": 122430,
        "available": 122430,
        "blocked": 0
      }
    },
    "transaction": {
      "endToEndId": "E23114447202205191817cx6VMrbwtw6",
      "value": 7000
    }
  }
}
```

O `accountId` é o mesmo retornado por `GET /api/v1/account` — veja [Controlando as contas no modo BAAS](./baas-api-master.md).

## Transferência entre contas

Transferência interna e instantânea entre contas da sua estrutura, identificadas **pelas chaves Pix** de origem e destino:

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/transfer \
  --header 'Authorization: <APP_ID>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "value": 5000,
    "fromPixKey": "<CHAVE_PIX_DA_CONTA_ORIGEM>",
    "toPixKey": "<CHAVE_PIX_DA_CONTA_DESTINO>",
    "correlationID": "repasse-2026-08-001"
  }'
```

Resposta `200`:

```json
{
  "transaction": {
    "value": 5000,
    "time": "2026-08-24T15:33:27.165Z",
    "correlationID": "repasse-2026-08-001"
  }
}
```

:::info Habilitação
A transferência entre contas depende de habilitação na sua empresa — e o sentido conta principal → conta de cliente depende de uma habilitação adicional. Solicite ao suporte. Origem e destino precisam ser contas Woovi.
:::

O `correlationID` é opcional, mas recomendado: a API rejeita duplicatas, garantindo idempotência. Mais detalhes em [Como transferir valores entre contas](../transfer/how-to-transfer-values-between-accounts.mdx).

## Extrato

Com o AppID da própria conta:

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/statement?start=2026-08-01T00:00:00Z&end=2026-08-24T23:59:59Z&skip=0&limit=100' \
  --header 'Authorization: <APP_ID_DA_CONTA>'
```

Resposta `200`:

```json
[
  {
    "id": "64f1c9e8a1b2c3d4e5f60718",
    "time": "2026-08-20T14:03:11.000Z",
    "description": "Pix recebido",
    "balance": 129430,
    "value": 1500,
    "type": "CREDIT"
  }
]
```

- `limit` máximo de 100 por página; use `start`/`end` (ISO 8601) para janelas de tempo
- A API Master também pode ler o extrato de qualquer conta da empresa com `?companyBankAccount=<accountId>` — veja [Lendo outra conta com o AppId MASTER](./baas-api-master.md#lendo-outra-conta-com-o-appid-master)
