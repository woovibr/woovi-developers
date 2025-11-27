---
id: pix-automatic-webhooks
sidebar_position: 5.1
title: Listagem dos Webhooks
tags:
  - pix-automatic
  - api
---

## Pix Automátio WEB HOOKS

O Objeto que retorna nos webhooks do PIX_AUTOMATIC é uma Assinatura, dentro dele tem acesso ao pix automático dentro do objeto (`pixRecurring`).

O campo `globalID` representa o id único da assinatura, ele deverá ser usado nos endpoints relacionados com assinatura.

### PIX_AUTOMATIC_APPROVED

Quando o pix automático é aprovado. Ele ocorre quando o consumidor lê o QRCode e aprova a recorrência em seu banco. Após disso o status é alterado para APPROVED.

Caso você esteja usando a jornada 3 (`PAYMENT_ON_APPROVAL`), vale lembrar que quando receber o webhook, a primeira parcela já foi paga, você também receberá o webhook de `COBR_COMPLETED`.

```json
{
  "event": "PIX_AUTOMATIC_APPROVED",
  "customer": {
    "name": "Dan",
    "email": "email0@example.com",
    "phone": "+5511999999999",
    "address": {
      "zipcode": "04556300",
      "street": "rua de são paulo",
      "number": "3432",
      "neighborhood": "BROOKLIN PAULISTA",
      "city": "VITORIA",
      "state": "SP",
      "complement": "CONJ 26",
      "country": "BR",
      "location": {
        "coordinates": []
      },
      "_id": "68a88321d65cb2d507a2ee1d"
    },
    "taxID": {
      "taxID": "111111111",
      "type": "BR:CPF"
    },
    "correlationID": "6f4131ea-b816-4b08-8ba6-11cf6b622a6e"
  },
  "dayGenerateCharge": 24,
  "value": 100,
  "status": "ACTIVE",
  "correlationID": "UniqueID1344445457t11653453223241",
  "pixRecurring": {
    "recurrencyId": "RN5481141720250822YHKirVyWBjF",
    "emv": "qrcode",
    "journey": "ONLY_RECURRENCY",
    "status": "APPROVED"
  },
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGE4ODMyMWQ2NWNiMmQ1MDdhMmVlMjk="
}
```
### PIX_AUTOMATIC_REJECTED

Quando o consumidor recusa a recorrência em seu aplicativo do banco. o Status é alterado para REJECTED.

```json
{
  "event": "PIX_AUTOMATIC_REJECTED",
  "customer": {
    "name": "Dan",
    "email": "email0@example.com",
    "phone": "+5511999999999",
    "address": {
      "zipcode": "04556300",
      "street": "rua de são paulo",
      "number": "3432",
      "neighborhood": "BROOKLIN PAULISTA",
      "city": "VITORIA",
      "state": "SP",
      "complement": "CONJ 26",
      "country": "BR",
      "location": {
        "coordinates": []
      },
      "_id": "68a88321d65cb2d507a2ee1d"
    },
    "taxID": {
      "taxID": "111111111",
      "type": "BR:CPF"
    },
    "correlationID": "6f4131ea-b816-4b08-8ba6-11cf6b622a6e"
  },
  "dayGenerateCharge": 24,
  "value": 100,
  "status": "INACTIVE",
  "correlationID": "UniqueID1344445457t11653453223241",
  "pixRecurring": {
    "recurrencyId": "RN5481141720250822YHKirVyWBjF",
    "emv": "qrcode",
    "journey": "ONLY_RECURRENCY",
    "status": "REJECTED"
  },
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGE4ODMyMWQ2NWNiMmQ1MDdhMmVlMjk="
}
```

## COBR WEB HOOKS

O Objeto que retorna nos webhooks do `COBR` é a parcela na qual a cobrança será feita, dentro dele tem acesso ao cobr.

A primeira cobrança da jornada 3 (`PAYMENT_ON_APPROVAL`), que é realizada no momento da leitura do QR Code, dispará tanto o evento de `PIX_AUTOMATIC_APPROVED` quanto o `PIX_AUTOMATIC_COBR_COMPLETED`.

O campo `globalID` representa o id único da parcela.
o campo `paymentSubscriptionGlobalID` representa o id único da assinatura
o campo `correlationID` representa o seu identificador único que foi enviado ao criar a assinatura

Dentro do objeto cobr você tem acesso ao `identifierId` que é o identificador único da cobrança recorrente.

### PIX_AUTOMATIC_COBR_CREATED

