---
title: 'Guia de migração: Transfeera → Woovi'
description: O que muda em cada chamada ao migrar uma integração da API da Transfeera para a API da Woovi.
unlisted: true
---

# Guia de migração: Transfeera → Woovi

Para quem integra com a API da Transfeera e vai passar a usar a Woovi: o que muda em cada chamada, o que não tem equivalente e como testar antes de virar a chave.

## Mapa rápido

Quase tudo tem equivalente direto. As três mudanças que mais exigem código são: valores em **centavos** (a Transfeera usa reais na maioria das rotas), **Pix de saída sem lotes** (cria e aprova um a um) e **autenticação por AppID** fixo em vez de token OAuth.

| Para quê                        | Transfeera                                                      | Woovi                                                      |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| Autenticação                    | `POST /authorization` (client_credentials) → `Bearer` de 30 min | `Authorization: <AppID>`, sem prefixo e sem expiração      |
| Cobrança Pix imediata           | `POST /pix/qrcode/collection/immediate`                         | `POST /api/v1/charge`                                      |
| Cobrança com vencimento         | `POST /pix/qrcode/collection/dueDate`                           | `POST /api/v1/charge` com `type: "OVERDUE"`                |
| Boleto + Pix                    | `POST /charges`                                                 | `POST /api/v1/charge` com `type: "BOLETO"`                 |
| QR estático                     | `POST /pix/qrcode/static`                                       | `POST /api/v1/qrcode-static`                               |
| Consultar cobrança              | `GET /pix/qrcode/{id}`                                          | `GET /api/v1/charge/{id ou correlationID}`                 |
| Cancelar cobrança               | `DELETE /pix/qrcode/{id}`                                       | `DELETE /api/v1/charge/{id}`                               |
| Pix recebidos                   | `GET /pix/cashin`                                               | `GET /api/v1/transaction`                                  |
| Devolução                       | `POST /pix/cashin/{end2endId}/refund`                           | `POST /api/v1/charge/{id}/refund` ou `POST /api/v1/refund` |
| Pix de saída                    | `POST /batch` + `/batch/{id}/transfer` + `/close`               | `POST /api/v1/payment` + `POST /api/v1/payment/approve`    |
| Consulta DICT                   | `GET /pix/dict_key/{key}`                                       | `GET /api/v1/pix-keys/{pixKey}/check`                      |
| Saldo                           | `GET /statement/balance`                                        | `GET /api/v1/account/{accountId}`                          |
| Extrato                         | `POST /statement_report` (CSV assíncrono)                       | `GET /api/v1/statement` (JSON paginado)                    |
| Subcontas                       | `POST /accounts` (Multicontas)                                  | `POST /api/v1/subaccount`                                  |
| Split                           | `split_payment[]`                                               | `splits[]`                                                 |
| Pix Automático                  | `/pix/automatic/authorizations` + `payment_intents`             | `POST /api/v1/subscriptions` (`type: "PIX_RECURRING"`)     |
| Webhooks                        | `POST /webhook` com `object_types[]`                            | `POST /api/v1/webhook`, um evento por cadastro             |
| Validação de conta (ContaCerta) | `POST /validation`                                              | Sem equivalente: use a consulta de chave Pix               |
| Pagamento de boleto             | lote `type: "BOLETO"`                                           | Boleto out existe, ver doc de boleto out                   |

## Ambientes e autenticação

Na Woovi não há fluxo de token nem certificado mTLS: cada requisição leva o AppID no header `Authorization`. Pode remover o job de renovação de token e o certificado do cliente HTTP.

|                | Transfeera                                                 | Woovi                                                     |
| -------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| API produção   | `https://api.mtls.transfeera.com` (mTLS obrigatório)       | `https://api.woovi.com`                                   |
| API sandbox    | `https://api-sandbox.transfeera.com`                       | `https://api.woovi-sandbox.com`                           |
| Painel sandbox | `app-sandbox.transfeera.com`                               | `app.woovi-sandbox.com` (cadastro próprio, sem aprovação) |
| Credencial     | `client_id` + `client_secret` → token de 30 min            | AppID criado no painel, sem expiração                     |
| Header         | `Authorization: Bearer <token>` + `User-Agent` obrigatório | `Authorization: <AppID>`                                  |
| Rate limit     | 100 req/s em escrita, 40 req/s em leitura                  | Responde `429` com `Retry-After`; trate com backoff       |

**Criar o AppID:** no painel, API/Plugins → Nova API/Plugin → tipo "API" → Salvar → confirmar com 2FA → copiar o AppID. Dá para restringir o AppID por escopo (por exemplo, só `CHARGE_POST`) e por IP de origem. O AppID é segredo de backend: nunca no front.

