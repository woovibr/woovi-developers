---
id: baas-api-master
title: Controlando as contas no modo BAAS
tags:
  - api
  - baas
  - api master
sidebar_position: 6
---

Este documento irá ajudá-lo a entender como criar APIs para as contas abertas no modo BaaS e como um AppId **MASTER** lê o extrato e as transações de outra conta da mesma empresa.

### API mestre

A API mestre é um conceito que permite você criar APIs das várias contas do modo BaaS.

![api-mestre](__assets__/api-mestre.png)

Visualização das várias contas:

![api-mestre](__assets__/accounts.png)

Uma aplicação `MASTER` fica ligada a **uma** conta bancária, como qualquer AppId `API`. Sem a feature descrita abaixo, para ler dados de outra conta você precisa criar um AppId para aquela conta.

### Como criar um AppId por conta

Primeiro vá na plataforma em API/PLUGINS e crie uma API **MASTER**.

Em seguida, use o AppId da API mestre para criar o AppId da conta que você selecionou no endpoint [`POST /api/v1/application`](/api#tag/application).

É necessário ter o `accountId` da conta para a qual você quer criar a API. Liste as contas com [`GET /api/v1/account`](/api#tag/account):

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/account \
  --header 'Authorization: <MASTER_APP_ID>'
```

Resposta:

```json
{
  "pageInfo": {
    "skip": 0,
    "limit": 10,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "accounts": [
    {
      "accountId": "6290ccfd42831958a405debc",
      "isDefault": true,
      "balance": {
        "total": 129430,
        "blocked": 0,
        "available": 129430
      }
    },
    {
      "accountId": "6286b467a7910113577e00ce",
      "isDefault": false,
      "balance": {
        "total": 130,
        "blocked": 100,
        "available": 30
      }
    }
  ]
}
```

Crie a aplicação da conta com `POST /api/v1/application`:

```json
{
  "accountId": "6286b467a7910113577e00ce",
  "application": {
    "name": "application",
    "type": "API"
  }
}
```

O retorno será:

```json
{
  "application": {
    "name": "application",
    "isActive": true,
    "type": "API",
    "clientId": "Client_Id",
    "clientSecret": "Client_Secret6uWhGA=",
    "appID": "appId"
  }
}
```

Com o `appID` em mãos, você consegue acessar qualquer endpoint daquela conta.

## Lendo outra conta com o AppId MASTER

Se a sua empresa tem a feature **`MASTER_APP_READ_ANY_ACCOUNT`**, o mesmo AppId MASTER lê o **statement** e a **transaction** de qualquer conta da **própria empresa**, sem criar um AppId por conta.

Passe o `accountId` (o mesmo retornado por `GET /api/v1/account`) na query string `companyBankAccount`.

:::info Pré-requisitos

- a aplicação autenticada precisa ser do tipo **MASTER**
- a empresa precisa ter a feature **`MASTER_APP_READ_ANY_ACCOUNT`** (solicite ao suporte)
- o `companyBankAccount` precisa ser uma conta **ativa** da mesma empresa
- somente leitura: nenhum endpoint de escrita usa essa query string

:::

Endpoints que aceitam `companyBankAccount` hoje:

| Método | Endpoint | Escopo |
| --- | --- | --- |
| `GET` | [`/api/v1/statement`](/api#tag/statement) | `STATEMENT_GET` |
| `GET` | [`/api/v1/transaction/{id}`](/api#tag/transactions | `TRANSACTION_GET` |

Sem a query string, o comportamento não muda: o statement continua da conta ligada ao AppId, e a transaction continua no escopo da empresa.

### 1. Obtenha o `accountId` da conta de destino

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/account \
  --header 'Authorization: <MASTER_APP_ID>'
```

Use o campo `accountId` da conta que você quer ler — por exemplo `6286b467a7910113577e00ce`.

### 2. Ler o statement de outra conta

`GET /api/v1/statement` filtra pelo ledger da conta pedida. Com `companyBankAccount`, o extrato é o daquela conta, não o da conta ligada ao AppId MASTER.

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/statement?companyBankAccount=6286b467a7910113577e00ce&start=2026-01-01T00:00:00Z&end=2026-01-31T23:59:59Z' \
  --header 'Authorization: <MASTER_APP_ID>'
```

Resposta `200`:

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "time": "2026-01-15T10:30:00.000Z",
    "description": "Payment received from customer",
    "balance": 1500,
    "value": 100,
    "type": "CREDIT"
  }
]
```

Os mesmos filtros de período e paginação (`start`, `end`, `skip`, `limit`) continuam válidos.

### 3. Ler uma transaction de outra conta

`GET /api/v1/transaction/{id}` aceita o `id` da transação Woovi ou o `endToEndId` do banco. Com `companyBankAccount`, a busca **restringe** a transação àquela conta. Se a transação existir na empresa, mas em outra conta, a API responde `400` com `Transaction not found`.

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/transaction/E18236120202012032010s0133872GZA?companyBankAccount=6286b467a7910113577e00ce' \
  --header 'Authorization: <MASTER_APP_ID>'
```

Resposta `200`:

```json
{
  "transaction": {
    "customer": {
      "name": "Dan",
      "email": "email0@example.com",
      "phone": "5511999999999",
      "taxID": {
        "taxID": "31324227036",
        "type": "BR:CPF"
      },
      "correlationID": "9134e286-6f71-427a-bf00-241681624586"
    },
    "payer": {
      "name": "Dan",
      "email": "email0@example.com",
      "phone": "5511999999999",
      "taxID": {
        "taxID": "31324227036",
        "type": "BR:CPF"
      },
      "correlationID": "9134e286-6f71-427a-bf00-241681624586"
    },
    "value": 100,
    "time": "2026-01-15T10:30:00.536Z",
    "transactionID": "transactionID",
    "type": "PAYMENT",
    "endToEndId": "E18236120202012032010s0133872GZA",
    "globalID": "UGl4VHJhbnNhY3Rpb246NzE5MWYxYjAyMDQ2YmY1ZjUzZGNmYTBi"
  }
}
```

O `id` no path também pode ser o `_id` da transação:

```bash
curl --request GET \
  --url 'https://api.woovi.com/api/v1/transaction/7191f1b02046bf5f53dcfa0b?companyBankAccount=6286b467a7910113577e00ce' \
  --header 'Authorization: <MASTER_APP_ID>'
```

### Exemplo em Node.js

O mesmo AppId MASTER lista as contas, lê o statement de uma delas e busca uma transaction naquela conta:

```js
const MASTER_APP_ID = process.env.WOOVI_MASTER_APP_ID;
const baseUrl = 'https://api.woovi.com';

const headers = { Authorization: MASTER_APP_ID };

const accountsResponse = await fetch(`${baseUrl}/api/v1/account`, { headers });
const { accounts } = await accountsResponse.json();

const targetAccountId = accounts.find((account) => !account.isDefault).accountId;

const statementResponse = await fetch(
  `${baseUrl}/api/v1/statement?companyBankAccount=${targetAccountId}&start=2026-01-01T00:00:00Z&end=2026-01-31T23:59:59Z`,
  { headers },
);
const statement = await statementResponse.json();

const transactionResponse = await fetch(
  `${baseUrl}/api/v1/transaction/E18236120202012032010s0133872GZA?companyBankAccount=${targetAccountId}`,
  { headers },
);
const { transaction } = await transactionResponse.json();

console.log({ targetAccountId, statement, transaction });
```

Não use o prefixo `Bearer`. Envie o AppId MASTER cru no header `Authorization`.

### Erros

Não há fallback silencioso para a conta do MASTER. Se a query `companyBankAccount` for rejeitada, a API responde o erro correspondente:

| Caso | Status | `error` |
| --- | --- | --- |
| A aplicação não é MASTER | `403` | `Only a MASTER application can read another account` |
| A empresa não tem `MASTER_APP_READ_ANY_ACCOUNT` | `403` | `Module MASTER APP READ ANY ACCOUNT is not enabled, contact support to enable the module.` |
| A conta não existe, foi removida ou é de outra empresa | `403` | `Company bank account not found` |
| `companyBankAccount` inválido (não é um ObjectId) | `400` | `Account ID is invalid` |
| A transaction não pertence à conta pedida | `400` | `Transaction not found` |

```json
{
  "error": "Only a MASTER application can read another account"
}
```

```json
{
  "error": "Module MASTER APP READ ANY ACCOUNT is not enabled, contact support to enable the module."
}
```

```json
{
  "error": "Company bank account not found"
}
```

### Quando usar cada abordagem

| Objetivo | Abordagem |
| --- | --- |
| Ler statement ou uma transaction de várias contas BaaS | um AppId MASTER + `?companyBankAccount=<accountId>` |
| Operar (criar cobrança, pagar, etc.) em uma conta específica | crie um AppId `API` para aquela conta com `POST /api/v1/application` |