Quando o COBR é criado. Por padrão ele é criado 4 dias antes da data de cobrança. Após ser criado, é feita uma requisição para o banco do consumidor para ele ser aprovado ou rejeitado. Após o COBR ser criado, você poderá receber o webhook `PIX_AUTOMATIC_COBR_TRY_REJECTED` caso tenha falha na tentativa de cobrança ou `PIX_AUTOMATIC_COBR_APPROVED` caso a cobrança seja aprovada.

```json
{
  "event": "PIX_AUTOMATIC_COBR_CREATED",
  "dateGenerateCharge": "2025-08-24T12:00:00.000Z",
  "expiration": 259200,
  "installmentNumber": 1,
  "value": 100,
  "status": "SCHEDULED",
  "createdAt": "2025-08-22T14:48:02.697Z",
  "cobr": {
    "identifierId": "01K3942Y0DFEK73H541ZADVK0P",
    "recurrencyId": "RN5481141720250822YHKirVyWBjF",
    "status": "CREATED",
    "tries": [
      {
        "tryStatus": "REQUESTED",
        "value": 1,
        "finalityPurpose": "AGND",
        "requestedExecutionDate": "2025-09-05T12:00:00.000Z",
        "createdAt": "2025-09-04T03:01:58.543Z",
        "updatedAt": "2025-09-04T03:04:03.921Z",
      }
    ],
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z"
  },
  "correlationID": "9134e286-6f71-427a-bf00-100000000005",
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmNkNGE5NTY1M2VmMjQzYjY2Zjc=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YTg4MzIyZDY1Y2IyZDUwN2EyZWUzYg=="
}
```

### PIX_AUTOMATIC_COBR_APPROVED

Quando o COBR é aprovado pelo banco do cliente, nesse caso a cobrança irá ser feita na data especificada em `dateGenerateCharge`.

```json
{
  "event": "PIX_AUTOMATIC_COBR_APPROVED",
  "dateGenerateCharge": "2025-08-24T12:00:00.000Z",
  "expiration": 259200,
  "installmentNumber": 1,
  "value": 100,
  "status": "ACTIVE",
  "createdAt": "2025-08-22T14:48:02.697Z",
  "cobr": {
    "identifierId": "01K3942Y0DFEK73H541ZADVK0P",
    "recurrencyId": "RN5481141720250822YHKirVyWBjF",
    "status": "ACTIVE",
    "tries": [
      {
        "tryStatus": "SCHEDULED",
        "value": 1,
        "finalityPurpose": "AGND",
        "requestedExecutionDate": "2025-09-05T12:00:00.000Z",
        "createdAt": "2025-09-04T03:01:58.543Z",
        "updatedAt": "2025-09-04T03:04:03.921Z",
      }
    ],
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z"
  },
  "correlationID": "9134e286-6f71-427a-bf00-100000000005",
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmNkNGE5NTY1M2VmMjQzYjY2Zjc=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YTg4MzIyZDY1Y2IyZDUwN2EyZWUzYg=="
}
```

### PIX_AUTOMATIC_COBR_COMPLETED

Quando o COBR é pago pelo consumidor.

```json
{
  "event": "PIX_AUTOMATIC_COBR_COMPLETED",
  "dateGenerateCharge": "2025-08-24T12:00:00.000Z",
  "expiration": 259200,
  "installmentNumber": 1,
  "value": 100,
  "status": "COMPLETED",
  "createdAt": "2025-08-22T14:48:02.697Z",
  "cobr": {
    "identifierId": "01K3942Y0DFEK73H541ZADVK0P",
    "recurrencyId": "RN5481141720250822YHKirVyWBjF",
    "status": "COMPLETED",
    "endToEndId": "my-end-to-end-id",
    "tries": [
      {
        "tryStatus": "PAID",
        "value": 1,
        "finalityPurpose": "AGND",
        "requestedExecutionDate": "2025-09-05T12:00:00.000Z",
        "createdAt": "2025-09-04T03:01:58.543Z",
        "updatedAt": "2025-09-04T03:04:03.921Z",
      }
    ],
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z"
  },
  "correlationID": "9134e286-6f71-427a-bf00-100000000005",
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmNkNGE5NTY1M2VmMjQzYjY2Zjc=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YTg4MzIyZDY1Y2IyZDUwN2EyZWUzYg=="
}
```

### PIX_AUTOMATIC_COBR_REJECTED

Quando o COBR é rejeitado pelo banco de cliente. O tipo do erro aparece no campo `rejectCode` do payload.
Esse webhook é disparado apenas uma vez, após todas as tentativas de cobranças serem realizadas. 

