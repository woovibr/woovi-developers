---
id: validate-bank-data-manual
title: Como validar dados bancários por transação prévia (agência e conta)
description: Confirme a agência e conta de um beneficiário com um pagamento efetivo de R$ 0,01 antes do pagamento definitivo.
tags:
  - api
---

# Como validar dados bancários por transação prévia (agência e conta)

A validação é feita por um **pagamento efetivo de R$ 0,01** para a agência e conta que **você informa**. O resultado indica se o pagamento foi **liquidado** (a conta existe, está apta a receber e corresponde ao CPF/CNPJ informado) ou **rejeitado**, com o motivo. Confirmada a conta, você faz o pagamento definitivo ao mesmo beneficiário.

:::warning Uso exclusivo como etapa prévia de um pagamento

A transação prévia confirma dados bancários que você **já possui**, antes de pagar o mesmo beneficiário.

Não use este fluxo para:

- consultar ou enriquecer dados cadastrais de pessoas ou empresas;
- montar ou atualizar bases de dados;
- validar identidade sem a intenção de realizar um pagamento.

Transações prévias sem pagamento posterior ao mesmo beneficiário são monitoradas e podem levar à suspensão e ao encerramento da conta.

:::

:::tip Endpoint dedicado

Para validar agência e conta recebendo apenas o resultado (válido, inválido ou inconclusivo), prefira o endpoint dedicado de [Validação de Dados Bancários](/docs/payment/check-account-data). Este documento descreve a mesma validação usando a API de Pagamentos.

:::

