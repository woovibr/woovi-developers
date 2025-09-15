---
title: Criar Nota Fiscal de serviço via API
sidebar_label: Emissão de NFSe por API
tags:
  - invoice
  - integration
  - api
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Endpoint

```http
POST /api/v1/invoice
```
Você encontra a documentação mais detalhada desse endpoint nas [documentações de api](https://developers.woovi.com/en/api#tag/invoice/paths/~1api~1v1~1invoice/post)


A API aceita dois formatos de payload, sempre exigindo dados de cobrança **ou** valor, e um cliente (via `customerId` ou objeto `customer`).

### Formato 1 – com valor

```json
{
  "description": "Assinatura Pro - Agosto/2025",
  "billingDate": "2025-08-31T23:59:59.000Z",
  "value": 12990,
  "customerId": "cus_123"
}
```

### Formato 2 – com cobrança

```json
{
  "description": "Mensalidade Premium",
  "billingDate": "2025-08-31T23:59:59.000Z",
  "charge": "ch_abc",
  "customer": {
    "taxID": "12345678909",
    "name": "Maria Souza",
    "email": "maria@email.com",
    "phone": "+55 48 99999-0000",
    "address": {
      "country": "BR",
      "zipcode": "88000-000",
      "street": "Rua das Flores",
      "number": "100",
      "state": "SC"
    }
  }
}
```

## Resposta

### Sucesso (201)

```json
{
  "invoice": {
    "id": "inv_123",
    "status": "ISSUED",
    "provider": "NFEIO",
    "chargeId": "ch_abc",
    "customerId": "cus_123",
    "value": 12990,
    "links": {
      "xml": "https://.../inv_123.xml",
      "pdf": "https://.../inv_123.pdf"
    }
  }
}
```

### Erros (400)

* `You need to configure the invoice integration`
* `Customer not found`
* `Customer is required`
* `Charge not found`
* `Customer address is invalid`

### Exemplos em código

<Tabs>
  <TabItem value="shell-curl" label="Shell + cURL" default>

```sh
 curl --request POST \
     --url https://api.woovi.com/api/v1/invoice \
     --header 'Authorization: {AUTHORIZATION TOKEN}' \
     --header 'content-type: application/json'\
      -d '{
        "description": "Mensalidade Premium",
        "billingDate": "2025-08-31T23:59:59.000Z",
        "charge": "ch_abc",
        "customerId": "cus_123"
      }'
```

</TabItem>
<TabItem value="javascript" label="JavaScript + Fetch" default>

```js
fetch('https://api.woovi.com/api/v1/invoice', {
  method: 'POST',
  headers: {
    Authorization: {AUTHORIZATION TOKEN},
    'Content-Type': 'application/json',
  },
  body: {
    description: "Mensalidade Premium",
    billingDate: "2025-08-31T23:59:59.000Z",
    charge: "ch_abc",
    customerId: "cus_123"
  }
}).then(async (res) => res.json)
```

  </TabItem>
</Tabs>
