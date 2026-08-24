---
id: validate-bank-data
title: Como validar Dados bancários Usando Chave Pix
tags:
  - api
---

Este documento irá ajudá-lo a validar os dados bancários de um beneficiário a partir de uma **chave Pix** (CPF, CNPJ, e-mail, telefone ou chave aleatória).

A validação é feita iniciando um pagamento de 1 centavo para a chave informada. O banco do recebedor resolve a chave via DICT e confirma a quem ela pertence — esses dados ficam disponíveis consultando a transação depois da confirmação do pagamento.

> **Pré-requisitos:** ter uma [API MASTER](../apis/api-master.md) e o **PIX OUT habilitado** na conta. Caso não tenha o Pix Out, solicite seguindo o artigo [Como ativar o Pix Out (pagamento externo)](https://ajuda.woovi.com/hc/duvidas-frequentes/articles/como-ativar-o-pix-out-pagamento-externo).

## 1. Crie o pagamento

Crie o pagamento informando a chave Pix do beneficiário, seguindo os parâmetros do endpoint [Create Payment request](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment/post>).

### Campos do pagamento por chave Pix

| Campo | Descrição |
| --- | --- |
| destinationAlias | Valor da chave Pix do beneficiário |
| destinationAliasType | Tipo da chave — ver tabela abaixo |

#### Tipos de chave (destinationAliasType)

| Código | Descrição |
| --- | --- |
| CPF | CPF do titular |
| CNPJ | CNPJ do titular |
| EMAIL | Chave de e-mail |
| PHONE | Chave de telefone |
| RANDOM | Chave aleatória (EVP) |

```bash
curl --location 'https://api.woovi.com/api/v1/payment' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": 1,
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "comment": "request user information",
    "destinationAlias": "07*******61",
    "destinationAliasType": "CPF"
  }'
```

## 2. Aprove o pagamento

Há **duas formas** de aprovar o pagamento:

### Opção 1: Aprovação automática (`autoApprove`) — chamada única

Enviando `autoApprove: true` no corpo da requisição do `/api/v1/payment` (a mesma da etapa anterior), o pagamento é criado **e aprovado na mesma chamada**, dispensando o `/api/v1/payment/approve`.

> **Atenção:** o uso do `autoApprove` requer permissão especial na sua conta. Entre em contato com o suporte para ativar. Veja mais em [Como criar e aprovar um pagamento em uma única chamada?](../payment/payment-how-to-auto-approve.md).

```bash
curl --location 'https://api.woovi.com/api/v1/payment' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "value": 1,
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001",
    "comment": "request user information",
    "autoApprove": true,
    "destinationAlias": "07*******61",
    "destinationAliasType": "CPF"
  }'
```

### Opção 2: Aprovação em dois passos (`/payment/approve`)

Sem o `autoApprove`, o pagamento é criado com status `CREATED` e você precisa aprová-lo em uma segunda chamada, seguindo o endpoint [Approve a Payment Request](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment~1approve/post>).

```bash
curl --location 'https://api.woovi.com/api/v1/payment/approve' \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "correlationID": "c0938e0c-a613-48a9-982a-672c062d0001"
  }'
```

> **Atenção:** nem o `POST /api/v1/payment` nem o `POST /api/v1/payment/approve` retornam os dados do titular da chave — a resposta de ambos traz só o `payment` (status, valor, correlationID etc). O Pix é liquidado de forma assíncrona, então o dado do titular só existe depois da confirmação. Para obtê-lo, consulte a transação — veja o próximo passo.

## 3. Consulte a transação para obter os dados do titular

Depois que o pagamento é confirmado (veja o webhook no passo 4, que traz o `endToEndId`), consulte [`GET /api/v1/transaction/{id}`](<https://developers.woovi.com/api#tag/transactions/paths/~1api~1v1~1transaction~1{id}/get>) usando o `endToEndId` (ou o `transactionID`) recebido. Os dados do titular da chave vêm no campo **`creditParty`**:

```bash
curl --location 'https://api.woovi.com/api/v1/transaction/E00416968202608010010NRGg4kHJ3D0' \
  --header 'Authorization: {APP_ID}'
```

Exemplo real de resposta (dados sensíveis mascarados abaixo apenas para fins desta documentação — a API não mascara nada, veja a nota logo em seguida):

```json
{
  "transaction": {
    "value": 1,
    "endToEndId": "E00416968202608010010NRGg4kHJ3D0",
    "type": "PAYMENT",
    "status": "CONFIRMED",
    "creditParty": {
      "holder": {
        "name": "VAKI****** N******* V******* LTDA",
        "nameFriendly": "VAKI****** N******* V******* LTDA",
        "taxID": {
          "taxID": "228*******26",
          "type": "BR:CNPJ"
        }
      },
      "pixKey": {
        "pixKey": "624****0@*******.com.br",
        "type": "EMAIL"
      },
      "account": {
        "branch": "0001",
        "account": "0000000000000****501",
        "accountType": "TRAN"
      },
      "psp": {
        "id": "54811417",
        "name": "WOOVI IP LTDA."
      }
    }
  }
}
```

> O mascaramento acima (`****`) foi aplicado só nesta documentação — a resposta real da API **não** vem mascarada, traz o `name`/`taxID`/`account` completos, exatamente como resolvidos pelo banco.

- `creditParty.holder.name` / `taxID` — nome e documento do titular da chave, resolvidos pelo banco do recebedor via DICT no momento da liquidação. Diferente do fluxo por [agência e conta](./validate-bank-data-manual.md) (onde você mesmo informa o nome e ele nunca é validado), aqui o nome vem **do banco**, não do que você enviou.
- `creditParty.pixKey` — a chave Pix usada (`destinationAlias`) e seu tipo.
- `creditParty.account` / `psp` — agência, conta e instituição financeira vinculadas à chave.

> Se o pagamento for **rejeitado** (`status: FAILED`/`REJECTED`), a transação não terá `creditParty` preenchido — nesse caso, confie apenas no `providerRejectedReason` para saber o motivo. Veja a lista de códigos em [Error codes - Payment](./error-codes-payment.md).

## 4. Webhooks

Após a criação e confirmação do pagamento, você receberá webhooks com o status da transação — é deles que você extrai o `endToEndId` para consultar a transação no passo anterior.

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
    "endToEndId": "E54811417202507081527dYr4Cp2gfAp",
    "time": "2025-07-08T15:27:19.687Z",
    "providerRejectedReason": "AC03 - Pagamento rejeitado pelo PSP do recebedor"
  }
}
```

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
    "time": "2025-07-08T15:27:19.687Z",
    "endToEndId": "E54811417202507081527dYr4Cp2gfAp"
  }
}
```

