---
id: stablecoin-webhooks
sidebar_position: 4
title: Webhooks
tags:
  - stablecoin
  - api
---

## Webhooks do Stablecoin

Os webhooks notificam sua aplicação sobre o resultado do depósito de stablecoin. Caso ainda não saiba como cadastrar webhooks na plataforma, veja o nosso [tutorial](../webhook/platform/webhook-platform-api.mdx).

Existem dois eventos:

| Evento | Quando ocorre |
| --- | --- |
| `STABLECOIN_DEPOSIT_COMPLETED` | A stablecoin foi entregue na blockchain |
| `STABLECOIN_DEPOSIT_FAILED` | O depósito falhou em alguma etapa |

O objeto enviado contém `stableDeposit` (os dados do depósito) e `company` (sua empresa). O campo `correlationID` corresponde ao identificador único que você enviou ao criar o depósito.

### STABLECOIN_DEPOSIT_COMPLETED

Disparado quando a stablecoin é entregue com sucesso na carteira de destino. O campo `txHash` traz o hash da transação on-chain.

```json
{
  "event": "STABLECOIN_DEPOSIT_COMPLETED",
  "stableDeposit": {
    "id": "6650abc1234def567890aaaa",
    "status": "COMPLETED",
    "inputAmount": 10000,
    "inputCurrency": "BRL",
    "outputAmount": 18.45,
    "outputCurrency": "USDT",
    "txHash": "0x587a660fe5349113801ec77fa6f79ae096e53a67bfa7f9098f096d1b9575fa53",
    "correlationID": "my-unique-id",
    "completedAt": "2026-06-05T12:00:00.000Z"
  },
  "company": {
    "name": "Acme Corp"
  }
}
```

### STABLECOIN_DEPOSIT_FAILED

Disparado quando o depósito falha. Os campos `reason` e `errorCode` indicam o motivo.

```json
{
  "event": "STABLECOIN_DEPOSIT_FAILED",
  "stableDeposit": {
    "id": "6650abc1234def567890aaaa",
    "status": "FAILED",
    "inputAmount": 10000,
    "inputCurrency": "BRL",
    "outputCurrency": "USDT",
    "correlationID": "my-unique-id",
    "failedAt": "2026-06-05T12:00:00.000Z"
  },
  "company": {
    "name": "Acme Corp"
  },
  "reason": "Deposit failed",
  "errorCode": "DEPOSIT-FAILED"
}
```

## Webhooks da Subconta (KYB)

Quando você solicita uma subconta de stablecoin (KYB) via `POST /api/v1/stablecoin/subaccount`, ela é criada com status `IN_REVIEW` enquanto a análise é processada. O resultado **não é síncrono**: assim que o KYB é resolvido pelo provedor, sua aplicação recebe um destes eventos.

| Evento | Quando ocorre |
| --- | --- |
| `STABLECOIN_SUBACCOUNT_CONFIRMED` | O KYB foi aprovado e a subconta está apta a receber depósitos |
| `STABLECOIN_SUBACCOUNT_REJECTED` | O KYB foi recusado; a subconta não pode operar |

O objeto enviado contém `stableSubAccount` (os dados da subconta) e `company` (sua empresa). Use o campo `stableSubAccount.id` para conciliar com o `subAccountId` retornado na criação.

### STABLECOIN_SUBACCOUNT_CONFIRMED

Disparado quando o KYB é aprovado. A partir deste momento a subconta tem `status: "CONFIRMED"` e pode ser usada em `POST /api/v1/stablecoin/deposit`. O campo `confirmedAt` traz o instante da confirmação.

```json
{
  "event": "STABLECOIN_SUBACCOUNT_CONFIRMED",
  "stableSubAccount": {
    "id": "6650abc1234def567890aaaa",
    "status": "CONFIRMED",
    "subAccountId": "sub_01HZ...",
    "accountRegisterId": "6650def1234abc567890bbbb",
    "confirmedAt": "2026-06-05T12:00:00.000Z"
  },
  "company": {
    "id": "6650aaa1234bbb567890cccc",
    "name": "Acme Corp",
    "taxID": "12345678000199"
  }
}
```

### STABLECOIN_SUBACCOUNT_REJECTED

Disparado quando o KYB é recusado. Os campos opcionais `reason` e `rejectionLabels` indicam o motivo da recusa, quando disponíveis.

```json
{
  "event": "STABLECOIN_SUBACCOUNT_REJECTED",
  "stableSubAccount": {
    "id": "6650abc1234def567890aaaa",
    "status": "REJECTED",
    "subAccountId": "sub_01HZ...",
    "accountRegisterId": "6650def1234abc567890bbbb",
    "rejectedAt": "2026-06-05T12:00:00.000Z"
  },
  "company": {
    "id": "6650aaa1234bbb567890cccc",
    "name": "Acme Corp",
    "taxID": "12345678000199"
  },
  "reason": "Document verification failed",
  "rejectionLabels": ["INVALID_DOCUMENT"]
}
```
