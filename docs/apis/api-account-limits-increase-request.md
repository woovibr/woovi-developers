---
id: api-account-limits-increase-request
title: Como solicitar aumento de limite pela API
tags:
  - api
  - account-limits
  - limits
  - baas
---

Aumentar o limite de uma conta deixou de ser um pedido manual pelo console: dá para abrir a
solicitação pela API, anexar o comprovante que a justifica e acompanhar até a decisão.

São **dois endpoints**, e a ordem importa:

1. **`POST /api/v1/files`** — sobe o comprovante e devolve um `file.id`.
2. **`POST /api/v1/limits/request`** — abre o pedido mandando esse `file.id`.

Depois é só fazer _polling_ no `GET /api/v1/limits/request/{limitRequestId}` até o `status`
sair de `IN_REVIEW`.

:::caution O documento **não** vai no corpo do pedido
Um erro comum é tentar mandar o arquivo (ou uma URL dele) direto no `POST /api/v1/limits/request`.
Não funciona: o pedido só aceita o `fileId` de um arquivo que já está na Woovi. Suba o arquivo
primeiro.
:::

## Requisitos

Seu AppID precisa de três escopos ([como adicionar escopos](./api-scopes.md)):

| Escopo | Para quê |
| --- | --- |
| `FILE_POST` | subir o comprovante no endpoint de arquivos |
| `ACCOUNT_LIMITS_REQUEST_POST` | abrir o pedido de aumento |
| `ACCOUNT_LIMITS_GET` | consultar o limite atual e fazer o _polling_ do pedido |

## 1. Subir o comprovante

O arquivo vai como `multipart/form-data` no campo `file`, com **`purpose=ACCOUNT_LIMIT_REQUEST`**.
Aceita `application/pdf`, `image/png`, `image/jpeg` e `image/webp`, até 10 MiB por arquivo
(detalhes em [Como fazer upload de um arquivo](../arquivos/upload-de-arquivo.md)).

```bash
curl -X POST "https://api.woovi.com/api/v1/files" \
  -H "Authorization: <appID>" \
  -F "file=@faturamento.pdf" \
  -F "purpose=ACCOUNT_LIMIT_REQUEST"
```

```json
{
  "file": {
    "id": "68c7d0a1f0b2c3d4e5f60718",
    "correlationID": "3fa17751-d522-426d-8425-80a3ef65d622",
    "purpose": "ACCOUNT_LIMIT_REQUEST",
    "fileName": "faturamento.pdf",
    "contentType": "application/pdf",
    "size": 20480,
    "url": "https://woovi-files.s3.amazonaws.com/...",
    "urlExpiresAt": "2026-09-03T18:04:45.987Z",
    "createdAt": "2026-09-03T17:49:45.968Z"
  }
}
```

Guarde o **`file.id`** — é ele que vai no passo 2.

:::tip
O `purpose` importa. Um arquivo subido com outro `purpose` (por exemplo `DISPUTE_EVIDENCE`)
**não** é aceito no pedido de limite. Se isso acontecer, suba de novo com o `purpose` certo;
não é preciso apagar o primeiro.
:::

## 2. Consultar o limite atual

O pedido usa o mesmo vocabulário de campos do
[`GET /api/v1/limits/{accountId}`](../account-limits/api-limits-get.mdx), então o caminho
natural é ler o limite atual, subir os campos que você precisa e mandar de volta.

```bash
curl "https://api.woovi.com/api/v1/limits/6842ef6d05629d74e34d05cd" \
  -H "Authorization: <appID>"
```

```json
{ "limits": { "pixDayLimit": 4000000, "pixNightLimit": 100000, "...": "..." } }
```

## 3. Abrir o pedido com o `fileId`

```bash
curl -X POST "https://api.woovi.com/api/v1/limits/request" \
  -H "Authorization: <appID>" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "companyBankAccountId": "6842ef6d05629d74e34d05cd",
    "pixDayLimit": 5000000,
    "pixNightLimit": 200000,
    "documents": [{ "fileId": "68c7d0a1f0b2c3d4e5f60718" }],
    "description": "faturamento dos ultimos 12 meses"
  }'
```

