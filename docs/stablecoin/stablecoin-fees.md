---
id: stablecoin-fees
sidebar_position: 5
title: Taxas
tags:
  - stablecoin
  - api
---

## Taxas do Stablecoin

O valor total de taxas de um depósito é composto por:

1. **Taxa Woovi** — por padrão **2%** sobre o valor do depósito.
2. **Taxas do provedor (on-chain / conversão)** — aplicadas pelo provedor de liquidação e detalhadas na cotação, por exemplo `In Fee` (taxa de entrada) e `Conversion Fee` (taxa de conversão).

A taxa Woovi padrão de 2% pode ser personalizada por ativo no contrato da sua subconta, definida como um percentual, com limites mínimo e máximo opcionais.

## Onde ver as taxas

### Na cotação

O endpoint [`GET /api/v1/stablecoin/quote`](./stablecoin-endpoints.md#cotação-quote) retorna a quebra das taxas do provedor em `appliedFees`:

```json
{
  "quote": {
    "basePrice": 5.25,
    "inputAmount": 100,
    "inputCurrency": "BRL",
    "outputAmount": 19.04,
    "outputCurrency": "USDT",
    "appliedFees": [
      { "type": "In Fee", "amount": 1.5, "currency": "BRL" },
      { "type": "Conversion Fee", "amount": 0.5, "currency": "BRL" }
    ],
    "pairName": "BRL/USDT"
  }
}
```

### No depósito

A resposta de [`POST /api/v1/stablecoin/deposit`](./stablecoin-endpoints.md#criar-um-depósito) traz, dentro de `quote`, o campo `fee` com o **total** das taxas (taxa Woovi + taxas do provedor), em centavos de BRL:

```json
{
  "quote": {
    "inputAmount": 10000,
    "inputCurrency": "BRL",
    "outputAmount": 18.45,
    "outputCurrency": "USDT",
    "rate": 5.42,
    "fee": 50
  }
}
```

> O `outputAmount` já é líquido das taxas — ou seja, é exatamente quanto de stablecoin o cliente recebe.
