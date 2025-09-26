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

## Como criar uma cobrança com valor variável

Após o Pix Automático aprovado, você poderá criar as cobranças com valores variáveis segundo a [documentação de cobrança manual](https://developers.woovi.com/docs/pix-automatic/pix-automatic-cobr-manual)

Para a criar uma cobrança com valor variável você que deverá criar a cobrança manual de 5 a 10 dias antes da data de cobrança, mais detalhes na documentação.