| Campo | Obrigatório | Descrição |
| --- | --- | --- |
| `companyBankAccountId` | Sim | A conta cujo limite deve subir. |
| `pixDayLimit` / `pixNightLimit` | Sim | Limite diurno e noturno pedidos, **em centavos**. |
| `pixOut*` / `pixIn*` por titularidade | Não | Os oito campos por titularidade, com os mesmos nomes do `GET` de limites. |
| `documents` | Sim | De 1 a 10 itens, cada um com o `fileId` do passo 1. |
| `description` | Não | Texto livre para o analista que vai revisar. |
| `limitRequestReason` | Não | Motivo do pedido. |

Resposta `201`:

```json
{
  "limitRequest": {
    "id": "68c7d0a1f0b2c3d4e5f6071a",
    "companyBankAccountId": "6842ef6d05629d74e34d05cd",
    "status": "IN_REVIEW",
    "requestedLimits": { "pixDayLimit": 5000000, "pixNightLimit": 200000 },
    "documents": [{ "fileName": "faturamento.pdf", "contentType": "application/pdf" }],
    "description": "faturamento dos ultimos 12 meses",
    "createdAt": "2026-09-03T17:49:59.204Z",
    "updatedAt": "2026-09-03T17:49:59.204Z"
  }
}
```

Guarde o **`limitRequest.id`** para acompanhar o pedido.

### Regras que o pedido precisa respeitar

- Nenhum campo pode vir **abaixo** do valor atual da conta.
- Pelo menos um campo precisa vir **acima** do atual — um pedido que não sobe nada é recusado.
- Só pode existir **um pedido `IN_REVIEW` por conta** de cada vez.

## 4. Acompanhar até a decisão

```bash
curl "https://api.woovi.com/api/v1/limits/request/68c7d0a1f0b2c3d4e5f6071a" \
  -H "Authorization: <appID>"
```

O `status` fica em `IN_REVIEW` enquanto a Woovi analisa, e depois vira:

- **`APPROVED`** — o campo `approvedLimits` traz o que foi de fato concedido, que **pode ser
  menor do que você pediu**. Os limites efetivos da conta mudam no mesmo momento, então o
  `GET /api/v1/limits/{accountId}` já reflete os novos valores.
- **`REJECTED`** — nada mudou na conta. Depois que o pedido é decidido, você pode abrir um novo.

```json
{
  "limitRequest": {
    "id": "68c7d0a1f0b2c3d4e5f6071a",
    "status": "APPROVED",
    "requestedLimits": { "pixDayLimit": 5000000, "pixNightLimit": 200000 },
    "approvedLimits": { "pixDayLimit": 4500000, "pixNightLimit": 200000 },
    "documents": [{ "fileName": "faturamento.pdf", "contentType": "application/pdf" }],
    "createdAt": "2026-09-03T17:49:59.204Z",
    "updatedAt": "2026-09-03T19:12:03.881Z"
  }
}
```

:::info
`approvedLimits` **não aparece** enquanto o pedido está `IN_REVIEW`. A ausência do campo é a
forma de saber que ainda não há decisão — não trate `approvedLimits` vazio como aprovação.
:::

Para listar todos os pedidos da sua empresa, do mais novo para o mais antigo, use
`GET /api/v1/limits/request` (aceita `limit`, máximo 100, e `skip`).

## Erros

| Status | Quando acontece | Corpo |
| --- | --- | --- |
| `400` | O `fileId` não existe, é de **outra empresa**, ou foi subido com outro `purpose` | `{"error":"Document 68c7…: File not found"}` |
| `400` | Algum limite veio abaixo do valor atual | `{"error":"Requested limit cannot be less than the current value"}` |
| `400` | Nenhum limite é maior que o atual | `{"error":"At least one limit must be greater than the current value"}` |
| `400` | Nenhum documento enviado | `{"error":"documents At least one document is required"}` |
| `403` | O AppID não tem o escopo `ACCOUNT_LIMITS_REQUEST_POST` | `{"error":"Application does not have required scope: ACCOUNT_LIMITS_REQUEST_POST"}` |
| `404` | A conta não existe **ou é de outra empresa** | `{"error":"Account not found"}` |
| `409` | A conta já tem um pedido em análise | `{"error":"Limit request already in review"}` |

:::caution Isolamento entre empresas
Tanto a conta quanto o arquivo são sempre filtrados pela empresa do seu AppID. Uma conta de
outra empresa responde `404` (nunca um `403`), e um `fileId` de outra empresa responde `400`
`File not found` — o id sozinho nunca confirma que o recurso existe.
:::

:::tip Referência completa
Schemas, parâmetros e exemplos interativos na
[API Reference, em **Account Limits**](/api#tag/account-limits).
:::