> Nenhum dos dois webhooks traz os dados do titular (`creditParty`) — use o `endToEndId` deles para consultar `GET /api/v1/transaction/{id}` (passo 3).

Se não souber como configurar o webhook, acesse: [Criando um webhook para interceptar um Pix e chamar uma API](https://developers.woovi.com/docs/webhook/platform/webhook-platform-api).

## Prompt para IA

Copie o trecho abaixo numa IA de coding (Claude / Cursor / Gemini / ChatGPT) pra implementar a integração no seu app:

> Implemente uma função `validateBankDataByPixKey({ destinationAlias, destinationAliasType })` que valida os dados bancários vinculados a uma chave Pix via Woovi, iniciando um pagamento de 1 centavo e devolvendo os dados do titular resolvidos pelo banco pra essa chave.
>
> **Passo 1 — criar e aprovar o pagamento**:
> `POST https://api.woovi.com/api/v1/payment`
> Header: `Authorization: <APP_ID_MASTER>`, `Content-Type: application/json`
> Pré-requisito: a conta precisa ter PIX OUT habilitado.
> ```json
> {
>   "value": 1,
>   "correlationID": "<uuid único>",
>   "autoApprove": true,
>   "destinationAlias": "<chave Pix>",
>   "destinationAliasType": "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "RANDOM"
> }
> ```
> (`autoApprove: true` exige permissão especial na conta; sem ela, crie o pagamento e aprove depois com `POST /api/v1/payment/approve` enviando o `correlationID`.)
>
> **A resposta do passo 1 NÃO traz os dados do titular** — traz só o status do pagamento. O Pix é liquidado de forma assíncrona.
>
> **Passo 2 — aguardar a confirmação**: trate os webhooks `OPENPIX:MOVEMENT_CONFIRMED` (aprovado) e `OPENPIX:MOVEMENT_FAILED` (rejeitado). Guarde o `endToEndId` de dentro de `transaction.endToEndId`.
>
> **Passo 3 — buscar os dados do titular**: `GET https://api.woovi.com/api/v1/transaction/{endToEndId}`. Os dados confirmados do titular vêm em `transaction.creditParty` (`holder.name`, `holder.taxID`, `pixKey`, `account`, `psp`) — só existem se a transação foi confirmada. Se foi rejeitada, use `transaction.providerRejectedReason` para saber o motivo.