> **Pré-requisitos:** ter uma [API MASTER](/docs/apis/api-master) e o **Pix Out habilitado** na conta. Caso não tenha o Pix Out, solicite seguindo o artigo [Como ativar o Pix Out (pagamento externo)](https://ajuda.woovi.com/hc/duvidas-frequentes/articles/como-ativar-o-pix-out-pagamento-externo).

## Sequência da integração

1. Você cria um pagamento de R$ 0,01 com os dados bancários do beneficiário.
2. Você aprova o pagamento.
3. Você recebe o resultado: pagamento liquidado ou rejeitado, com o motivo.
4. Com a conta confirmada, você faz o pagamento definitivo ao mesmo beneficiário, com os mesmos dados.

## 1. Crie o pagamento de R$ 0,01

Crie o pagamento informando os dados bancários do beneficiário, seguindo os parâmetros do endpoint [Create Payment request](https://developers.woovi.com/api#tag/payment-request-access/POST/api/v1/payment).

### Campos do pagamento

#### holder (dados do beneficiário)

Pessoa ou empresa que vai receber o pagamento.

| Campo       | Descrição                               |
| ----------- | --------------------------------------- |
| name        | Nome completo do beneficiário           |
| taxID.type  | Tipo do documento (`BR:CPF` ou `BR:CNPJ`) |
| taxID.taxID | Número do documento                     |

#### account (dados bancários)

Conta bancária do beneficiário.

| Campo       | Descrição                                                         |
| ----------- | ----------------------------------------------------------------- |
| branch      | Número da agência, **exatamente 4 dígitos** (ex: `"0001"`)        |
| account     | Número da conta, com o dígito verificador (ex: `"123456"`)        |
| accountType | Tipo da conta (ver tabela abaixo)                                 |

#### Tipos de conta (accountType)

| Código | Descrição                                |
| ------ | ---------------------------------------- |
| CACC   | Current Account (Conta Corrente)         |
| SLRY   | Salary Account (Conta Salário)           |
| SVGS   | Savings Account (Conta Poupança)         |
| TRAN   | Transacting Account (Conta de Pagamento) |

#### psp (instituição do beneficiário)

| Campo | Descrição                                 |
| ----- | ----------------------------------------- |
| id    | Código ISPB da instituição (8 dígitos)    |
| name  | Nome da instituição financeira            |

Para descobrir o `id` da instituição, consulte o endpoint [PSPs](https://developers.woovi.com/api#tag/psp/GET/api/v1/psp) e use o ISPB no campo `psp.id`.

```bash
curl --location 'https://api.woovi.com/api/v1/payment' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": 1,
    "correlationID": "validacao-beneficiario-0001",
    "holder": {
      "name": "Fulano de Tal",
      "taxID": {
        "type": "BR:CPF",
        "taxID": "12345678909"
      }
    },
    "psp": {
      "id": "12345678",
      "name": "BANCO EXEMPLO S.A."
    },
    "account": {
      "branch": "0001",
      "account": "123456",
      "accountType": "CACC"
    }
  }'
```

## 2. Aprove o pagamento e acompanhe o resultado

Há **duas formas** de aprovar o pagamento.

### Opção 1: aprovação automática (`autoApprove`) — chamada única

Enviando `autoApprove: true` no corpo da requisição do `/api/v1/payment`, o pagamento é criado **e aprovado na mesma chamada**, dispensando o `/api/v1/payment/approve`. A resposta imediata traz o `payment` com status `APPROVED`. O resultado da liquidação chega depois, por webhook ou consulta (veja [O que é retornado](#o-que-é-retornado)).

:::info

O uso do `autoApprove` requer permissão específica na sua conta. Entre em contato com o suporte para ativar. Veja mais em [Como criar e aprovar um pagamento em uma única chamada?](/docs/payment/payment-how-to-auto-approve).

:::

```bash
curl --location 'https://api.woovi.com/api/v1/payment' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": 1,
    "correlationID": "validacao-beneficiario-0001",
    "autoApprove": true,
    "holder": {
      "name": "Fulano de Tal",
      "taxID": {
        "type": "BR:CPF",
        "taxID": "12345678909"
      }
    },
    "psp": {
      "id": "12345678",
      "name": "BANCO EXEMPLO S.A."
    },
    "account": {
      "branch": "0001",
      "account": "123456",
      "accountType": "CACC"
    }
  }'
```

### Opção 2: aprovação em dois passos (`/payment/approve`)

Sem o `autoApprove`, o pagamento é criado com status `CREATED` e você o aprova em uma segunda chamada, seguindo o endpoint [Approve a Payment Request](https://developers.woovi.com/api#tag/payment-request-access/POST/api/v1/payment/approve).

```bash
curl --location 'https://api.woovi.com/api/v1/payment/approve' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "correlationID": "validacao-beneficiario-0001"
  }'
```

### O que é retornado?

O Pix é liquidado de forma assíncrona. O resultado chega no webhook (veja a seção [Webhooks](#3-webhooks)) ou pode ser consultado pelo endpoint [`GET /api/v1/transaction`](https://developers.woovi.com/api#tag/transactions/GET/api/v1/transaction), filtrando pelo `endToEndId` recebido no webhook.

**Pagamento liquidado.** A conta existe, está apta a receber e corresponde ao CPF/CNPJ informado. A resposta traz o registro do pagamento, com os dados do beneficiário **informados por você na criação do pagamento**, no campo `destination`. O CPF é retornado mascarado.

```json
{
  "payment": { },
  "transaction": { },
  "destination": {
    "name": "Fulano de Tal",
    "taxID": "123.***.***-09",
    "bank": "BANCO EXEMPLO S.A.",
    "branch": "0001",
    "account": "123456"
  }
}
```

**Pagamento rejeitado.** A instituição do beneficiário recusou o pagamento. O motivo vem em `transaction.providerRejectedReason`. Os mais comuns:

| Código | Motivo                                   |
| ------ | ---------------------------------------- |
| AC03   | Número da conta do recebedor inválido    |
| AC06   | Conta bloqueada                          |
| AC07   | Conta encerrada                          |
| AC14   | Tipo de conta inválido                   |
| BE01   | CPF/CNPJ não corresponde ao titular da conta |

Veja a lista completa em [Códigos de Erro de Pagamento Pix](/docs/flows/error-codes-payment).

## 3. Webhooks

Após a aprovação do pagamento, você recebe webhooks com o resultado.

### Webhook de confirmação (`MOVEMENT_CONFIRMED`)

```json
{
  "event": "OPENPIX:MOVEMENT_CONFIRMED",
  "account": {
    "accountId": "6823414a524ed520d3518dd6"
  },
  "payment": {
    "value": 1,
    "status": "CONFIRMED",
    "comment": "",
    "correlationID": "validacao-beneficiario-0001"
  },
  "transaction": {
    "value": 1,
    "endToEndId": "E54811417202601011200abcdefghijk",
    "time": "2026-01-01T12:00:00.000Z"
  },
  "destination": {
    "name": "Fulano de Tal",
    "taxID": {
      "taxID": "123.***.***-09",
      "type": "BR:CPF"
    },
    "bankName": "BANCO EXEMPLO S.A.",
    "ispb": "12345678",
    "branch": "0001",
    "account": "123456",
    "accountType": "CACC"
  }
}
```

O `destination` é o registro do pagamento liquidado, com os dados do beneficiário informados por você. Veja todos os campos em [Payload de Pagamentos](/docs/webhook/examples/webhook-payment-payload#pagamento-confirmado).

### Webhook de falha (`MOVEMENT_FAILED`)

```json
{
  "event": "OPENPIX:MOVEMENT_FAILED",
  "payment": {
    "value": 1,
    "status": "FAILED",
    "correlationID": "validacao-beneficiario-0001"
  },
  "transaction": {
    "value": 1,
    "endToEndId": "E54811417202601011200abcdefghijk",
    "time": "2026-01-01T12:00:00.000Z",
    "providerRejectedReason": "AC03 - Número da conta do recebedor inválido"
  }
}
```

Se não souber como configurar o webhook, acesse: [Criando um webhook para interceptar um Pix e chamar uma API](/docs/webhook/platform/webhook-platform-api).

## 4. Faça o pagamento definitivo

Com o pagamento de R$ 0,01 liquidado, crie o pagamento definitivo ao **mesmo beneficiário**, com os mesmos `holder`, `account` e `psp` usados na validação e o valor real em `value`. Siga os mesmos passos da [seção 1](#1-crie-o-pagamento-de-r-001) e da [seção 2](#2-aprove-o-pagamento-e-acompanhe-o-resultado), com um novo `correlationID`.

## Prompt para IA

Copie o trecho abaixo numa IA de coding (Claude / Cursor / Gemini / ChatGPT) para implementar a integração no seu app:

> Implemente uma função `validateBankAccount({ holder, account, psp })` que valida a agência e conta de um beneficiário via Woovi, com um pagamento efetivo de R$ 0,01, como etapa prévia ao pagamento definitivo ao mesmo beneficiário.
>
> **Endpoint**: `POST https://api.woovi.com/api/v1/payment` **Header**: `Authorization: <APP_ID_MASTER>` e `Content-Type: application/json` **Pré-requisito**: a conta precisa ter Pix Out habilitado.
>
> **Body** (envie `autoApprove: true` para criar e aprovar numa única chamada):
>
> ```json
> {
>   "value": 1,
>   "correlationID": "<uuid único>",
>   "autoApprove": true,
>   "holder": {
>     "name": "<nome do beneficiário>",
>     "taxID": { "type": "BR:CPF" | "BR:CNPJ", "taxID": "<documento>" }
>   },
>   "psp": { "id": "<ISPB de 8 dígitos>", "name": "<nome do banco>" },
>   "account": {
>     "branch": "<agência>",
>     "account": "<conta>",
>     "accountType": "CACC" | "SLRY" | "SVGS" | "TRAN"
>   }
> }
> ```
>
> **Resultado**: o Pix é assíncrono. Trate os webhooks `OPENPIX:MOVEMENT_CONFIRMED` (pagamento liquidado: conta válida e correspondente ao CPF/CNPJ informado) e `OPENPIX:MOVEMENT_FAILED` (pagamento rejeitado: motivo em `transaction.providerRejectedReason`). O `destination` do webhook de confirmação é o registro do pagamento, com os dados informados na criação e o CPF mascarado.
>
> **Depois da validação**: crie o pagamento definitivo ao mesmo beneficiário, com os mesmos `holder`, `account` e `psp`, o valor real e um novo `correlationID`.
>
> **Restrição de uso**: use este fluxo somente como etapa prévia de um pagamento ao mesmo beneficiário. Não use para consultar ou enriquecer dados cadastrais, montar bases de dados ou validar identidade sem intenção de pagamento.
