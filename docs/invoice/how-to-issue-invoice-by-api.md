---
title: Criar Nota Fiscal de serviço via API
sidebar_label: Emissão de NFSe por API
slug: /api/invoices/create
tags:
  - invoice
  - integration
  - api
---

## Endpoint

```http
POST /api/invoices
```

## Autenticação

Use o header `Authorization` com o token:

```http
Authorization: <seu_token>
```

## Request Body

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

## Exemplo curl

```bash
curl -X POST "https://api.seusistema.com/api/invoices" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Mensalidade Premium",
    "billingDate": "2025-08-31T23:59:59.000Z",
    "charge": "ch_abc",
    "customerId": "cus_123"
  }'
```

## Observações

* É necessário que a integração NFe esteja **ativa** e com status **CONFIGURED**.
* Apenas **uma nota por cobrança** pode ser emitida.
* Caso a emissão falhe, é permitido tentar novamente.
* Ao enviar um objeto `customer`, o sistema cria ou atualiza o cadastro.
