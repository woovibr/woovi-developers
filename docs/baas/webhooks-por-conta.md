---
id: webhooks-por-conta
title: Webhooks por conta
description: Como escolher a credencial certa, quais eventos existem no BaaS e o que fazer quando um webhook não chega.
tags:
  - baas
  - api
  - webhook
sidebar_position: 8
---

No BaaS você opera duas coisas ao mesmo tempo: a **abertura** das contas dos seus clientes e o que acontece **dentro** de cada conta aberta. São dois grupos de eventos, e eles se cadastram com credenciais diferentes.

## A regra: cada webhook pertence à credencial que o cadastrou

| O que você quer saber                                                        | Cadastre com        | Por quê                                                                       |
| ---------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| o andamento e o desfecho da **abertura de conta** (`ACCOUNT_REGISTER_*`)      | **API Master**      | a subconta ainda não existe quando esses eventos começam a ser emitidos       |
| o que acontece **dentro de uma conta** aberta (cobrança paga, Pix recebido…)  | **AppID da conta**  | o evento é da conta, e a entrega sai da própria conta                         |

:::caution Cadastrar no lugar errado não dá erro — dá silêncio
Os eventos `ACCOUNT_REGISTER_*` são entregues para a empresa **dona do cadastro**, que é a sua empresa master. Se você registrar `ACCOUNT_REGISTER_APPROVED` com o AppID de uma subconta, o `POST` retorna `200`, o webhook aparece cadastrado, e nada nunca chega.
:::

## Cadastrando um webhook

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

Um webhook escuta **um** evento. Para receber cinco eventos na mesma URL, faça cinco `POST` — o par URL + evento é único, então a mesma URL com eventos diferentes é aceita, e a mesma URL com o mesmo evento não.

No cadastro a Woovi faz um _handshake_: sua URL recebe um POST de teste e precisa responder `200`. Para pular essa validação (útil quando o seu endpoint ainda não está no ar), adicione `?validate=false` ao endereço do endpoint. A resposta do cadastro traz o `hmacSecretKey` daquele webhook, usado na validação de assinatura HMAC.

## Eventos de abertura de conta — cadastre com a API Master

| Evento                                 | Dispara quando                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `ACCOUNT_REGISTER_STEP_UPDATED`        | o seu cliente conclui um passo do onboarding — ou o BC Protege+ bloqueia um passo  |
| `ACCOUNT_REGISTER_IN_REVIEW`           | o cadastro entra em análise                                                       |
| `ACCOUNT_REGISTER_DOCUMENTS_REQUESTED` | a análise pede documentos novos (RFI)                                             |
| `ACCOUNT_REGISTER_RFI_RESOLVED`        | o seu cliente respondeu a todos os documentos pedidos                             |
| `ACCOUNT_REGISTER_PENDING`             | o cadastro volta para o seu cliente com pendências                                |
| `ACCOUNT_REGISTER_APPROVED`            | KYC aprovado, conta provisionada — o payload traz `accountId`, agência e conta     |
| `ACCOUNT_REGISTER_REJECTED`            | KYC reprovado, com o motivo                                                       |

Com esses sete eventos você acompanha o onboarding inteiro sem _polling_ e sem console: cada entrega diz em que passo o cliente está, o que falta e se ele já foi devolvido antes. O detalhamento de cada payload, os onze nomes de passo, o bloqueio do BC Protege+ e o par RFI estão em **[Como acompanhar o onboarding em tempo real por webhooks](./kyc/webhooks-ciclo-de-vida.mdx)**.

## Eventos de uma conta aberta — cadastre com o AppID da conta

