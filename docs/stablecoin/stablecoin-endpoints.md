---
id: stablecoin-endpoints
sidebar_position: 2
title: Endpoints
tags:
  - stablecoin
  - api
---

## Rotas da API de Stablecoin

Você pode ver os detalhes completos na [referência da API Stablecoin](/stable).

Todas as rotas ficam sob `/api/v1/stablecoin/` e exigem autenticação com o seu App (header `Authorization`). Cada rota exige um escopo (`scope`) específico no seu App:

| Escopo | Rotas |
| --- | --- |
| `STABLECOIN_DEPOSIT_CREATE` | `quote`, `deposit`, `deposit/approve` |
| `STABLECOIN_DEPOSIT_LIST` | `deposit/find`, `deposit` (listar) |
| `STABLECOIN_SUBACCOUNT_CREATE` | `subaccount` (POST — solicitar KYB) |
| `STABLECOIN_SUBACCOUNT_LIST` | `subaccount` (listar/detalhe), `wallets`, `subaccount/{id}/wallets`, `subaccount/{id}/balances` |
| `STABLECOIN_PAYOUT_CREATE` | `payout/quote`, `payout` (criar/aprovar/consultar) |

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

### Carteiras de depósito (INTERNAL float)

GET `/api/v1/stablecoin/wallets`

Retorna os endereços custodiados da subconta ligada ao `companyBankAccount` do AppID. Enviar USDT/USDC/BRLA on-chain para um desses endereços credita o float INTERNAL usado pelo payout.

Exige o escopo `STABLECOIN_SUBACCOUNT_LIST`.

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/stablecoin/wallets \
  --header 'Authorization: <SEU_APP_ID>'
```

```json
{
  "status": "ok",
  "companyBankAccountId": "682b62fe5afc2e15760223c5",
  "subAccountId": "b3e144dd-7d10-457c-9b85-033085722ed1",
  "wallets": [
    { "address": "0xa5A558fedfCeFa9ac2751649Fa21CA0279F216Ce", "currency": "USDT", "network": "POLYGON" },
    { "address": "TR54aGQPQghGDmHVuTQfSShP3ce8a6pCiT", "currency": "USDT", "network": "TRON" }
  ]
}
```

Para um `subAccountId` explícito: `GET /api/v1/stablecoin/subaccount/{subAccountId}/wallets`.

### Saldos do float INTERNAL

GET `/api/v1/stablecoin/subaccount/{subAccountId}/balances`

Retorna o saldo INTERNAL por ativo (unidade da moeda, não centavos). Faça poll após enviar on-chain para as wallets e só então chame o payout.

Exige o escopo `STABLECOIN_SUBACCOUNT_LIST`.

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/stablecoin/subaccount/b3e144dd-7d10-457c-9b85-033085722ed1/balances \
  --header 'Authorization: <SEU_APP_ID>'
```

```json
{
  "status": "ok",
  "subAccountId": "b3e144dd-7d10-457c-9b85-033085722ed1",
  "balances": { "USDT": 0.425458, "USDC": 0, "BRLA": 0 }
}
```

### Cotação de payout (USDT/USDC/BRLA → Pix)

GET `/api/v1/stablecoin/payout/quote`

Cota um **Pix alvo em BRL**, debitando float INTERNAL. `value` é em **centavos de BRL** (ex.: `10000` = R$ 100,00). A resposta traz quanto de `currency` será debitado (`inputAmount`).

Exige o escopo `STABLECOIN_PAYOUT_CREATE`.

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/stablecoin/payout/quote?value=10000&currency=USDT' \
  --header 'Authorization: <SEU_APP_ID>'
```

```json
{
  "status": "ok",
  "quote": {
    "basePrice": 5.12,
    "inputAmount": 19.68,
    "inputCurrency": "USDT",
    "outputAmount": 100,
    "outputCurrency": "BRL",
    "pairName": "USDTBRL"
  }
}
```

### Criar um payout (off-ramp para Pix)

POST `/api/v1/stablecoin/payout`

Cria o payout em `PENDING` (mesmo padrão do depósito): cota o **Pix alvo em BRL**, valida saldo INTERNAL, consome o limite **OUT** e resolve o beneficiário. O ticket do provedor **só é aberto no approve**.

Exige o escopo `STABLECOIN_PAYOUT_CREATE`.

| campo | tipo | obrigatório | descrição |
| --- | --- | --- | --- |
| `value` | number | sim | valor Pix alvo em **centavos de BRL** (ex.: `10000` = R$ 100,00) |
| `currency` | string | sim | `USDT` \| `USDC` \| `BRLA` — ativo INTERNAL a debitar |
| `pixKey` | string | sim | chave Pix de destino |
| `correlationId` | string | não | idempotência |
| `pixMessage` | string | não | mensagem Pix |

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/stablecoin/payout \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'content-type: application/json' \
  --data '{
    "value": 10000,
    "currency": "USDT",
    "pixKey": "thiago@entria.com.br",
    "correlationId": "payout-001"
  }'
```

