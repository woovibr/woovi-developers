---
id: payment-how-to-auto-approve
sidebar_position: 5
title: Como criar e aprovar um pagamento em uma única chamada?
tags:
  - payment
  - api
  - approve
  - auto-approve
---

## Criando e aprovando um pagamento em uma única chamada

O campo `autoApprove` no endpoint `POST /api/v1/payment` permite criar e aprovar um pagamento Pix em uma única requisição, eliminando a necessidade de chamar o endpoint `/api/v1/payment/approve` separadamente.

> **Atenção:** O uso do `autoApprove` requer habilitação especial na sua conta. Entre em contato com o suporte para ativar essa funcionalidade.

## Como usar

Envie `autoApprove: true` no corpo da requisição ao criar um pagamento:

```json
{
  "value": 100,
  "destinationAlias": "c4249323-b4ca-43f2-8139-8232aab09b93",
  "destinationAliasType": "RANDOM",
  "comment": "pagamento comentário",
  "correlationID": "payment-1",
  "autoApprove": true
}
```

## Resposta

Quando `autoApprove: true` e o pagamento for aprovado com sucesso, a resposta incluirá os dados enriquecidos do pagamento, transação e destinatário:

```json
{
  "payment": {
    "value": 100,
    "status": "APPROVED",
    "destinationAlias": "c4249323-b4ca-43f2-8139-8232aab09b93",
    "destinationAliasType": "RANDOM",
    "comment": "pagamento comentário",
    "correlationID": "payment-1"
  },
  "transaction": {
    "value": 100,
    "endToEndId": "E...",
    "time": "2025-01-01T00:00:00.000Z"
  },
  "destination": {
    "name": "Dan",
    "taxID": "31324227036",
    "pixKey": "c4249323-b4ca-43f2-8139-8232aab09b93",
    "bank": "A Bank",
    "branch": "1",
    "account": "123456"
  }
}
```

## Comportamento sem o flag

Quando `autoApprove` é omitido ou `false`, o pagamento é criado normalmente com status `CREATED` e pode ser aprovado posteriormente via [`POST /api/v1/payment/approve`](./payment-how-to-use-api-to-approve.md).

```json
{
  "payment": {
    "value": 100,
    "status": "CREATED",
    "correlationID": "payment-1"
  }
}
```

## Saldo insuficiente

Ao tentar aprovar com saldo insuficiente, a requisição retornará erro `400`:

```json
{
  "error": "You do not have enough balance to make this payment"
}
```

## Referência da API

Acesse a documentação completa do endpoint em [API Reference](/api#tag/payment-(request-access)/paths/~1api~1v1~1payment/post).
