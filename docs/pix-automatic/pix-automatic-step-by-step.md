---
id: pix-automatic-step-by-step
sidebar_position: 3
title: Como implementar passo a passo
tags:
  - pix-automatic
  - api
---
## Configurar os webhooks

A primeira etapa é configurar os [webhooks](./pix-automatic-webhooks.md) para ser notificado quando houver alguma alteração de status. Caso ainda não saiba como cadastrar os webhooks na nossa plataforma, veja o nosso [tutorial](../webhook/platform/webhook-platform-api.mdx)

Os indispensáveis são:

1. PIX_AUTOMATIC_APPROVED : Recorrência aprovada
2. PIX_AUTOMATIC_COBR_COMPLETED : Pagamento realizado com sucesso

A próxima etapa é realizar uma requisição POST para a [criação da assinatura](./pix-automatic-how-to-create.md)

## Criação de uma assinatura
```mermaid
sequenceDiagram
    Sua Empresa->>+Woovi: POST /subscription
    Woovi-->>-Sua Empresa: QR Code
    Sua Empresa->>+Consumidor: Enviar o QR Code
    Consumidor-->>Woovi: Aprovar QR Code
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_APPROVED
    end
```

## Criação da Cobrança Recorrente
A criação da Cobrança ocorre 4 dias antes da data de pagamento da cobrança. Isso é importante para garantir que está tudo certo com a cobrança, e que tanto a Woovi, quanto o banco de destino estejam aptos a realizar a cobrança.

```mermaid
sequenceDiagram
    Woovi->>Banco do Consumidor: Pedir Aprovação da Cobrança
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_CREATED
    end
    Banco do Consumidor->>Woovi: Cobrança Confirmada
     alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_APPROVED
    end
```

## Recebimento de um pagamento

Esse fluxo ocorre no dia do pagamento definido, após ter a cobrança confirmada.

```mermaid
sequenceDiagram
    Banco do Consumidor->>Woovi: Envia o pagamento
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_COMPLETED
    end
```