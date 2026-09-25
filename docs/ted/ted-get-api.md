---
id: ted-get-api
title: Como consultar e listar TEDs via API
sidebar_label: Consultar e listar TEDs
sidebar_position: 3
tags:
  - api
  - ted
---

# Como consultar e listar TEDs via API

Os dois endpoints retornam TEDs enviadas e recebidas pela sua empresa, no mesmo
formato do objeto `ted` de [`POST /api/v1/ted`](./ted-send-api.mdx#exemplo-de-resposta).
Só aparecem as TEDs da empresa do AppID.

:::tip Referência completa
Para o schema, parâmetros e exemplos interativos, veja a
[API Reference](/api#tag/ted).
:::

## Consultar uma TED

`GET /api/v1/ted/{correlationID}` retorna uma TED pelo `correlationID`. Requer o
scope **`TED_GET`**.

```sh
curl https://api.woovi.com/api/v1/ted/payout-20260203-1 \
  --header 'Authorization: {APP_ID}'
```

```json
{
  "ted": {
    "correlationID": "payout-20260203-1",
    "nuop": "1234567820260203000001",
    "status": "COMPLETED",
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
    "errorCode": null,
    "reason": null,
    "bcbCode": null,
    "createdAt": "2026-02-03T14:30:00.000Z",
    "updatedAt": "2026-02-03T14:31:02.000Z"
  }
}
```

Quando a TED falha ou é devolvida, `errorCode`, `reason` e `bcbCode` explicam o
motivo; nos outros casos são `null`. Veja
[Por que uma TED falhou](./ted-api-getting-started.md#por-que-uma-ted-falhou).

Consultar a TED é a alternativa ao webhook para saber o resultado. Se for fazer
_polling_, use intervalos de alguns segundos e pare quando o `status` for
`COMPLETED`, `FAILED` ou `REFUNDED`.

| Status | Quando |
| --- | --- |
| `200` | TED encontrada |
| `401` | AppID ausente ou inválido |
| `403` | Empresa sem a funcionalidade `TED` (`TED_FEATURE_REQUIRED`) ou aplicação sem o scope `TED_GET` |
| `404` | Nenhuma TED com esse `correlationID` na sua empresa (`TED_NOT_FOUND`) |

```json
{
  "error": "TED não encontrada",
  "errorCode": "TED_NOT_FOUND"
}
```

## Listar TEDs

`GET /api/v1/ted` lista as TEDs da empresa, das mais recentes para as mais
antigas. Requer o scope **`TED_GET_LIST`**.

TEDs enviadas e recebidas vêm na mesma lista; `direction` diferencia as duas.

### Parâmetros de query

| Parâmetro | Descrição |
| --- | --- |
| `skip` | Registros a pular. Padrão `0` |
| `limit` | Tamanho da página, de 1 a 100. Padrão `100` |
| `status` | `PENDING`, `SCHEDULED`, `PROCESSING`, `COMPLETED`, `FAILED` ou `REFUNDED` |
| `type` | `PAYMENT`, `WITHDRAW`, `REFUND_SENT` ou `REFUND_RECEIVED` |
| `direction` | `OUT` para TEDs enviadas, `IN` para recebidas |
| `correlationID` | Filtra pelo seu identificador |
| `accountId` | Filtra por uma conta da empresa |
| `start` / `end` | Intervalo de `createdAt`, no formato RFC 3339 |

```sh
curl 'https://api.woovi.com/api/v1/ted?direction=OUT&status=COMPLETED&start=2026-02-01T00:00:00Z&end=2026-02-28T23:59:59Z' \
  --header 'Authorization: {APP_ID}'
```

```json
{
  "teds": [
    {
      "correlationID": "payout-20260203-1",
      "nuop": "1234567820260203000001",
      "status": "COMPLETED",
      "type": "PAYMENT",
      "direction": "OUT",
      "value": 150050,
      "moveDate": "2026-02-03",
      "accountId": "6290ccfd42831958a405debc",
      "errorCode": null,
      "reason": null,
      "bcbCode": null,
      "createdAt": "2026-02-03T14:30:00.000Z",
      "updatedAt": "2026-02-03T14:31:02.000Z"
    }
  ],
  "pageInfo": {
    "skip": 0,
    "limit": 100,
    "totalCount": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

Para a próxima página, some `limit` ao `skip` enquanto `pageInfo.hasNextPage`
for `true`. Veja também [Campos comuns da API](../apis/api-common-fields.md).

| Status | Quando |
| --- | --- |
| `200` | Lista retornada, possivelmente vazia |
| `400` | `accountId` inválido (`INVALID_ACCOUNT_ID`) |
| `401` | AppID ausente ou inválido |
| `403` | Empresa sem a funcionalidade `TED` ou aplicação sem o scope `TED_GET_LIST` |
