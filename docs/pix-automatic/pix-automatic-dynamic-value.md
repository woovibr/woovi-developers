---
id: pix-automatic-dynamic-value
sidebar_position: 9
title: Como criar um Pix Automático com valor variável
tags:
  - pix-automatic
  - api
---

## Como criar Pix Automático com valor variável

Ao criar um pix automático com valor dinâmico você deverá enviar os dois valores

- `value` que é o valor padrão da assinatura, ele que será cobrado na primeira parcela caso seja do tipo `PAYMENT_ON_APPROVAL`,
- `minimumValue` que é o valor mínimo que poderá ser cobrado pela assinatura

Vale lembrar que a assinatura de valor variável não tem um limite para o quanto você poderá cobrar, quem define esse limite é o usuário no aplicativo do banco de destino ao aprovar o QR Code. A única restrição é que o valor máximo definido por ele seja maior que o mínimo que você defininiu.

Dessa forma, ao realizar uma cobrança com valor superior ao mínimo ela poderá ser rejeitada a depender das restrições que o usuário definiu.

## Atualizar o valor da assinatura

Para atualizar o valor da assinatura você pode utilizar o endpoint `/api/v1/subscriptions/{id}/value`

```json
{
  "value": 100
}
```
