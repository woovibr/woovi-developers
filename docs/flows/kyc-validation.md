---
id: kyc-validation
title: Validação de KYC (CPF/CNPJ)
sidebar_label: Validação de KYC (CPF/CNPJ)
description: Validar um CPF ou CNPJ contra sinais de fraude, disputa, sanções, PEP e processos, e receber um veredito
unlisted: true
sidebar_class_name: sidebar-hidden
---

# Validação de KYC (CPF/CNPJ)

A API de Validação de KYC recebe um CPF ou CNPJ, consulta os sinais de risco disponíveis e devolve um **veredito** — aprovado ou reprovado, com o nível de risco e os sinais que levaram à decisão.

A diferença em relação às [Estatísticas de Pessoa](/docs/flows/person-statistic) é o que você recebe: lá vêm os números crus do DICT para você interpretar; aqui vem a decisão já tomada, com os sinais agregados numa taxonomia estável.

## Visão Geral

A consulta é **assíncrona**: a criação responde `201` com `status: PROCESSING` e o veredito fica pronto em seguida (normalmente em menos de um segundo). Você lê o resultado de duas formas:

- consultando `GET /api/v1/kyc-validation/{correlationID}`; ou
- assinando os webhooks `KYC_VALIDATION_COMPLETED` e `KYC_VALIDATION_FAILED`.

Cada validação é **cobrada** como `KYC_VALIDATION_FEE`, com o valor configurado na sua conta. A cobrança acontece **antes** de a consulta ser enfileirada: se a chamada respondeu `201`, ela já foi cobrada.

## API Endpoints

Criar uma validação:

```
POST /api/v1/kyc-validation/taxid
```

Consultar o resultado:

```
GET /api/v1/kyc-validation/{correlationID}
```