| Evento                                                   | Dispara quando                                |
| -------------------------------------------------------- | --------------------------------------------- |
| `OPENPIX:CHARGE_COMPLETED`                               | uma cobrança da conta é paga                  |
| `OPENPIX:CHARGE_CREATED` / `OPENPIX:CHARGE_EXPIRED`      | uma cobrança é criada / expira                |
| `OPENPIX:TRANSACTION_RECEIVED`                           | a conta recebe um Pix                         |
| `OPENPIX:TRANSACTION_REFUND_RECEIVED`                    | a conta recebe uma devolução                  |
| `OPENPIX:MOVEMENT_CONFIRMED` / `OPENPIX:MOVEMENT_FAILED` | um envio de Pix da conta é confirmado / falha |
| `COMPANY_BANK_ACCOUNT_BLOCKED`                           | os bloqueios da conta mudam                   |

A lista completa e sempre atualizada — os dois grupos juntos — está em `GET /api/v1/webhook/events`, em [Tipos de eventos de webhook](../webhook/webhook-events-type.md) e no [Explorador de eventos](../webhook/webhook-events-explorer.mdx), onde você copia o payload de exemplo já como tipo TypeScript, JSON Schema, Yup ou Zod.

## Um endpoint por conta ou um único endpoint?

Os dois funcionam, e com muitas contas o **endpoint único** é o que se sustenta: um webhook por conta significa manter N cadastros, N segredos HMAC e N rotações.

Para saber de qual conta veio cada entrega, escolha um destes:

- **caminho da URL** que você cadastrou (`/webhook/conta-001`) — o mais simples;
- **header `authorization`** configurado por webhook;
- **o próprio payload**: os eventos de conta trazem o bloco `account` (com o `clientId` da credencial) e `company`.

Nos eventos de abertura de conta use o `correlationID` — é o identificador que **você** enviou ao criar o onboarding, e ele volta em toda entrega.

## Segurança

Toda entrega chega com dois cabeçalhos de autenticidade, e eles não são a mesma coisa:

| Header                | O que é                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `x-webhook-signature` | assinatura RSA-SHA256 (base64) feita com a chave privada da Woovi — **é a que você deve validar** ([como](../webhook/seguranca/webhook-signature-validation.mdx)) |
| `x-openpix-signature` | HMAC-SHA1 (base64) com o `hmacSecretKey` daquele webhook ([como](../webhook/seguranca/webhook-hmac.mdx))              |

- Valide a assinatura **antes** de processar o corpo, e rejeite a entrega que não tiver assinatura válida.
- Restrinja a origem aos [IPs oficiais da Woovi](../webhook/seguranca/webhook-ips.md).
- Responda `200` rápido e processe de forma assíncrona: quem responde devagar entra na fila de retentativas por _timeout_, não por erro.

## Limites

- Máximo de **50 webhooks por empresa** — outro motivo para preferir um endpoint único a um por conta.
- O mesmo par URL + evento não pode se repetir.
- Sem `200`, a Woovi tenta de novo — veja [Regras de retentativa](../webhook/webhook-retry.md) e [Timeout](../webhook/webhook-timeout.md).

## Não está chegando nada?

Nesta ordem:

1. **Credencial errada.** `ACCOUNT_REGISTER_*` com o AppID da subconta nunca entrega. Recadastre com a API Master.
2. **O cadastro falhou no _handshake_.** Se a sua URL não respondeu `200` no POST de teste, o webhook não foi criado. Confira listando com `GET /api/v1/webhook`.
3. **Assinatura.** Se você valida `x-webhook-signature` com a chave pública errada, a entrega chega e o seu lado descarta. As chaves estão em [Chaves públicas](../webhook/seguranca/webhook-public-keys.md).
4. **Limite de 50** atingido: o `POST` responde com erro de limite, não com `200`.
5. **Reenvie para conferir.** Veja [Reenvio de webhook](../webhook/webhook-resend.md) e [Testando webhooks](../webhook/webhook-test.md).

Se você precisa saber o estado de um cadastro agora, sem esperar evento, o [`GET /api/v1/account-register/:id`](./kyc/api-account-register-get.mdx) é a fonte da verdade — o webhook é o caminho rápido, a API é a confirmação.
