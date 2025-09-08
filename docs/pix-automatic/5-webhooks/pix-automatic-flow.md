---
id: pix-automatic-flow
sidebar_position: 5.2
title: Fluxograma
tags:
  - pix-automatic
  - api
---

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

## Cobrança recorrente rejeitada

Esse fluxo ocorre quando uma cobrança é rejeitada pelo banco do consumidor sem retentativas.

O evento `PIX_AUTOMATIC_COBR_TRY_REJECTED` é recebido imediatamente após o banco informar da falha da cobrança

O evento `PIX_AUTOMATIC_COBR_REJECTED` é recebido após a expiração da cobrança e a última tentativa de cobrança falhou

```mermaid
sequenceDiagram
    Woovi->>Banco do Consumidor: Pedir Aprovação da Cobrança
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_CREATED
    end
    Banco do Consumidor->>Woovi: Tentativa de Cobrança rejeitada
   alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_TRY_REJECTED
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_REJECTED
    end
```

### Novas Retentativas
Caso tenha habilitado retentativas no cadastro da assinatura, após a primeira tentativa de cobrança rejeitada, serão feitas até 3 novas tentativas de cobranças.

A primeira será feita um dia após a data da cobrança.
A segunda na data intermediária entre a data da cobrança e a data de expiração.
A terceira na data de expiração da cobrança.

Cada tentativa de cobrança seguirá o fluxo abaixo em caso seja rejeitada.

```mermaid
sequenceDiagram
    Woovi->>Banco do Consumidor: Nova tentativa de Cobrança
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_TRY_REQUESTED
    end
    Banco do Consumidor->>Woovi: Tentativa de Cobrança rejeitada
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_TRY_REJECTED
    end
```

Se nenhuma tentativa for aceita até a data de expiração, será enviado o webhook `PIX_AUTOMATIC_COBR_REJECTED`

```mermaid
sequenceDiagram
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_REJECTED
    end
    
```

Caso a tentativa seja aceita, o seguinte fluxo ocorrerá

```mermaid
sequenceDiagram
    Woovi->>Banco do Consumidor: Nova tentativa de Cobrança
      alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_TRY_REQUESTED
    end
    Banco do Consumidor->>Woovi: Tentativa de Cobrança aceita
    alt Webhooks 
       Woovi->>Sua Empresa: event: PIX_AUTOMATIC_COBR_APPROVED
    end
```


