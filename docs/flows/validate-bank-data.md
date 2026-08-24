---
id: validate-bank-data
title: Como validar Dados bancários Usando Chave Pix
tags:
  - api
---

Este documento irá ajudá-lo a validar os dados bancários de um beneficiário a partir de uma **chave Pix** (CPF, CNPJ, e-mail, telefone ou chave aleatória).

A validação é feita enviando um pagamento de 1 centavo para a chave informada. O banco do recebedor resolve a chave e confirma a quem ela pertence — esses dados voltam na consulta do próprio pagamento, depois que ele é confirmado.

:::info Pré-requisitos

- Um **AppID** com os escopos `PAYMENT_POST` (criar pagamento) e `PAYMENT_GET` (consultar pagamento). Você cria o AppID no app, em **Integrações → API**.
- **Pix Out habilitado** na sua empresa **e** na conta que vai pagar. A liberação da conta é feita por você mesmo, seguindo o artigo [Como ativar o Pix Out (pagamento externo)](https://ajuda.woovi.com/hc/duvidas-frequentes/articles/como-ativar-o-pix-out-pagamento-externo).
- Saldo na conta de origem — o Pix de 1 centavo é real e a tarifa de pagamento é cobrada normalmente.

:::

## 1. Crie e aprove o pagamento

Crie o pagamento informando a chave Pix do beneficiário, seguindo os parâmetros do endpoint [Create Payment request](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment/post>).

### Campos do pagamento por chave Pix

| Campo | Descrição |
| --- | --- |
| value | Valor em centavos — use `1` para validar |
| correlationID | Identificador único seu, usado depois para consultar o pagamento |
| destinationAlias | Valor da chave Pix do beneficiário |
| destinationAliasType | Tipo da chave — ver tabela abaixo |
| autoApprove | `true` cria e aprova o pagamento na mesma chamada |

#### Tipos de chave (destinationAliasType)

| Código | Descrição |
| --- | --- |
| CPF | CPF do titular |
| CNPJ | CNPJ do titular |
| EMAIL | Chave de e-mail |
| PHONE | Chave de telefone |
| RANDOM | Chave aleatória (EVP) |

### Opção 1: chamada única (`autoApprove`)

Enviando `autoApprove: true`, o pagamento é criado **e aprovado na mesma chamada**, dispensando o `/api/v1/payment/approve`.

```bash
curl --location 'https://api.woovi.com/api/v1/payment' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": 1,
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "comment": "request user information",
    "autoApprove": true,
    "destinationAlias": "12345678909",
    "destinationAliasType": "CPF"
  }'
```

```json
{
  "payment": {
    "status": "APPROVED",
    "value": 1,
    "destinationAlias": "12345678909",
    "comment": "request user information",
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "sourceAccountId": "6823414a524ed520d3518dd6"
  }
}
```

:::caution Atenção

O `autoApprove` requer permissão específica na sua conta. Se a resposta vier `403` com `Your company does not have access to autoApprove payments via API`, use a Opção 2. Veja mais em [Como criar e aprovar um pagamento em uma única chamada?](../payment/payment-how-to-auto-approve.md).

:::

### Opção 2: aprovação em dois passos

Sem o `autoApprove`, o mesmo `POST /api/v1/payment` cria o pagamento com status `CREATED`, sem enviar o Pix:

```json
{
  "payment": {
    "value": 1,
    "status": "CREATED",
    "destinationAlias": "12345678909",
    "destinationAliasType": "CPF",
    "comment": "request user information",
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "sourceAccountId": "6823414a524ed520d3518dd6"
  }
}
```

Aprove em uma segunda chamada, seguindo o endpoint [Approve a Payment Request](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment~1approve/post>). Essa chamada exige o escopo `PAYMENT_APPROVE_POST` no AppID e envia apenas o `correlationID`.

```bash
curl --location 'https://api.woovi.com/api/v1/payment/approve' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001"
  }'
```

```json
{
  "payment": {
    "status": "APPROVED",
    "value": 1,
    "destinationAlias": "12345678909",
    "comment": "request user information",
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "sourceAccountId": "6823414a524ed520d3518dd6"
  }
}
```

:::note

A criação **não** valida a chave: um pagamento para uma chave inexistente é criado normalmente e só falha depois de aprovado. E nenhuma das duas chamadas retorna os dados do titular — o Pix é liquidado de forma assíncrona, então esse dado só existe depois da confirmação. Para obtê-lo, consulte o pagamento (próximo passo).

:::

## 2. Consulte o pagamento para obter os dados do titular

Consulte [`GET /api/v1/payment/{id}`](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment~1%7Bid%7D/get>) usando o `correlationID` que você enviou. Depois que o pagamento fica `CONFIRMED`, a resposta traz os dados do titular da chave no bloco **`destination`** (e os mesmos dados, completos, em `transaction.creditParty`).

```bash
curl --location 'https://api.woovi.com/api/v1/payment/c0938e0c-a613-48a9-982a-672c062d0001' \
  --header 'Authorization: {APP_ID}'
```

```json
{
  "payment": {
    "status": "CONFIRMED",
    "value": 1,
    "destinationAlias": "12345678909",
    "comment": "request user information",
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "sourceAccountId": "6823414a524ed520d3518dd6"
  },
  "transaction": {
    "value": 1,
    "time": "2026-01-01T12:00:00.000Z",
    "endToEndId": "E54811417202601011200abcdefghijk",
    "creditParty": {
      "pixKey": {
        "pixKey": "12345678909",
        "type": "CPF"
      },
      "account": {
        "branch": "0001",
        "account": "1234567890",
        "accountType": "TRAN"
      },
      "psp": {
        "id": "12345678",
        "name": "BANCO EXEMPLO S.A."
      },
      "holder": {
        "name": "Fulano de Tal",
        "nameFriendly": "Fulano de Tal",
        "taxID": {
          "taxID": "12345678909",
          "type": "BR:CPF"
        }
      }
    }
  },
  "destination": {
    "name": "Fulano de Tal",
    "taxID": "12345678909",
    "pixKey": "12345678909",
    "bank": "BANCO EXEMPLO S.A.",
    "branch": "0001",
    "account": "1234567890"
  }
}
```

- `destination.name` / `destination.taxID` — nome e documento do titular da chave, resolvidos pelo banco do recebedor no momento da liquidação. Diferente de uma validação em que você mesmo informa o nome, aqui o nome vem **do banco**, não do que você enviou. Não vêm mascarados.
- `destination.pixKey` — a chave Pix usada (`destinationAlias`).
- `destination.bank` / `branch` / `account` — instituição financeira, agência e conta vinculadas à chave.
- `transaction.endToEndId` — identificador do Pix no Banco Central, útil para conciliação.

:::note

O bloco `destination` só aparece com o pagamento `CONFIRMED`. Enquanto o status for `CREATED` ou `APPROVED`, a resposta traz apenas o `payment` — a confirmação costuma levar poucos segundos.

:::

## 3. Erros possíveis

Se a chave não estiver cadastrada em nenhum banco, ou o PSP do recebedor rejeitar o Pix, o pagamento vai para `FAILED`, **sem** `transaction` e **sem** `destination`, e o motivo vem no bloco `error`. Nesse caso o dinheiro não sai da conta.

```json
{
  "payment": {
    "status": "FAILED",
    "value": 1,
    "destinationAlias": "12345678909",
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "sourceAccountId": "6823414a524ed520d3518dd6"
  },
  "error": {
    "code": "PIX_KEY_INFO_NOT_FOUND",
    "description": "A chave pix não esta cadastrada em um banco"
  }
}
```

- `PIX_KEY_INFO_NOT_FOUND` — chave válida mas não cadastrada no DICT
- `403 External payments not enabled for your company` — Pix Out não habilitado na empresa
- `400 External payments not enabled for this account` — Pix Out não habilitado na conta de origem
- `403 Your company does not have access to autoApprove payments via API` — use a aprovação em dois passos
- `400 destinationAliasType must be one of the following values` — tipo de chave fora do enum

Quando a rejeição vem do banco do recebedor, o código também aparece em `transaction.providerRejectedReason` — veja a lista em [Error codes - Payment](./error-codes-payment.md).

## 4. Webhooks

Para não ficar consultando o pagamento em intervalos, configure um webhook e reaja ao evento de confirmação ou de falha. Nenhum dos dois traz os dados do titular — use o `correlationID` deles para consultar o pagamento (passo 2).

### Webhook de confirmação (`MOVEMENT_CONFIRMED`)

```json
{
  "event": "OPENPIX:MOVEMENT_CONFIRMED",
  "payment": {
    "status": "APPROVED",
    "value": 1,
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "sourceAccountId": "6823414a524ed520d3518dd6"
  },
  "transaction": {
    "value": 1,
    "time": "2026-01-01T12:00:00.000Z",
    "endToEndId": "E54811417202601011200abcdefghijk"
  }
}
```

### Webhook de falha (`MOVEMENT_FAILED`)

```json
{
  "event": "OPENPIX:MOVEMENT_FAILED",
  "payment": {
    "value": 1,
    "status": "FAILED",
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001"
  },
  "transaction": {
    "value": 1,
    "endToEndId": "E54811417202601011200abcdefghijk",
    "time": "2026-01-01T12:00:00.000Z",
    "providerRejectedReason": "AC03 - Pagamento rejeitado pelo PSP do recebedor"
  }
}
```

Se não souber como configurar o webhook, acesse: [Criando um webhook para interceptar um Pix e chamar uma API](https://developers.woovi.com/docs/webhook/platform/webhook-platform-api).

## Prompt para IA

Copie o trecho abaixo numa IA de coding (Claude / Cursor / Gemini / ChatGPT) pra implementar a integração no seu app:

> Implemente uma função `validateBankDataByPixKey({ destinationAlias, destinationAliasType })` que valida os dados bancários vinculados a uma chave Pix via Woovi, enviando um pagamento de 1 centavo e devolvendo os dados do titular resolvidos pelo banco pra essa chave.
>
> **Passo 1 — criar e aprovar o pagamento**:
> `POST https://api.woovi.com/api/v1/payment`
> Header: `Authorization: <APP_ID>`, `Content-Type: application/json`
> Pré-requisito: AppID com os escopos `PAYMENT_POST` e `PAYMENT_GET`, e Pix Out habilitado na empresa e na conta de origem.
> ```json
> {
>   "value": 1,
>   "correlationID": "<uuid único>",
>   "autoApprove": true,
>   "destinationAlias": "<chave Pix>",
>   "destinationAliasType": "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM"
> }
> ```
> (`autoApprove: true` exige permissão específica na conta; sem ela, crie o pagamento e aprove depois com `POST /api/v1/payment/approve` enviando o `correlationID`, com o escopo `PAYMENT_APPROVE_POST`.)
>
> **A resposta do passo 1 NÃO traz os dados do titular** — traz só o status do pagamento. O Pix é liquidado de forma assíncrona.
>
> **Passo 2 — buscar os dados do titular**: `GET https://api.woovi.com/api/v1/payment/{correlationID}`. Quando `payment.status` for `CONFIRMED`, os dados do titular vêm no bloco `destination` (`name`, `taxID`, `pixKey`, `bank`, `branch`, `account`) e, completos, em `transaction.creditParty`. Enquanto o status for `CREATED`/`APPROVED`, o `destination` ainda não existe — faça polling com backoff ou, melhor, trate os webhooks `OPENPIX:MOVEMENT_CONFIRMED` e `OPENPIX:MOVEMENT_FAILED` e consulte o pagamento ao receber o evento.
>
> **Passo 3 — tratar falha**: se `payment.status` for `FAILED`, não há `transaction` nem `destination`; o motivo vem em `error.code` / `error.description` (ex.: `PIX_KEY_INFO_NOT_FOUND` = chave não cadastrada em nenhum banco) e, quando a rejeição é do banco do recebedor, em `transaction.providerRejectedReason`.
