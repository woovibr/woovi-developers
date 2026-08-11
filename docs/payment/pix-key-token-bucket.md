---
id: pix-key-token-bucket
sidebar_position: 4
title: "Token Bucket: limite de consultas de chave Pix"
sidebar_label: Token Bucket (limite de consultas)
tags:
  - payment
  - api
---

Toda consulta de chave Pix passa pelo DICT, o diretório de chaves do Banco Central. O Bacen limita quantas consultas cada participante pode fazer e penaliza consultas a chaves inexistentes — é assim que ele impede varredura de dados de titulares.

Para distribuir essa cota entre as contas, a Woovi usa um **token bucket** (balde de fichas): sua conta tem um saldo de tokens, cada consulta gasta tokens, e o balde é reabastecido continuamente.

Esse limite vale para a [Verificação de Chave Pix](./check-pix-key.md) e para qualquer chamada que precise resolver uma chave no DICT, como a [criação de um pagamento por chave Pix](./payment-how-to-use-api-to-create.mdx).

:::info
O token bucket não é uma invenção da Woovi: é a política antiscan do próprio Banco Central para a API do DICT, repassada para cada conta. Para entender o algoritmo, as políticas e os números do Bacen, veja [Token Bucket e o antiscan do DICT](../concepts/token-bucket.md).
:::

## Como funciona

- O balde é **por conta (taxID)**, não por AppID. Todas as suas aplicações e chaves de API compartilham o mesmo saldo.
- Cada consulta bem-sucedida gasta pouco; cada consulta que falha no DICT gasta muito.
- O balde é reabastecido a uma taxa fixa por minuto, até um teto máximo.
- Os valores padrão são **500 tokens de teto** e **20 tokens por minuto**, mas a sua conta pode ter limites diferentes. Nunca fixe esses números no código — leia sempre do endpoint `/api/v1/pix-keys/tokens`.

## Quanto custa cada consulta

| Resultado da consulta | Tokens |
| --- | --- |
| Chave encontrada no DICT | **-1** |
| Chave não encontrada (`404 PIX_KEY_INFO_NOT_FOUND`) | **-20** |
| Chave recusada pelo DICT como inválida | **-20** |
| `429` vindo do próprio DICT | **-20** |
| Chave que já está em cache da Woovi | **0** |
| Chave de uma conta Woovi (transferência interna) | **0** |

O que pesa não é o volume de consultas, e sim a **taxa de erro**: 500 consultas válidas cabem no balde padrão, mas 25 consultas a chaves inexistentes já o esvaziam.

### Cache reduz o custo

- Uma chave encontrada fica em cache pelo tempo que o próprio DICT indicar. Consultar a mesma chave de novo dentro dessa janela **não gasta token**.
- Uma chave não encontrada fica em cache por 5 minutos. Repetir a mesma chave inexistente dentro desses 5 minutos **não cobra os 20 tokens de novo** — mas cada chave inexistente diferente cobra.

### Pagar devolve tokens

Quando você consulta uma chave e **efetivamente envia o pagamento** para ela, sua conta recebe **+2 tokens de volta** no momento da aprovação.

É a mesma lógica do Bacen: consulta que vira pagamento é uso legítimo e é creditada de volta; consulta que nunca vira pagamento é o padrão de quem está varrendo o diretório ([entenda o porquê](../concepts/token-bucket.md)). Na prática, um fluxo saudável (consultar para pagar) gasta menos do que 1 token por operação.

## Quando você é bloqueado

O bloqueio acontece **antes de o saldo chegar a zero**: se o balde tiver **menos de 20 tokens**, a consulta é recusada sem nem chegar ao DICT.

```json
{
  "error": "You tried to consult many Pix keys that do not exist.",
  "errorCode": "TOO_MANY_REQUESTS"
}
```

A resposta vem com status `429`. Com a taxa padrão de 20 tokens por minuto, sair do zero e voltar a poder consultar leva cerca de **1 minuto**.

:::caution
Pagamentos por QR Code / Copia e Cola não gastam tokens, mas **também são bloqueados** quando o balde está abaixo do mínimo. Um balde esvaziado por consultas de chave inexistente derruba o seu fluxo de pagamento inteiro.
:::

## Consultando seu saldo

```bash
curl -X GET "https://api.woovi.com/api/v1/pix-keys/tokens" \
  -H "Authorization: {APP_ID}"
```

```json
{
  "tokens": 480,
  "nextRefresh": "2026-01-01T12:01:00.000Z",
  "maxTokens": 500,
  "tokensAfterRefresh": 500,
  "refreshRate": 20
}
```

- `tokens` — saldo atual, já com a recarga acumulada desde a última operação.
- `maxTokens` — teto do balde da sua conta.
- `refreshRate` — quantos tokens sua conta recupera por minuto.
- `nextRefresh` — quando entra a próxima recarga.
- `tokensAfterRefresh` — saldo previsto depois dessa recarga.

