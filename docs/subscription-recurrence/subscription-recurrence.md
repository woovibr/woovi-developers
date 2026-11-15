---
id: subscription-recurrence
title: Cobrança Recorrente
tags:
  - subscription
  - recurrence
  - payment
---

A Cobrança Recorrente permite que você cobre os seus clientes com uma periodicidade predeterminada. Na API, cada Cobrança Recorrente é uma **assinatura** (`/api/v1/subscriptions`).

A plataforma gera as cobranças, cada uma com um QR Code Pix dinâmico, a partir das configurações da assinatura e envia e-mail/SMS/WhatsApp para cobrar o seu cliente de forma automática.

## Casos de Uso

- Assinaturas de SaaS - Software as a Services
- Mensalidades de serviços - como academias, escolas, etc.

## Cobrança Recorrente ou Pix Automático?

Na **Cobrança Recorrente**, a Woovi gera e envia ao seu cliente uma nova cobrança com QR Code Pix a cada ciclo, e ele paga normalmente. No **Pix Automático**, modalidade oficial do Banco Central, o cliente autoriza uma única vez no app do banco e os pagamentos saem automaticamente; na API, a assinatura é do tipo `PIX_RECURRING` e o estado da autorização fica no objeto `pixRecurring`.

As duas usam a mesma rota, `/api/v1/subscriptions`. Veja a documentação do [Pix Automático](/docs/pix-automatic/pix-automatic-what-is-it).