**📖 [Ver documentação completa da API](https://developers.woovi.com/en/api#tag/kyc)**

## Pré-requisitos

| Requisito | Onde |
|-----------|------|
| Feature `KYC_VALIDATION` habilitada | na sua empresa (fale com o time Woovi) |
| Escopos `KYC_VALIDATION_POST` e `KYC_VALIDATION_GET` | na sua aplicação |
| Conta bancária aberta vinculada à aplicação | é ela que paga a validação |
| Taxa configurada | `kycValidationFeeSettings` na conta |

## Parâmetros da Requisição

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `taxId` | string | Sim | CPF (11 dígitos) ou CNPJ (14 dígitos). Aceita máscara — tudo que não é dígito é descartado |
| `correlationID` | string | Sim | Seu identificador único da validação (1 a 128 caracteres). É a chave de idempotência e é por ele que você lê o resultado |

## Idempotência e cobrança

O `correlationID` é a chave de idempotência:

- **`correlationID` novo** → nova validação, `201`, **cobrada**.
- **`correlationID` já usado** → devolve a validação original, `200`, **sem cobrar de novo**.

Uma tentativa depois de um `FAILED` exige um `correlationID` novo — e é uma nova cobrança.

## Estrutura da Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `correlationID` | string | O identificador que você enviou |
| `taxId` | string | O CPF/CNPJ consultado, só dígitos |
| `status` | string | `PROCESSING`, `COMPLETED` ou `FAILED` |
| `result` | string \| null | `APPROVED` ou `REJECTED`. Null enquanto `PROCESSING` e quando `FAILED` |
| `riskLevel` | string \| null | `NONE`, `LOW`, `MEDIUM` ou `HIGH`. Null enquanto `PROCESSING` e quando `FAILED` |
| `reasons` | array | Sinais que sustentam o veredito. Vazio enquanto `PROCESSING`, e vazio num `APPROVED` sem nenhum sinal |
| `createdAt` | string | Data de criação da validação |
| `completedAt` | string \| null | Data da conclusão. Null enquanto `PROCESSING` |

### Status

| Status | Significado |
|--------|-------------|
| `PROCESSING` | Aceita e enfileirada. Já foi cobrada |
| `COMPLETED` | Consulta concluída, `result` e `riskLevel` preenchidos |
| `FAILED` | Todas as fontes estavam indisponíveis, então não houve veredito. A validação **foi cobrada**; para tentar de novo use um `correlationID` novo |

### Sinais (`reasons`)

Os sinais descrevem **o que** foi observado, nunca **onde** — a lista é estável mesmo que as fontes mudem.

| Sinal | Significado |
|-------|-------------|
| `FRAUD_HISTORY` | Marcações de fraude confirmadas contra o CPF/CNPJ por outras instituições |
| `DISPUTE_HISTORY` | Disputas e reclamações abertas contra o CPF/CNPJ, ponderadas pelo volume dele |
| `SANCTIONS` | Presença em listas de sanções |
| `PEP` | Pessoa politicamente exposta |
| `CRIMINAL_LAWSUITS` | Processos criminais, com peso maior para assuntos de fraude financeira |
| `EXCESSIVE_LAWSUITS` | Número ou valor de processos civis fora do normal |

## Exemplo de Requisição

### Criar a validação

```bash
curl -X POST "https://api.woovi.com/api/v1/kyc-validation/taxid" \
  -H "Authorization: SEU_APP_ID_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "taxId": "02.916.265/0001-60",
    "correlationID": "my-unique-id"
  }'
```

```json
{
  "correlationID": "my-unique-id",
  "taxId": "02916265000160",
  "status": "PROCESSING",
  "result": null,
  "riskLevel": null,
  "reasons": [],
  "createdAt": "2026-08-24T14:00:06.386Z",
  "completedAt": null
}
```

### Ler o resultado

```bash
curl -X GET "https://api.woovi.com/api/v1/kyc-validation/my-unique-id" \
  -H "Authorization: SEU_APP_ID_AQUI"
```

```json
{
  "correlationID": "my-unique-id",
  "taxId": "02916265000160",
  "status": "COMPLETED",
  "result": "REJECTED",
  "riskLevel": "HIGH",
  "reasons": ["FRAUD_HISTORY", "DISPUTE_HISTORY"],
  "createdAt": "2026-08-24T14:00:06.386Z",
  "completedAt": "2026-08-24T14:00:06.462Z"
}
```

Uma validação sem sinal nenhum:

```json
{
  "correlationID": "my-other-id",
  "taxId": "00000000191",
  "status": "COMPLETED",
  "result": "APPROVED",
  "riskLevel": "LOW",
  "reasons": [],
  "createdAt": "2026-08-24T14:00:41.447Z",
  "completedAt": "2026-08-24T14:00:41.489Z"
}
```

## Webhooks

Em vez de ficar consultando o `GET`, assine os eventos:

| Evento | Quando dispara |
|--------|----------------|
| `KYC_VALIDATION_COMPLETED` | A validação concluiu com veredito |
| `KYC_VALIDATION_FAILED` | Nenhuma fonte respondeu, sem veredito |

O corpo do webhook traz o mesmo objeto `kycValidation` da resposta do `GET`.

## Tratamento de Erros

| HTTP | `errorCode` | O que aconteceu |
|------|-------------|-----------------|
| 400 | `KYC_VALIDATION_INVALID_BODY` | `taxId` sem 11 ou 14 dígitos, ou campo obrigatório ausente |
| 400 | `KYC_VALIDATION_BILLING_FAILED` | A taxa não pôde ser cobrada (taxa não configurada, saldo insuficiente). Nada foi consultado nem cobrado |
| 401 | — | `Authorization` ausente ou inválido (resposta: `{"data":null,"errors":[{"message":"Invalid appID"}]}`) |
| 403 | `KYC_VALIDATION_FEATURE_NOT_ENABLED` | A empresa não tem a feature `KYC_VALIDATION` |
| 403 | `KYC_VALIDATION_ACCOUNT_NOT_AVAILABLE` | A aplicação não está ligada a uma conta aberta, então não há como cobrar |
| 404 | `KYC_VALIDATION_NOT_FOUND` | Não existe validação com esse `correlationID` na sua empresa |
| 502 | `KYC_VALIDATION_BILLING_UNAVAILABLE` | O serviço de cobrança não respondeu. Nada foi cobrado — tente de novo com o **mesmo** `correlationID` |

## Casos de Uso

- **Onboarding**: reprovar ou mandar para análise manual um cadastro cujo CPF/CNPJ já carrega histórico de fraude
- **Antes de liberar limite**: checar o CNPJ do cliente antes de aumentar limite ou liberar um produto novo
- **Contraparte**: avaliar quem vai receber, e não só quem paga
- **Conformidade**: registrar a consulta e o veredito como parte do processo de KYC/PLD

## Diferença entre Validação de KYC e Estatísticas de Fraude

| Aspecto | Validação de KYC | [Estatísticas de Pessoa](/docs/flows/person-statistic) / [de Chave PIX](/docs/flows/fraud-statistic) |
|---------|------------------|------------------------------------------------|
| O que devolve | Veredito (`APPROVED`/`REJECTED`) + nível de risco + sinais | Números crus (liquidações, marcações, notificações) |
| Quem decide | Woovi, com limiares versionados | Você, a partir dos números |
| Fontes | Fraude, disputa, sanções, PEP e processos | DICT |
| Forma | Assíncrona (`POST` + `GET`/webhook) | Síncrona (`GET`) |
| Identificador | CPF ou CNPJ | CPF/CNPJ ou chave PIX |
| Idempotência | Por `correlationID` | Não se aplica |