Você pode acessar [aqui](https://developers.woovi.com/api#tag/pixKey/paths/~1api~1v1~1pix-keys~1tokens/get) a documentação referente a esse _endpoint_.

:::info
A recarga é calculada no momento da consulta, a partir do tempo decorrido. Você não perde tokens por ficar sem chamar a API — o saldo já vem atualizado.
:::

## Histórico de consumo

Cada movimentação do balde é registrada e pode ser auditada:

```bash
curl -X GET "https://api.woovi.com/api/v1/pix-keys/tokens/logs?limit=50" \
  -H "Authorization: {APP_ID}"
```

```json
{
  "logs": [
    {
      "operation": "REMOVE",
      "reason": "NOT_FOUND_PIX_KEY",
      "tokens": 20,
      "tokensBefore": 100,
      "tokensAfter": 80,
      "endToEndId": "E12345678202601011200abcdefghijk",
      "pixKey": "00000000191",
      "createdAt": "2026-01-01T10:30:00.000Z"
    },
    {
      "operation": "REFILL",
      "reason": "REFILL",
      "tokens": 20,
      "tokensBefore": 80,
      "tokensAfter": 100,
      "createdAt": "2026-01-01T10:31:00.000Z"
    }
  ],
  "pageInfo": {
    "skip": 0,
    "limit": 50,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

Parâmetros de query aceitos: `skip`, `limit` e `companyBankAccount`.

Motivos possíveis em `reason`:

| `reason` | `operation` | O que aconteceu |
| --- | --- | --- |
| `DICT_LOOKUP` | `REMOVE` | Consulta bem-sucedida no DICT |
| `NOT_FOUND_PIX_KEY` | `REMOVE` | Chave não existe no DICT |
| `INVALID_PIX_KEY` | `REMOVE` | Chave recusada como inválida pelo DICT |
| `TOO_MANY_REQUESTS` | `REMOVE` | O DICT respondeu `429` |
| `REFILL` | `REFILL` | Recarga por tempo decorrido |
| `CACHE_HIT_REFUND` | `ADD` | Estorno de 2 tokens: pagamento enviado para chave que estava em cache |
| `DICT_MESSAGE_REFUND` | `ADD` | Estorno de 2 tokens: pagamento enviado para chave já consultada no DICT |
| `SUBACCOUNT_NOT_FOUND_REFUND` | `ADD` | Estorno em fluxo de subconta |

Use esse histórico para descobrir **qual chave** está drenando seu balde: filtre por `reason: NOT_FOUND_PIX_KEY` e olhe o campo `pixKey`.

Você pode acessar [aqui](https://developers.woovi.com/api#tag/pixKey/paths/~1api~1v1~1pix-keys~1tokens~1logs/get) a documentação referente a esse _endpoint_.

## Boas práticas

1. **Valide o formato da chave antes de chamar a API.** CPF, CNPJ, e-mail, telefone em E.164 ou UUID de 36 caracteres. Formato errado nem chega ao DICT, mas chave bem formatada e inexistente custa 20 tokens.
2. **Nunca faça retry de um `404`.** A chave não passa a existir na segunda tentativa, e cada nova chave inexistente custa 20 tokens.
3. **Guarde o `pixKeyEndToEndId`** retornado na verificação e reutilize-o na criação do pagamento, em vez de consultar a mesma chave duas vezes.
4. **Não valide chave digitada a cada tecla.** Consulte só quando o usuário terminar de digitar.
5. **Cheque o saldo antes de processar lotes.** Antes de um lote de N pagamentos, chame `/pix-keys/tokens` e compare com o seu volume.
6. **Trate o `429` com espera, não com retry imediato.** Use `nextRefresh` do endpoint de tokens para saber quando voltar.
7. **Monitore os logs.** Um pico de `NOT_FOUND_PIX_KEY` normalmente indica base de cadastro desatualizada ou digitação livre sem validação.

## Requisitos de acesso

Os endpoints `/pix-keys/tokens` e `/pix-keys/tokens/logs` exigem uma conta Woovi com a funcionalidade de verificação de chave Pix liberada. Sem isso a resposta é `403`:

```json
{
  "error": "Your account does not have the permission to use this endpoint"
}
```

Veja [Como Solicitar Acesso a Pagamentos?](./payment-how-to-request-access.md).

## Prompt para IA

Copie o trecho abaixo numa IA de coding (Claude / Cursor / Gemini / ChatGPT) pra tratar o rate limit no seu app:

> Implemente controle de rate limit para consultas de chave Pix na API da Woovi.
>
> **Contexto**: consultas de chave Pix consomem um "token bucket" por conta. Consulta bem-sucedida custa 1 token; chave não encontrada, chave inválida ou `429` do DICT custam 20 tokens. Consultas atendidas por cache custam 0. Quando o saldo fica abaixo de 20 tokens, a API responde `429` com `errorCode: TOO_MANY_REQUESTS`.
>
> **Endpoint de saldo**: `GET https://api.woovi.com/api/v1/pix-keys/tokens` com header `Authorization: <APP_ID>`, resposta `{ "tokens": number, "maxTokens": number, "refreshRate": number, "nextRefresh": string, "tokensAfterRefresh": number }`.
>
> **Endpoint de histórico**: `GET https://api.woovi.com/api/v1/pix-keys/tokens/logs?skip=0&limit=50`, resposta `{ logs: [{ operation, reason, tokens, tokensBefore, tokensAfter, endToEndId, pixKey, createdAt }], pageInfo }`.
>
> **Requisitos**:
> - Valide o formato da chave localmente (CPF, CNPJ, e-mail, telefone E.164, UUID de 36 chars) antes de qualquer chamada.
> - Nunca faça retry de `404` (chave não encontrada) — cada tentativa custa 20 tokens.
> - Em `429`, não faça retry imediato: consulte `/pix-keys/tokens` e espere até `nextRefresh`.
> - Antes de processar um lote, cheque `tokens` e não dispare mais consultas do que o saldo suporta.
> - Faça cache local do resultado da consulta e reutilize o `pixKeyEndToEndId` na criação do pagamento.
> - Não fixe `maxTokens` nem `refreshRate` no código: leia sempre da API, pois variam por conta.
