---
id: card-api-charge-card-default
sidebar_position: 4
title: Como aceitar cartão de crédito por padrão nas cobranças via API?
sidebar_label: Cartão por padrão na API
tags:
  - card
  - api
---

Por padrão, a cobrança criada pela API sem o campo `type` aceita somente Pix. Com a preferência **Cartão de crédito por padrão nas cobranças via API** ativada, essa cobrança aceita Pix e cartão de crédito, sem você precisar mudar a sua integração.

Use quando a sua integração não envia o `type` e você quer receber com cartão também, por exemplo quando ela é feita por um parceiro ou uma plataforma.

## Antes de começar

- A sua conta precisa estar com o **cartão de crédito habilitado**. Veja [Primeiros passos com cartão de crédito](./card-first-steps.md).
- O seu usuário precisa de permissão para editar as configurações de cartão.

## Como ativar

1. Na plataforma, acesse **Cartão de Crédito** → **Ajustes**.
2. Em **Preferências**, ative **Cartão de crédito por padrão nas cobranças via API**.
3. Clique em **Salvar**.

![Ajustes do cartão: Preferências](./__assets__/settings/preferences.png)

Para desativar, desligue a opção e clique em **Salvar**. As cobranças criadas depois disso voltam a aceitar somente Pix.

## O que muda

| Cobrança criada pela API | Preferência desativada   | Preferência ativada      |
| ------------------------ | ------------------------ | ------------------------ |
| Sem `type`               | Somente Pix              | Pix ou cartão de crédito |
| `type` `PIX_CREDIT`      | Pix ou cartão de crédito | Pix ou cartão de crédito |
| `type` `CREDIT_CARD`     | Somente cartão           | Somente cartão           |

- Cobranças que enviam o `type` não mudam.
- A preferência vale para as cobranças criadas depois que você salvar. As cobranças que já existem não mudam.
- Com a preferência ativada, a cobrança sem `type` funciona igual a uma cobrança com `type` `PIX_CREDIT`: no `paymentLinkUrl`, o pagador escolhe entre Pix e cartão.

Para saber como o pagador paga com cartão, veja [Como criar uma cobrança com cartão de crédito pela API?](./card-how-to-create-charge-using-api.mdx#como-o-pagador-paga)
