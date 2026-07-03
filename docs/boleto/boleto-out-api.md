---
id: boleto-out-api
title: Como pagar um boleto via API
sidebar_label: Pagar boleto via API
tags:
- boleto
- payment
- api
---

# Como pagar um boleto via API

## Resumo

Este guia mostra como **pagar um boleto** usando o saldo da sua conta Woovi
através da API (fluxo *Boleto OUT*). O fluxo tem três passos:

1. **Validar** o boleto pelo código de barras (`POST /api/v1/boleto/validate`) —
   confirma o valor, o vencimento e o beneficiário antes de pagar.
2. **Criar o pagamento** (`POST /api/v1/payment`) — gera uma solicitação de
   pagamento (Movement) com status `CREATED`. Enviando `autoApprove: true`
   **nesta mesma chamada**, o pagamento já sai aprovado.
3. **Aprovar** o pagamento (`POST /api/v1/payment/approve`) — só é necessário
   quando você **não** usou `autoApprove` na criação.

:::note Valores em centavos
Todos os valores (`value`, `totalValue`) são expressos em **centavos**
(`300` = R$ 3,00).
:::

---

## Pré-requisitos

- Uma **[API MASTER](../payment/payment-how-to-request-access.md)** (header
  `Authorization: {APP_ID}`).
- A funcionalidade de **pagamentos (PIX OUT)** habilitada na conta. Se ainda não
  tiver, solicite pelo chat da plataforma —
  veja [Como solicitar acesso a pagamentos](../payment/payment-how-to-request-access.md).
- O **pagamento de boletos (Boleto OUT)** habilitado na conta — precisa ser
  solicitado ao suporte. Veja [Ativação](#ativação).

---

## 1. Validar o boleto

Antes de pagar, valide o código de barras para confirmar valor, vencimento e
beneficiário. Envie **apenas** o `barcode` (com 44, 47 ou 48 dígitos):

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/boleto/validate \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "barcode": "34195148200000003001095517077320772982609000"
  }'
```

A resposta traz os dados do boleto:

```json
{
  "boleto": {
    "barcode": "34195148200000003001095517077320772982609000",
    "expiresDate": "2026-06-27T02:59:59.999Z",
    "totalValue": 300,
    "issuingEntity": {
      "code": "341",
      "name": "ITAU UNIBANCO S/A"
    },
    "finalBeneficiary": {
      "name": "WOOVI",
      "taxID": "44720743000101"
    }
  }
}
```

| Campo | Descrição |
| --- | --- |
| `barcode` | Código de barras normalizado do boleto |
| `digitable` | Linha digitável (quando o provedor retorna) |
| `expiresDate` | Data de vencimento (ISO 8601) |
| `totalValue` | Valor total a pagar, **em centavos** |
| `issuingEntity` | Instituição emissora (`code`, `name`) |
| `finalBeneficiary` | Beneficiário final (`name`, `taxID`) |

Se o código for inválido, a API responde `400` com o detalhe do erro.

---

## 2. Criar o pagamento

Com o boleto validado, crie o pagamento no endpoint
[Create Payment request](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment/post>).
Para pagar um boleto, use `type: "BOLETO"` e informe o **`boletoBarcode`**:

| Campo | Obrigatório | Descrição |
| --- | --- | --- |
| `type` | sim | `"BOLETO"` para pagamento de boleto |
| `boletoBarcode` | sim | Código de barras do boleto (44/47/48 dígitos) |
| `correlationID` | sim | Identificador único **seu** para o pagamento |
| `comment` | não | Comentário livre |
| `sourceAccountId` | não | Conta de origem; se omitido, usa a conta padrão. Veja [Como obter o accountId](../payment/payment-how-to-get-account-id.md) |
| `autoApprove` | não | `true` cria **e aprova** na mesma chamada (veja passo 3) |

:::note O valor vem do boleto validado
Diferente do PIX manual, você **não** envia o `value` nem o beneficiário no corpo
do pagamento de boleto — eles são resolvidos a partir do código de barras
validado. Basta o `boletoBarcode`.
:::

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/payment \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "BOLETO",
    "boletoBarcode": "34195148200000003001095517077320772982609000",
    "comment": "teste boleto out",
    "correlationID": "boleto-out-teste-001"
  }'
```