```json
{
  "event": "PIX_AUTOMATIC_COBR_REJECTED",
  "dateGenerateCharge": "2025-08-24T12:00:00.000Z",
  "expiration": 259200,
  "installmentNumber": 1,
  "value": 100,
  "status": "CANCEL",
  "createdAt": "2025-08-22T14:48:02.697Z",
  "cobr": {
    "identifierId": "01K3942Y0DFEK73H541ZADVK0P",
    "recurrencyId": "RN5481141720250822YHKirVyWBjF",
    "status": "REJECTED",
    "tries": [
      {
        "tryStatus": "REJECTED",
        "value": 1,
        "finalityPurpose": "AGND",
        "requestedExecutionDate": "2025-09-05T12:00:00.000Z",
        "createdAt": "2025-09-04T03:01:58.543Z",
        "updatedAt": "2025-09-04T03:04:03.921Z",
        "rejectCode": "DTED"
      }
    ],
    "rejectCode": "DTED"
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z",
  },
  "correlationID": "9134e286-6f71-427a-bf00-100000000005",
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmNkNGE5NTY1M2VmMjQzYjY2Zjc=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YTg4MzIyZDY1Y2IyZDUwN2EyZWUzYg=="
}
```

## COBR TRY WEB HOOKS

Representam uma tentativa de cobrança

### PIX_AUTOMATIC_COBR_TRY_REQUESTED

Quando uma nova tentatva de cobrança é realizada, apenas o ocorre se o `retryPolicy` for igual a `THREE_RETRIES_7_DAYS`.
Quando um cobr é criado também é criado uma nova tentativa de cobrança, porém não enviamos esse webhook nesse caso, visto que o evento do PIX_AUTOMATIC_COBR_CREATED já é emitido.

```json
{
  "event": "PIX_AUTOMATIC_COBR_TRY_REJECTED",
  "dateGenerateCharge": "2025-09-05T12:00:00.000Z",
  "expiration": 1209600,
  "installmentNumber": 2,
  "value": 1,
  "status": "SCHEDULED",
  "createdAt": "2025-09-04T03:00:20.372Z",
  "cobr": {
    "identifierId": "01K49ARZMETSD7XJ2H86HV188H",
    "recurrencyId": "RN5481141720250811Vs0a16RIRVm",
    "status": "CREATED",
    "tries": [
      {
        "tryStatus": "REQUESTED",
        "value": 1,
        "finalityPurpose": "AGND",
        "requestedExecutionDate": "2025-09-05T12:00:00.000Z",
        "createdAt": "2025-09-04T03:01:58.543Z",
        "updatedAt": "2025-09-04T03:04:03.921Z",
        "rejectCode": "FBRD"
      }
    ],
    "value": 1,
    "description": "comment",
    "createdAt": "2025-09-04T03:01:58.543Z"
  },
  "correlationID": "9134e286-6f71-427a-bf00-100000000005",
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2ODlhNTA1NmVjY2NkZTViMzdmYzE0MDE=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YjkwMGM0ZDE5ZTBlY2QwMmQ2NzViMg=="
}
```

### PIX_AUTOMATIC_COBR_TRY_REJECTED

Quando uma cobrança do pix automática é rejeitada pelo banco do pagador.

```json
{
  "event": "PIX_AUTOMATIC_COBR_TRY_REJECTED",
  "dateGenerateCharge": "2025-09-05T12:00:00.000Z",
  "expiration": 1209600,
  "installmentNumber": 2,
  "value": 1,
  "status": "CANCELED",
  "createdAt": "2025-09-04T03:00:20.372Z",
  "cobr": {
    "identifierId": "01K49ARZMETSD7XJ2H86HV188H",
    "recurrencyId": "RN5481141720250811Vs0a16RIRVm",
    "status": "FAILED_TRY",
    "tries": [
      {
        "tryStatus": "REJECTED",
        "value": 1,
        "finalityPurpose": "AGND",
        "requestedExecutionDate": "2025-09-05T12:00:00.000Z",
        "createdAt": "2025-09-04T03:01:58.543Z",
        "updatedAt": "2025-09-04T03:04:03.921Z",
        "rejectCode": "FBRD"
      }
    ],
    "value": 1,
    "description": "comment",
    "createdAt": "2025-09-04T03:01:58.543Z"
  },
  "correlationID": "9134e286-6f71-427a-bf00-100000000005",
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2ODlhNTA1NmVjY2NkZTViMzdmYzE0MDE=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YjkwMGM0ZDE5ZTBlY2QwMmQ2NzViMg=="
}
```