```bash
curl https://api.woovi-sandbox.com/api/v1/charge?limit=1 \
  -H "Authorization: $WOOVI_APP_ID"
```

AppID inválido responde `401` com `{"data":null,"errors":[{"message":"appID inválido"}]}`. O antigo domínio `api.openpix.com.br` também funciona em produção, mas use `api.woovi.com`.

## Receber Pix

Na Woovi não é preciso informar a chave Pix na cobrança: ela usa a chave padrão da conta. O seu identificador passa a ser o `correlationID`, que substitui `txid` + `integration_id`.

**Antes (Transfeera):**

```json
POST /pix/qrcode/collection/immediate
{
  "pix_key": "chave@empresa.com",
  "original_value": 52.11,
  "txid": "pedido12345abcdefghijklmnop",
  "integration_id": "pedido-12345",
  "expiration": 3600,
  "payer": { "name": "Maria Silva", "document": "12345678909" }
}
```

**Depois (Woovi):**

```json
POST /api/v1/charge?return_existing=true
{
  "correlationID": "pedido-12345",
  "value": 5211,
  "expiresIn": 3600,
  "customer": { "name": "Maria Silva", "taxID": "12345678909" },
  "additionalInfo": [{ "key": "Pedido", "value": "12345" }]
}
```

| Campo na resposta   | Transfeera                                                                      | Woovi                                                      |
| ------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Copia e cola        | `emv_payload`                                                                   | `brCode`                                                   |
| Imagem do QR        | `image_base64`                                                                  | `qrCodeImage` (URL) ou `GET /api/image/qrcode/base64/{id}` |
| Página de pagamento | —                                                                               | `paymentLinkUrl`                                           |
| ID do Pix           | `txid`                                                                          | `transactionID`                                            |
| Status              | `ATIVA` / `CONCLUIDA` / `REMOVIDA_PELO_USUARIO_RECEBEDOR` / `REMOVIDA_PELO_PSP` | `ACTIVE` / `COMPLETED` / `EXPIRED`                         |

**Cobrança com vencimento (cobv):** `type: "OVERDUE"` com `daysForDueDate`, `daysAfterDueDate`, `fines`, `interests` e `discountSettings`. Multa e juros vão em pontos-base (`value: 200` = 2%).

**Consultar e cancelar:** `GET /api/v1/charge/{id}` aceita o próprio `correlationID` (URL-encoded), então não é preciso guardar o ID da Woovi. `DELETE /api/v1/charge/{id}` cancela; `PATCH` com `expiresDate` muda a validade.

**Devolução:** `POST /api/v1/charge/{correlationID}/refund` com `{"correlationID": "devolucao-12345", "value": 234}`. Sem `value`, devolve o total. Para um Pix recebido que não veio de cobrança, use `POST /api/v1/refund` com `transactionEndToEndId`. O status final chega por webhook, como na Transfeera.

**Pix recebidos:** `GET /api/v1/transaction` substitui `GET /pix/cashin`; o comprovante em PDF sai em `GET /api/v1/receipt/pix-in/{endToEndId}`.

## Enviar Pix e pagamentos

Na Woovi não existe lote: cada Pix de saída é criado e depois aprovado. Quem montava um lote de N transferências passa a fazer N pares de chamadas, cada um com seu `correlationID`. O envio de Pix precisa ser liberado pelo suporte da Woovi antes do primeiro uso.

**Antes (Transfeera):** `POST /batch` → `POST /batch/{id}/transfer` (um por item) → `POST /batch/{id}/close`.

**Depois (Woovi):**

```json
POST /api/v1/payment
{
  "type": "PIX_KEY",
  "value": 5054,
  "destinationAlias": "12345678909",
  "destinationAliasType": "CPF",
  "correlationID": "saque-987",
  "comment": "Repasse outubro"
}

POST /api/v1/payment/approve
{ "correlationID": "saque-987" }
```

A aprovação devolve `transaction.endToEndId` e os dados do recebedor em `destination`. Também dá para configurar aprovação automática.

