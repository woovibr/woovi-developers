---
id: pix-automatic-webhooks
sidebar_position: 6
title: Webhooks
tags:
  - pix-automatic
  - api
---

## Pix Automátio WEB HOOKS

O Objeto que retorna nos webhooks do PIX_AUTOMATIC é o uma Assinatura, dentro dele tem acesso ao pix automático dentro do objeto (`pixRecurring`).

### PIX_AUTOMATIC_APPROVED

Quando o pix automático é aprovado. Ele ocorre quando o consumidor lê o QRCode e aprova a recorrência em seu banco. Após disso o status é alterado para APPROVED.

Caso você esteja usando a jornada 3 (`PAYMENT_ON_APPROVAL`), vale lembrar que quando receber o webhook, a primeira parcela já foi paga.

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

## COBR WEB HOOKS

O Objeto que retorna nos webhooks do `COBR` é a parcela na qual a cobrança será feita, dentro dele tem acesso ao cobr.

A primeira cobrança da jornada 3 (`PAYMENT_ON_APPROVAL`), que é realizada no momento da leitura do QR Code, não é considerado um COBR, logo não acionará os hooks relacionados ao COBR.

### PIX_AUTOMATIC_COBR_CREATED

Quando o COBR é criado. Por padrão ele é criado 4 dias antes da data de cobrança. Após ser criado, é feita uma requisição para o banco do consumidor para ele ser aprovado ou rejeitado. Após o COBR ser criado, em poucos instantes deverá receber a confirmação se foi aceito ou rejeitado.

O objeto principal de retorno dos webhooks do COBR é o PaymentSubscriptionInstallment, dentro desse objeto você tem o acesso ao `COBR` relacionado.

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
    "installmentId": "68a88322d65cb2d507a2ee3b",
    "status": "CREATED",
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z"
  },
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
    "installmentId": "68a88322d65cb2d507a2ee3b",
    "status": "ACTIVE",
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z"
  },
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
    "installmentId": "68a88322d65cb2d507a2ee3b",
    "status": "COMPLETED",
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z"
  },
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmNkNGE5NTY1M2VmMjQzYjY2Zjc=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YTg4MzIyZDY1Y2IyZDUwN2EyZWUzYg=="
}
```

### PIX_AUTOMATIC_COBR_REJECTED

Quando o COBR é rejeitado pelo banco de cliente. O tipo do erro aparece no campo `rejectCode` do payload.

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
    "installmentId": "68a88322d65cb2d507a2ee3b",
    "status": "REJECTED",
    "rejectCode": "DTED"
    "value": 100,
    "createdAt": "2025-08-22T14:49:22.702Z",
  },
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmNkNGE5NTY1M2VmMjQzYjY2Zjc=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YTg4MzIyZDY1Y2IyZDUwN2EyZWUzYg=="
}
```