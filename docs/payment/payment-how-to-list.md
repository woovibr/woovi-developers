---
id: payment-how-to-list
sidebar_position: 6
title: Como consultar e listar Pagamentos?
tags:
  - payment
  - api
---

## Listando Pagamentos com a API

Nós disponibilizamos o _endpoint_ `GET /api/v1/payment` para que você possa
listar os pagamentos (Pix Out) da empresa, filtrando por período e paginando os
resultados. É o endpoint indicado para reconciliação: a partir dele você
recupera o `status` e o `correlationID` de cada pagamento.

Você pode acessar [aqui](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment/get>)
a documentação de referência desse _endpoint_.

Para usar esse endpoint, o seu AppID precisa ter o escopo `PAYMENT_GET_LIST`
habilitado.

### Parâmetros de consulta

- **`start`**: data inicial do filtro (sobre o `createdAt` do pagamento), no formato ISO 8601, ex.: `2026-06-01T00:00:00Z`.
- **`end`**: data final do filtro (sobre o `createdAt` do pagamento), no formato ISO 8601, ex.: `2026-06-30T23:59:59Z`.
- **`skip`**: quantos registros pular (paginação). Padrão `0`.
- **`limit`**: quantos registros retornar por página. Padrão `100`.

Se nenhum `start`/`end` for informado, a listagem não aplica o filtro de data.

Num exemplo prático, a requisição seguiria semelhante a este exemplo:

```bash
curl --location 'https://api.woovi.com/api/v1/payment?start=2026-06-01T00:00:00Z&end=2026-06-30T23:59:59Z&limit=100' \
  --header 'Authorization: SEU_APP_ID'
```

A resposta traz, para cada pagamento, o objeto `payment` (com `status`,
`correlationID`, `value`, `comment`, `destinationAlias` e `sourceAccountId`), o
objeto `transaction` (com `endToEndId` e horário) e o objeto `destination` (dados
do destinatário), além do `pageInfo` da paginação:

```json
{
  "pageInfo": {
    "skip": 0,
    "limit": 100,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "status": "OK",
  "payments": [
    {
      "payment": {
        "status": "CONFIRMED",
        "value": 100,
        "destinationAlias": "c4249323-b4ca-43f2-8139-8232aab09b93",
        "comment": "payment comment",
        "correlationID": "payment1",
        "sourceAccountId": "my-source-account-id"
      },
      "transaction": {
        "value": 100,
        "endToEndId": "transaction-end-to-end-id",
        "time": "2023-03-20T13:14:17.000Z"
      }
    }
  ]
}
```

### Paginação

Para percorrer todas as páginas, use `pageInfo.hasNextPage` para saber se há
mais resultados e avance com `skip`. Para volumes grandes ou períodos longos,
**prefira estreitar o intervalo `start`/`end`** em vez de aumentar muito o
`skip` — há um limite máximo de `skip`, e o filtro por data é a forma indicada
para paginações mais profundas.

## Consultando um pagamento específico

Para consultar um único pagamento pelo seu `correlationID`, use o _endpoint_
`GET /api/v1/payment/{id}`, onde `{id}` é o `correlationID` informado na criação:

```bash
curl --location 'https://api.woovi.com/api/v1/payment/payment1' \
  --header 'Authorization: SEU_APP_ID'
```

:::tip
O `correlationID` é a chave de idempotência do pagamento. Ao reprocessar um
pagamento, reuse o mesmo `correlationID` até ele chegar a um estado terminal
(`CONFIRMED` ou `REJECTED`) — gerar um `correlationID` novo para o mesmo
pagamento cria uma duplicata. Veja [Idempotência](../concepts/idempotence.md).
:::