| Para quê                    | Transfeera                                              | Woovi                                                      |
| --------------------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| Destino por chave           | `destination_bank_account.pix_key`                      | `type: "PIX_KEY"` + `destinationAlias`                     |
| Destino por copia e cola    | `emv`                                                   | `type: "QR_CODE"` + `qrCode`                               |
| Destino por agência e conta | `destination_bank_account{bank_code, agency, account…}` | `type: "MANUAL"` + `holder`                                |
| Consulta DICT antes         | `GET /pix/dict_key/{key}` → `pix_end2end_id`            | `GET /api/v1/pix-keys/{pixKey}/check` → `pixKeyEndToEndId` |
| Agendamento                 | `payment_date` (até 30 dias)                            | Sem equivalente: agende do seu lado                        |
| Status final                | `FINALIZADO` / `DEVOLVIDO`                              | `CONFIRMED` / `FAILED` / `DENIED`                          |
| Comprovante                 | `bank_receipt_url` (expira em 60 dias)                  | `GET /api/v1/receipt/pix-out/{endToEndId}`                 |

**Consulta de chave tem custo em fichas:** cada CNPJ tem um balde de 500 fichas que repõe 20 por minuto. Chave encontrada gasta 1 ficha e chave inexistente gasta 20. Abaixo de 20 fichas a API responde `429` `TOO_MANY_REQUESTS`, o que também bloqueia pagamento por QR. Acompanhe o saldo em `GET /api/v1/pix-keys/tokens`.

**Saldo e extrato:**

- **Saldo:** `GET /api/v1/account/{accountId}` substitui `GET /statement/balance`. Liste as contas em `GET /api/v1/account/`.
- **Extrato:** `GET /api/v1/statement?start=&end=` devolve JSON paginado. Não é o relatório CSV assíncrono da Transfeera, então não há polling.
- **Saque:** `POST /api/v1/account/{accountId}/withdraw`.
- **Entre contas suas:** `POST /api/v1/transfer` com `fromPixKey` e `toPixKey`.

## Webhooks

Na Woovi cada webhook escuta um evento, então um `object_types` com vários tipos vira vários cadastros. A assinatura muda de HMAC com segredo para RSA com chave pública.

```json
POST /api/v1/webhook
{
  "webhook": {
    "name": "cobranca-paga",
    "event": "OPENPIX:CHARGE_COMPLETED",
    "url": "https://sua-api.com/webhooks/woovi",
    "isActive": true
  }
}
```

Ao cadastrar, a Woovi envia um teste para a URL. Ela precisa responder 200.

| Transfeera (`object_types`)          | Woovi (`event`)                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `CashIn`                             | `OPENPIX:CHARGE_COMPLETED` (cobrança paga) e `OPENPIX:TRANSACTION_RECEIVED` (qualquer Pix recebido) |
| `CashInRefund`                       | `PIX_TRANSACTION_REFUND_SENT_CONFIRMED` / `PIX_TRANSACTION_REFUND_SENT_REJECTED`                    |
| `Transfer`                           | `OPENPIX:MOVEMENT_CONFIRMED` / `OPENPIX:MOVEMENT_FAILED` / `OPENPIX:MOVEMENT_REMOVED`               |
| `TransferRefund`                     | `PIX_TRANSACTION_REFUND_RECEIVED_CONFIRMED`                                                         |
| `ChargeReceivable` / `Boleto`        | `BOLETO_SETTLED`                                                                                    |
| `Infraction`                         | `OPENPIX:DISPUTE_CREATED` e demais `OPENPIX:DISPUTE_*`                                              |
| `AutomaticPix*`                      | `PIX_AUTOMATIC_*`                                                                                   |
| Expiração de QR (sem evento próprio) | `OPENPIX:CHARGE_EXPIRED`                                                                            |

|            | Transfeera                                              | Woovi                                                                                  |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Header     | `Transfeera-Signature: t=…,v1=…`                        | `x-webhook-signature`                                                                  |
| Algoritmo  | HMAC-SHA256 de `${t}.${rawBody}` com `signature_secret` | RSA-SHA256 do corpo cru, validada com a chave pública da Woovi                         |
| Chave      | devolvida no cadastro                                   | `GET /api/v1/webhook/public-keys` (sem auth; produção e sandbox têm chaves diferentes) |
| Tentativas | 1 + 2 retentativas                                      | 8 tentativas com backoff exponencial (10 s a 1280 s) e reenvio manual no painel        |

```js
import crypto from 'node:crypto';

// rawBody: o corpo exatamente como chegou, antes de qualquer JSON.parse
// a chave pública é publicada em base64: decodifique para obter o PEM
const wooviPublicKeyPem = Buffer.from(publicKeyBase64, 'base64').toString(
  'ascii',
);
const isValid = crypto.verify(
  'sha256',
  Buffer.from(rawBody),
  wooviPublicKeyPem,
  Buffer.from(req.headers['x-webhook-signature'], 'base64'),
);
```