A resposta traz o pagamento criado com status **`CREATED`** e o objeto `boleto`
com os dados resolvidos na validação:

```json
{
  "payment": {
    "value": 300,
    "status": "CREATED",
    "comment": "teste boleto out",
    "correlationID": "boleto-out-teste-001",
    "sourceAccountId": "6a0382bc2dd3cd1010cbc72d",
    "boleto": {
      "barcode": "34195148200000003001095517077320772982609000",
      "expiresDate": "2026-06-27T02:59:59.999Z",
      "totalValue": 300,
      "finalBeneficiary": {
        "name": "WOOVI",
        "taxID": "44720743000101"
      },
      "issuingEntity": {
        "code": "341",
        "name": "ITAU UNIBANCO S/A"
      }
    }
  }
}
```

O pagamento nasce em `CREATED` e **ainda não foi enviado** — é preciso aprová-lo.

### (Opcional) Criar e aprovar na mesma chamada com `autoApprove`

O `autoApprove` é uma flag **da criação** (`POST /api/v1/payment`). Enviando
`autoApprove: true` no corpo, o pagamento é criado **e aprovado** na mesma
requisição, dispensando o passo 3. Está disponível para todas as contas — basta
enviar a flag.

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/payment \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "BOLETO",
    "boletoBarcode": "34195148200000003001095517077320772982609000",
    "comment": "teste boleto out",
    "correlationID": "boleto-out-teste-001",
    "autoApprove": true
  }'
```

A resposta traz o `payment` com status `APPROVED` e você **não** precisa chamar o
`/payment/approve`.

---

## 3. Aprovar o pagamento

:::note Só quando não usou `autoApprove`
Se você criou o pagamento com `autoApprove: true`, ele já está aprovado — pule
este passo. O endpoint `/api/v1/payment/approve` **não** aceita `autoApprove`; a
aprovação automática é sempre feita na criação.
:::

Quando o pagamento foi criado sem `autoApprove`, ele fica em `CREATED` e você o
aprova em uma segunda chamada, enviando o `correlationID`
([Approve a Payment Request](<https://developers.woovi.com/api#tag/payment-(request-access)/paths/~1api~1v1~1payment~1approve/post>)).

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/payment/approve \
  --header 'Authorization: {APP_ID}' \
  --header 'Content-Type: application/json' \
  --data '{
    "correlationID": "boleto-out-teste-001"
  }'
```

O endpoint rejeita a aprovação se o pagamento já estiver `CONFIRMED`
(`400 "Payment already confirmed"`) ou `DENIED` (`400 "Payment denied"`).

:::warning Saldo insuficiente
Ao aprovar sem saldo suficiente, a chamada retorna `400`:
`{ "error": "You do not have enough balance to make this payment" }`.
:::

---

## Máquina de status do pagamento

```
CREATED ──aprovação──▶ APPROVED ──▶ PROCESSING ──▶ CONFIRMED
                                        │
                                        └──falha──▶ FAILED
```

| `status` | Significado |
| --- | --- |
| `CREATED` | Pagamento criado, aguardando aprovação |
| `APPROVED` | Aprovado; pagamento do boleto disparado ao provedor |
| `PROCESSING` | Em processamento no provedor |
| `CONFIRMED` | Boleto **pago** (estado final) |
| `FAILED` | Falha no processamento (estado final) |

Como o pagamento é processado de forma assíncrona, acompanhe o status final pelo
webhook de movimentação ou consultando
`GET /api/v1/payment/{correlationID}`.

---

## Ativação

O pagamento de boleto **não é self-service** — precisa ser habilitado na sua
conta pela Woovi.

| Recurso | Para quê | Como obter |
| --- | --- | --- |
| Pagamentos (PIX OUT) | Criar pagamentos via API | [Solicitar acesso a pagamentos](../payment/payment-how-to-request-access.md) |
| Pagamento de boletos (Boleto OUT) | Pagar boletos via API | Solicite ao suporte |

:::info
Para habilitar o pagamento de boletos, entre em contato com o suporte da Woovi
pelo chat da plataforma. Veja também
[Como criar e aprovar um pagamento em uma única chamada](../payment/payment-how-to-auto-approve.md).
:::
