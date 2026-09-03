---
id: webhooks-por-conta
title: Webhooks por conta
tags:
  - baas
  - api
  - webhook
sidebar_position: 8
---

Webhooks pertencem à credencial que os registrou. No modo BaaS isso significa:

- Eventos de **abertura de conta** (`ACCOUNT_REGISTER_*`) → registre com a **API Master**
- Eventos de **movimento de uma conta** (cobrança paga, Pix recebido…) → registre com o **AppID daquela conta**

## Registrando um webhook

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/webhook \
  --header 'Authorization: <APP_ID_DA_CONTA>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "webhook": {
      "name": "pagamentos conta cliente 001",
      "event": "OPENPIX:CHARGE_COMPLETED",
      "url": "https://minhaurl.exemplo/webhook/conta-001",
      "authorization": "meu-token-de-verificacao",
      "isActive": true
    }
  }'
```

No registro, a Woovi faz um _handshake_: sua URL recebe um POST de teste e precisa responder `200`. Para pular essa validação, adicione `?validate=false` à URL do endpoint. A resposta do registro inclui um `hmacSecretKey`, usado na validação de assinatura.

## Eventos mais úteis no BaaS

| Evento                                                   | Dispara quando                                | Registrar com  |
| -------------------------------------------------------- | --------------------------------------------- | -------------- |
| `OPENPIX:CHARGE_COMPLETED`                               | uma cobrança da conta é paga                  | AppID da conta |
| `OPENPIX:TRANSACTION_RECEIVED`                           | a conta recebe um Pix                         | AppID da conta |
| `OPENPIX:MOVEMENT_CONFIRMED` / `OPENPIX:MOVEMENT_FAILED` | um envio de Pix da conta é confirmado / falha | AppID da conta |
| `OPENPIX:TRANSACTION_REFUND_RECEIVED`                    | a conta recebe uma devolução                  | AppID da conta |
| `ACCOUNT_REGISTER_APPROVED` / `_REJECTED` / `_PENDING`   | um registro de conta muda de status           | API Master     |
| `ACCOUNT_REGISTER_STEP_*`                                | o lojista concluiu uma etapa do onboarding    | API Master     |

A lista completa de eventos está em `GET /api/v1/webhook/events` e em [Tipos de eventos de webhook](../webhook/webhook-events-type.md).

## Um endpoint por conta ou um único endpoint?

Os dois funcionam. Com muitas contas, prefira **um único endpoint** no seu sistema e identifique a conta pelo caminho da URL registrada (ex.: `/webhook/conta-001`) ou pelo header `authorization` configurado em cada webhook.

## Limites e segurança

- Máximo de **50 webhooks por empresa**; a mesma combinação de URL + evento não pode se repetir
- Valide a assinatura `x-webhook-signature` de cada entrega — veja [Validação de assinatura](../webhook/seguranca/webhook-signature-validation.mdx)
- Restrinja a origem aos IPs oficiais da Woovi — veja [IPs de webhook](../webhook/seguranca/webhook-ips.md)

## Acompanhando o onboarding etapa por etapa

Os eventos acima só avisam o desfecho. Se você quer saber o que falta enquanto o lojista ainda
está preenchendo — BC Protege+, autenticação Pix, documentos do sócio — veja
[Webhooks por etapa do onboarding](./kyc/webhooks-por-etapa.md).
