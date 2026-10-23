---
id: pix-automatic-dynamic-value
sidebar_position: 9
title: Como criar um Pix Automático com valor variável
tags:
  - pix-automatic
  - api
---

## Como criar Pix Automático com valor variável

Ao criar um Pix Automático com valor variável você deverá enviar dois valores, ambos em centavos:

- `value`: o valor base da assinatura. As cobranças são geradas com esse valor até você alterá-lo, e ele é cobrado na aprovação quando a jornada é `PAYMENT_ON_APPROVAL`.
- `pixRecurringOptions.minimumValue`: o piso para o valor máximo que o pagador pode definir ao aprovar a autorização.

## O que o valor mínimo significa

O `minimumValue` **não é o menor valor que você pode cobrar**. Ele é enviado ao Banco Central como o valor mínimo do recebedor (`valorMinimoRecebedor`), que a API Pix do Banco Central define assim:

> Se o usuário pagador atribuir um valor máximo para os pagamentos daquela autorização, ele não poderá ser inferior ao piso definido pelo usuário recebedor.

Na prática:

- Ao aprovar o Pix Automático no aplicativo do banco, o pagador pode definir um valor máximo para as cobranças. Esse valor máximo não pode ser menor que o `minimumValue`.
- Você pode cobrar qualquer valor, inclusive abaixo do `minimumValue`.
- Quem limita o valor de cada cobrança é o pagador. Uma cobrança acima do valor máximo que ele definiu será rejeitada pelo banco dele.

Por isso o `minimumValue` também pode ser maior que o `value`.

### Exemplo

Uma assinatura com `minimumValue` de R$ 500,00 (`50000`):

| Situação | Resultado |
| --- | --- |
| O pagador tenta definir um valor máximo de R$ 300,00 | Não permitido: o máximo precisa ser de pelo menos R$ 500,00 |
| O pagador define um valor máximo de R$ 600,00 e você cobra R$ 100,00 | Permitido |
| O pagador define um valor máximo de R$ 600,00 e você cobra R$ 900,00 | Rejeitada pelo banco do pagador |

### Como escolher o valor mínimo

Use o `minimumValue` para garantir uma margem: defina-o como o maior valor que você espera cobrar nessa assinatura. Assim o pagador não consegue aprovar a autorização com um limite que bloquearia as suas cobranças. O pagador vê esse valor ao aprovar a autorização.

## Atualizar o valor da assinatura

Para atualizar o valor da assinatura você pode utilizar o endpoint PUT `/api/v1/subscriptions/{id}/value`. O novo valor, em centavos, vale a partir da próxima cobrança e pode ser menor que o `minimumValue`.

```json
{
  "value": 100
}
```

Só é possível alterar o valor de assinaturas criadas com `minimumValue`.
