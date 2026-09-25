---
id: ted-api-getting-started
title: Primeiros passos com a API de TED
sidebar_label: Primeiros passos
sidebar_position: 1
tags:
  - api
  - ted
---

# Primeiros passos com a API de TED

A API de TED permite **enviar** uma TED a partir de uma conta da sua empresa,
**devolver** uma TED recebida, **consultar** uma TED e **listar** as TEDs
enviadas e recebidas. O resultado de cada TED chega por
[webhook](./ted-webhooks.md).

| Endpoint | O que faz | Scope |
| --- | --- | --- |
| [`POST /api/v1/ted`](./ted-send-api.mdx) | Envia uma TED | `TED_POST` |
| [`POST /api/v1/ted/{correlationID}/refund`](./ted-refund-api.mdx) | Devolve uma TED recebida | `TED_REFUND_POST` |
| [`GET /api/v1/ted/{correlationID}`](./ted-get-api.md#consultar-uma-ted) | Consulta uma TED | `TED_GET` |
| [`GET /api/v1/ted`](./ted-get-api.md#listar-teds) | Lista as TEDs | `TED_GET_LIST` |

:::tip Referência completa
Para o schema, parâmetros e exemplos interativos, veja a
[API Reference](/api#tag/ted).
:::

## A TED é assíncrona

Quem liquida uma TED é o BACEN, pelo STR. Por isso, a resposta de
`POST /api/v1/ted` diz que a TED foi **aceita para processamento**, e não que o
dinheiro chegou. Normalmente ela volta com `status: PROCESSING`.

O resultado chega depois, por webhook:

- `TED_OUT_CONFIRMED`: a TED foi liquidada no BACEN.
- `TED_OUT_REJECTED`: a TED não foi liquidada, o débito foi estornado e o saldo
  voltou para a conta.

Não trate a resposta do `POST` como pagamento concluído. Espere o webhook ou
consulte a TED. Os caminhos possíveis e o evento de cada um estão em
[Ciclo de vida de uma TED](./ted-lifecycle.md).

## Pré-requisitos

- Uma **chave de API** (AppID) da sua empresa. Veja
  [Primeiros passos com a API](../apis/api-getting-started.md).
- A funcionalidade **`TED`** habilitada na empresa. Sem ela, todos os endpoints
  respondem `403`. Peça a ativação ao suporte.
- Os scopes da tabela acima na sua aplicação, conforme os endpoints que ela usa.
- Uma **conta** da empresa para debitar a TED. O `accountId` é o mesmo ID que
  `GET /api/v1/account` retorna.

## Autenticação

Envie o AppID no header `Authorization`, **sem** o prefixo `Bearer`:

```sh
curl https://api.woovi.com/api/v1/ted \
  --header 'Authorization: {APP_ID}'
```

| Ambiente | URL base |
| --- | --- |
| Produção | `https://api.woovi.com` |
| Sandbox | `https://api.woovi-sandbox.com` |

A empresa vem do AppID, nunca da requisição: você só envia de contas da sua
empresa, e só enxerga as TEDs dela.

## Erros

Toda resposta de erro traz dois campos:

- **`errorCode`**: um código estável. Use-o no seu código para decidir o que
  fazer.
- **`error`**: a mensagem, para mostrar ao seu usuário. Ela segue o header
  `Accept-Language` (`pt-BR` ou `en`); sem o header, vem em português.

```json
{
  "error": "Valor acima do limite de TED disponível para o período",
  "errorCode": "TED_TOTAL_LIMIT_EXCEEDED"
}
```

Não compare o texto de `error`: ele pode mudar. Compare o `errorCode`, e novos
códigos podem surgir.

:::note
Os erros de autenticação (`401`) e de scope (`403`) são respondidos pelo
gateway, antes da API de TED, e trazem só o `error`.
:::

## Por que uma TED falhou

Uma TED `FAILED` ou `REFUNDED` explica o motivo em três campos, na
[consulta](./ted-get-api.md) e nos [webhooks](./ted-webhooks.md):

| Campo | Para quê |
| --- | --- |
| `errorCode` | Código estável do motivo. Use-o para decidir |
| `reason` | O `errorCode` explicado, para mostrar ao usuário. Segue o `Accept-Language`; nos webhooks vem em português |
| `bcbCode` | O código do BACEN por trás do motivo, para o suporte e a conciliação. `null` quando a falha não veio do BACEN |

```json
{
  "status": "FAILED",
  "errorCode": "RECEIVER_ACCOUNT_CLOSED",
  "reason": "Conta recebedora encerrada",
  "bcbCode": "1"
}
```

| `errorCode` | `reason` | `bcbCode` |
| --- | --- | --- |
| `INSUFFICIENT_BALANCE` | Saldo insuficiente | — |
| `OUTSIDE_STR_WINDOW` | Fora do horário de funcionamento da TED | `EGEN0300` ou SitLancSTR `15` |
| `STR_REJECTED` | Rejeitada pelo Banco Central | CodErro ou ErroGEN do BACEN |
| `STR_CANCELLED` | Cancelada no Banco Central | SitLancSTR `8`, `9` ou `24` |
| `REFUSED_BY_RECEIVER_BANK` | Devolvida pelo banco recebedor | CodDevTransf da devolução |
| `RECEIVER_ACCOUNT_NOT_FOUND` | Conta recebedora não encontrada | CodDevTransf `2` |
| `RECEIVER_ACCOUNT_CLOSED` | Conta recebedora encerrada | CodDevTransf `1` |
| `RECEIVER_ACCOUNT_BLOCKED` | Conta recebedora bloqueada para receber TED | CodDevTransf `70` |
| `FEE_FETCH_FAILED` | Falha ao calcular a tarifa | — |
| `LEDGER_ERROR` | Falha ao lançar a transação no saldo | — |
| `SPB_PUBLISH_FAILED` | Falha ao enviar a TED ao Banco Central | — |
| `SPB_DEAD_LETTERED` | TED não entregue ao Banco Central por um erro interno | — |
| `UNKNOWN` | Motivo desconhecido | — |

Em uma TED que não falhou, os três campos são `null`.

## Valores

Todos os valores são inteiros em **centavos**: `150050` é R$ 1.500,50.

## Status de uma TED

| `status` | Significado |
| --- | --- |
| `PENDING` | Em processamento |
| `PROCESSING` | Enviada ao STR, aguardando a resposta do BACEN |
| `SCHEDULED` | Reservado; hoje nenhuma TED fica neste `status` |
| `COMPLETED` | Liquidada |
| `FAILED` | Não liquidada; o saldo voltou para a conta |
| `REFUNDED` | Liquidada e depois devolvida |

| `type` | Significado |
| --- | --- |
| `PAYMENT` | Pagamento |
| `WITHDRAW` | Saque |
| `REFUND_SENT` | Devolução que você enviou |
| `REFUND_RECEIVED` | Devolução que você recebeu |

`direction` separa o dinheiro que você enviou (`OUT`) do que você recebeu
(`IN`).
