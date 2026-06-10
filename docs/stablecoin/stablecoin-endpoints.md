---
id: stablecoin-endpoints
sidebar_position: 2
title: Endpoints
tags:
  - stablecoin
  - api
---

## Rotas da API de Stablecoin

Você pode ver os detalhes completos na [referência da API](https://developers.woovi.com/api#tag/stablecoin).

Todas as rotas ficam sob `/api/v1/stablecoin/` e exigem autenticação com o seu App (header `Authorization`). Cada rota exige um escopo (`scope`) específico no seu App:

| Escopo | Rotas |
| --- | --- |
| `STABLECOIN_DEPOSIT_CREATE` | `quote`, `deposit`, `deposit/approve` |
| `STABLECOIN_DEPOSIT_LIST` | `deposit/find`, `deposit` (listar) |
| `STABLECOIN_SUBACCOUNT_LIST` | `subaccount`, `subaccount/{subAccountId}` |

> A URL base de produção é `https://api.woovi.com`. Caso o App não tenha o escopo necessário, a resposta é `401` com `Application is missing required scope: ...`.

### Cotação (Quote)

GET `/api/v1/stablecoin/quote`

Retorna uma cotação BRL → stablecoin **sem criar um depósito**. Use para exibir ao cliente exatamente quanto de stablecoin ele receberia antes de confirmar. A cotação é armazenada em cache por 60 segundos.

Query params:

- `value` (obrigatório) — valor a cotar, **em centavos** de BRL (ex.: `10000` = R$ 100,00)
- `currency` (opcional) — `USDT` | `USDC` (padrão: `USDT`)

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/stablecoin/quote?value=10000&currency=USDT' \
  --header 'Authorization: <SEU_APP_ID>'
```

Resposta:

```json
{
  "status": "ok",
  "quote": {
    "basePrice": 5.25,
    "inputAmount": 100,
    "inputCurrency": "BRL",
    "outputAmount": 19.04,
    "outputCurrency": "USDT",
    "appliedFees": [
      { "type": "In Fee", "amount": 1.5, "currency": "BRL" }
    ],
    "pairName": "BRL/USDT"
  }
}
```

> `inputAmount` e `outputAmount` no retorno da cotação são em unidade de moeda (não em centavos). Caso o provedor não consiga cotar, a resposta é `502` com `{ "status": "error", "error": "Unable to fetch quote" }`.

### Criar um depósito

POST `/api/v1/stablecoin/deposit`

Cria um depósito de stablecoin a partir do saldo em BRL da conta. Retorna `depositId`, `correlationId` e uma cotação com as taxas aplicadas. A aprovação (`/deposit/approve`) é que debita o saldo da conta.

Body:

| campo | tipo | obrigatório | descrição |
| --- | --- | --- | --- |
| `value` | number | sim | valor em **centavos** de BRL (ex.: `10000` = R$ 100,00) |
| `currency` | string | sim | `USDT` \| `USDC` |
| `network` | string | não | `POLYGON` (padrão) \| `ETHEREUM` \| `BASE` \| `CELO` \| `TRON` |
| `subAccountId` | string | não | subconta a usar; resolvida pela empresa quando omitida |
| `correlationId` | string | não | identificador único para idempotência |
| `destinationWalletAddress` | string | não | carteira de destino explícita para a stablecoin |

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/stablecoin/deposit \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'content-type: application/json' \
  --data '{
    "value": 10000,
    "currency": "USDT",
    "network": "POLYGON",
    "correlationId": "my-unique-id"
  }'
```

Resposta:

```json
{
  "status": "PENDING",
  "depositId": "6650abc1234def567890aaaa",
  "correlationId": "my-unique-id",
  "expiration": "2026-06-05T12:00:00.000Z",
  "quote": {
    "inputAmount": 10000,
    "inputCurrency": "BRL",
    "outputAmount": 18.45,
    "outputCurrency": "USDT",
    "rate": 5.42,
    "fee": 50
  }
}
```

Erros comuns (`400`):

```json
{ "error": "value must be a positive number (in cents)" }
{ "error": "currency must be one of: USDT, USDC" }
{ "error": "USDT is not available on BASE. Supported networks: POLYGON, ETHEREUM, CELO, TRON" }
{ "error": "Nenhuma subconta de stablecoin ativa. É necessário um KYB, entre em contato com o suporte." }
```

### Aprovar (liquidar) um depósito

POST `/api/v1/stablecoin/deposit/approve`

Aprova um depósito já criado, identificado pelo `correlationId`, disparando a liquidação on-chain (pagamento do QR Code stablecoin). O depósito passa para `PROCESSING` enquanto a liquidação está em andamento.

Body:

- `correlationId` (obrigatório) — o `correlationId` informado na criação do depósito

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/stablecoin/deposit/approve \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'content-type: application/json' \
  --data '{ "correlationId": "my-unique-id" }'
```

Resposta:

```json
{
  "status": "PROCESSING",
  "correlationId": "my-unique-id",
  "depositId": "6650abc1234def567890aaaa"
}
```

A aprovação é rejeitada com `400` quando o depósito não pode ser aprovado, por exemplo: já está `COMPLETED`, já está `PROCESSING`, não há conta de origem para pagar, ou a cotação/pagamento do provedor falhou.

```json
{ "error": "Stablecoin deposit already completed", "correlationId": "my-unique-id", "depositId": "6650abc1234def567890aaaa" }
```

### Buscar um depósito

GET `/api/v1/stablecoin/deposit/find?correlationId={correlationId}`

Busca um único depósito pelo `correlationId`.

```json
{
  "status": "ok",
  "deposit": {
    "id": "6650abc1234def567890aaaa",
    "correlationId": "my-unique-id",
    "status": "COMPLETED",
    "inputAmount": 10000,
    "inputCurrency": "BRL",
    "outputAmount": 18.45,
    "outputCurrency": "USDT",
    "fee": 50,
    "createdAt": "2026-06-05T12:00:00.000Z"
  }
}
```

### Listar depósitos

GET `/api/v1/stablecoin/deposit?limit={limit}&skip={skip}`

Lista os depósitos da empresa autenticada (paginado).

```json
{
  "status": "ok",
  "deposits": [ { "id": "6650abc1234def567890aaaa", "status": "COMPLETED", "inputAmount": 10000, "inputCurrency": "BRL", "outputAmount": 18.45, "outputCurrency": "USDT", "fee": 50, "createdAt": "2026-06-05T12:00:00.000Z" } ],
  "count": 42,
  "limit": 20,
  "skip": 0
}
```

### Listar subcontas

GET `/api/v1/stablecoin/subaccount`

Lista as subcontas de stablecoin (registros de KYB) da empresa autenticada.

```json
{
  "status": "ok",
  "subAccounts": [
    {
      "id": "6650abc1234def567890aaaa",
      "subAccountId": "sub_01HZ...",
      "account": "6650def1234abc567890bbbb",
      "createdAt": "2026-06-05T12:00:00.000Z"
    }
  ]
}
```

### Buscar uma subconta

GET `/api/v1/stablecoin/subaccount/{subAccountId}`

```json
{
  "status": "ok",
  "subAccount": {
    "id": "6650abc1234def567890aaaa",
    "subAccountId": "sub_01HZ...",
    "account": "6650def1234abc567890bbbb",
    "createdAt": "2026-06-05T12:00:00.000Z"
  }
}
```