O header antigo `X-OpenPix-Signature` (HMAC-SHA1) está descontinuado; não comece por ele. Como há retentativas, o handler precisa ser idempotente: use o `correlationID` ou o `endToEndId` para ignorar repetições. Veja também [como validar o x-webhook-signature](/docs/webhook/seguranca/webhook-signature-validation).

## Armadilhas

A maior fonte de bug na migração é o valor: na Woovi tudo é inteiro em centavos, enquanto a Transfeera usa reais com decimais em QR, cash-in, devolução, transferência e saldo.

| Tema                   | Transfeera                                                         | Woovi                                                           | O que fazer                                                                             |
| ---------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Valor                  | `52.11` (reais) na maioria; inteiro em `/charges` e Pix Automático | `5211` (centavos) em tudo                                       | Converter com `Math.round(reais * 100)`, nunca `reais * 100` direto                     |
| Idempotência           | `idempotency_key` por transferência; `txid` único no QR            | `correlationID` em tudo                                         | Usar o mesmo ID do seu pedido. Em cobrança, `?return_existing=true` devolve a existente |
| Repetição de pagamento | Duplicado → erro `TRA_20`                                          | `correlationID` repetido é recusado                             | Mesmo ID em todas as tentativas até o pagamento ter status final; ID novo = Pix novo    |
| Paginação              | `page` (começa em 0) + `page_size`                                 | `skip` + `limit` (até 100), resposta com `pageInfo.hasNextPage` | Próxima página = `skip + limit`                                                         |
| Erros                  | `{statusCode, error, errorCode, message, field}`                   | `400 {"error": "…"}`; `401` em `errors[]`                       | Logar o texto de `error`; não há catálogo de códigos como `TRA_*`                       |
| Documento do pagador   | `document` (string)                                                | `taxID` no envio; volta como `{taxID, type}`                    | Ajustar o parser                                                                        |
| Validade do QR         | `expiration` em segundos (padrão 86400)                            | `expiresIn` em segundos (mínimo 5 minutos)                      | Mesmo número, só renomear                                                               |
| Status da cobrança     | `REMOVIDA_PELO_USUARIO_RECEBEDOR`                                  | não há status "removida" na listagem                            | Após `DELETE`, trate a cobrança como cancelada do seu lado                              |

**Sandbox:** o pagamento de teste é feito com `GET https://api.woovi-sandbox.com/api/v1/testing?transactionID=<id>` ou pelo botão "Simular pagamento" no painel. No sandbox, use sempre o host `woovi-sandbox`.

**SDK Node:** `@woovi/node-sdk` vem apontado para produção. Para usar o sandbox, é preciso trocar a URL base.

## Checklist de migração

Teste tudo no sandbox da Woovi antes de ligar em produção: o cadastro é imediato e a conta vem com saldo de teste.

- [ ] Criar conta em `app.woovi-sandbox.com` e gerar um AppID do tipo API
- [ ] Trocar autenticação: remover token OAuth, mTLS e `User-Agent` obrigatório; enviar `Authorization: <AppID>`
- [ ] Converter todos os valores de reais para centavos (entrada e saída)
- [ ] Trocar `txid` / `integration_id` / `idempotency_key` por `correlationID`
- [ ] Criar cobrança, pagar com o simulador e conferir `brCode`, `status` e `transactionID`
- [ ] Cadastrar um webhook por evento e validar `x-webhook-signature` com a chave pública do sandbox
- [ ] Testar devolução parcial e o webhook de devolução
- [ ] Pedir ao suporte a liberação do envio de Pix e reescrever lotes como pares `payment` + `approve`
- [ ] Ajustar paginação (`skip`/`limit`) e o tratamento de erro (`{error}`)
- [ ] Em produção: gerar AppID novo, restringir por escopo e IP, cadastrar webhooks com a chave pública de produção
- [ ] Rodar as duas integrações em paralelo por um período, com cobranças novas na Woovi e cobranças antigas terminando na Transfeera

## Fontes

Consultadas em 05/11/2026.

**Transfeera:**

- [Endpoints e ambientes](https://docs.transfeera.dev/reference/endpoints)
- [Autenticação](https://docs.transfeera.dev/reference/post-authorization)
- [Cobrança imediata](https://docs.transfeera.dev/reference/post_pix-qrcode-collection-immediate)
- [Transferência em lote](https://docs.transfeera.dev/reference/post_batch-id-transfer)
- [Assinatura de webhook](https://docs.transfeera.dev/reference/recebimentos-verifica%C3%A7%C3%A3o-da-assinatura)
- [Erros e rate limit](https://docs.transfeera.dev/reference/erros)

**Woovi:**

- [Referência da API](/api)
- [Primeiros passos com a API](/docs/apis/api-getting-started)
