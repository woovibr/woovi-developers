---
id: pix-automatic-step-by-step
sidebar_position: 3
title: Como implementar passo a passo
tags:
  - pix-automatic
  - api
---
## Configurar os webhooks

A primeira etapa é configurar os [webhooks](./5-webhooks/pix-automatic-webhooks.md) para ser notificado quando houver alguma alteração de status. Caso ainda não saiba como cadastrar os webhooks na nossa plataforma, veja o nosso [tutorial](../webhook/platform/webhook-platform-api.mdx)

Os indispensáveis são:

1. PIX_AUTOMATIC_APPROVED : Recorrência aprovada
2. PIX_AUTOMATIC_COBR_COMPLETED : Pagamento realizado com sucesso

A próxima etapa é realizar uma requisição POST para a [criação da assinatura](./pix-automatic-how-to-create.md)