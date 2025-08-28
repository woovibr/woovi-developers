---
id: pix-api-routes
sidebar_position: 7
title: Rotas API
tags:
  - pix-automatic
  - api
---

## Pix Automátio Rotas da API

Você pode ver em mais detalhes pelo [link](https://developers.woovi.com/api#tag/subscription)

### Criar uma Assinatura

A principal rota é a `/api/v1/subscriptions`, na qual é possível realizar a criação de uma nova assinatura. [link](./pix-automatic-how-to-create.md)

### Listar uma assinatura

GET `/api/v1/subscriptions/{id}`

No objeto `pixRecurring` você tem acesso ao status do Pix Automático
 
```json
{
    "subscription": {
        "customer": {
            "name": "Dan",
            "email": "email0@example.com",
            "phone": "+5511999999999",
            "address": {
                "zipcode": "04556300",
                "street": "rua de são paulo",
                "number": "3432",
                "neighborhood": "BROOKLIN PAULISTA",
                "city": "SAO PAULO",
                "state": "SP",
                "complement": "CONJ 26",
                "country": "BR",
                "location": {
                    "coordinates": []
                },
                "_id": "68acbcd4a95653ef243b66eb"
            },
            "taxID": {
                "taxID": "111111111111",
                "type": "BR:CPF"
            },
            "correlationID": "6f4131ea-b816-4b08-8ba6-11cf6b622a6e"
        },
        "dayGenerateCharge": 25,
        "value": 100,
        "status": "ACTIVE",
        "correlationID": "My-UniqueID",
        "pixRecurring": {
            "recurrencyId": "RN5481141720250825yPWxVcFfpA1",
            "emv": "QRCODE",
            "journey": "PAYMENT_ON_APPROVAL",
            "status": "CREATED"
        },
        "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmNkNGE5NTY1M2VmMjQzYjY2Zjc="
    }
}
```

### Listar todas as assinaturas

GET `/api/v1/subscriptions/`

```json
{
  "subscriptions": [],
  "pageInfo": {
        "skip": 0,
        "limit": 100,
        "totalCount": 0,
        "hasPreviousPage": false,
        "hasNextPage": true
    }
}
```

### Buscar os dados de uma parcela

no objeto COBR vc tem acesso ao status da cobrança.

GET `/api/v1/installments/{id}`

```json
{
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
  "paymentSubscriptionGlobalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2OGFjYmM5MWE5NTY1M2VmMjQzYjY2OTk=",
  "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbkluc3RhbGxtZW50OjY4YTg4MzIyZDY1Y2IyZDUwN2EyZWUzYg=="
}
```

### Listar todas as parcelas de uma assinatura

GET `/api/v1/subscriptions/{id}/installments`

```json
{
  "installments": [],
  "pageInfo": {
        "skip": 0,
        "limit": 100,
        "totalCount": 0,
        "hasPreviousPage": false,
        "hasNextPage": true
    }
}
```

### Cancelar uma Assintarua

PUT `/api/v1/subscriptions/{id}/cancel`