```json
{
  "status": "PENDING",
  "payoutId": "6a721b1e3c785acfaebfa01c",
  "correlationId": "payout-001",
  "pixKey": "thiago@entria.com.br",
  "pixKeyOwner": {
    "name": "Marshall Bilderback",
    "taxId": "***.751.185-**",
    "bankName": "SICOOB"
  },
  "quote": {
    "inputAmount": 19.68,
    "inputCurrency": "USDT",
    "outputAmount": 100,
    "outputCurrency": "BRL",
    "rate": 5.12,
    "fee": 0.04
  }
}
```

### Aprovar um payout

POST `/api/v1/stablecoin/payout/approve`

Aprova um payout `PENDING` pelo `correlationId`, abre o ticket no provedor (debita INTERNAL e envia o Pix) e passa para `PROCESSING`.

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/stablecoin/payout/approve \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'content-type: application/json' \
  --data '{ "correlationId": "payout-001" }'
```

```json
{
  "status": "PROCESSING",
  "correlationId": "payout-001",
  "payoutId": "6a721b1e3c785acfaebfa01c"
}
```

### Consultar um payout

- `GET /api/v1/stablecoin/payout/{payoutId}`
- `GET /api/v1/stablecoin/payout?correlationId={correlationId}`

Enquanto não estiver terminal e já existir ticket, o status no provedor é relido (incluindo `PAID` → `COMPLETED`).

### Solicitar uma subconta (KYB)

POST `/api/v1/stablecoin/subaccount`

Solicita a criação de uma subconta de stablecoin para a empresa autenticada, reaproveitando os dados de KYC já presentes no `accountRegister` informado. A subconta no provedor é criada imediatamente e um registro `StableSubAccount` é persistido com status `IN_REVIEW` enquanto o KYB é processado.

O processamento do KYB é **assíncrono**: quando ele é resolvido, a empresa recebe um webhook `STABLECOIN_SUBACCOUNT_CONFIRMED` ou `STABLECOIN_SUBACCOUNT_REJECTED` (veja [Webhooks](./stablecoin-webhooks.md)). Somente após o `STABLECOIN_SUBACCOUNT_CONFIRMED` a subconta pode ser usada em `POST /api/v1/stablecoin/deposit`.

A rota é **idempotente** por `accountRegisterId`: uma chamada repetida retorna a subconta já existente (HTTP `200`), enquanto a primeira chamada (que cria) retorna HTTP `201`. Exige o escopo `STABLECOIN_SUBACCOUNT_CREATE`.

Body:

| campo | tipo | obrigatório | descrição |
| --- | --- | --- | --- |
| `accountRegisterId` | string | sim | id do `accountRegister` cujos dados de KYC serão usados no KYB |
| `companyBankAccountId` | string | não | conta bancária da empresa a vincular; usa a conta padrão da empresa quando omitida |

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/stablecoin/subaccount \
  --header 'Authorization: <SEU_APP_ID>' \
  --header 'content-type: application/json' \
  --data '{
    "accountRegisterId": "6650abc1234def567890aaaa"
  }'
```

Resposta (`201` na criação, `200` quando a subconta já existia):

```json
{
  "subAccountId": "sub_01HZ...",
  "status": "IN_REVIEW",
  "correlationId": "0f2c8d6a-1b3e-4f5a-9c7d-8e2a1b4c6d8f"
}
```

Erros comuns:

```json
{ "error": "accountRegisterId is required" }
{ "error": "INVALID_ACCOUNT_REGISTER_ID", "correlationId": "..." }
{ "error": "ACCOUNT_REGISTER_NOT_FOUND", "correlationId": "..." }
{ "error": "ACCOUNT_REGISTER_MISSING_OFFICIAL_NAME", "correlationId": "..." }
```

> Erros que o chamador pode corrigir (id inválido, `accountRegister` inexistente ou sem dados obrigatórios) retornam `400`. Falhas no provedor ou na persistência retornam `502` (ex.: `AVENIA_SUBACCOUNT_CREATE_FAILED`), indicando que a chamada pode ser repetida.

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
