---
id: card-installments
sidebar_position: 3
title: Como funciona o parcelamento no cartão de crédito?
sidebar_label: Parcelamento no cartão
tags:
  - card
  - concept
---

Com o parcelamento, o pagador divide o pagamento da cobrança em parcelas no cartão de crédito.

## Quem define o quê

- **Você define o máximo de parcelas** da cobrança, ao criá-la em **Nova cobrança**, no campo **Parcelamento no cartão**. O máximo respeita o limite configurado para a sua conta.
- **O pagador escolhe em quantas parcelas paga**, de 1x até o máximo que você definiu, na página de pagamento.

Depois que o pagador confirma o número de parcelas, a escolha não pode ser alterada para aquela cobrança.

## Sem juros para o pagador

O parcelamento não tem juros para o pagador. O total pago é sempre o valor da cobrança, dividido pelo número de parcelas.

Por exemplo, uma cobrança de R$ 300,00 em até 3x mostra ao pagador:

- 1x de R$ 300,00, total R$ 300,00
- 2x de R$ 150,00, total R$ 300,00
- 3x de R$ 100,00, total R$ 300,00

## Taxa

A taxa da venda depende do número de parcelas que o pagador escolheu. Você recebe o valor da cobrança menos a taxa.

:::info Cobranças criadas pela API
Hoje, o parcelamento é configurado somente na criação da cobrança pela plataforma. A cobrança criada pela API é paga à vista. Saiba mais em [Como criar uma cobrança com cartão de crédito pela API?](./card-how-to-create-charge-using-api.mdx)
:::
