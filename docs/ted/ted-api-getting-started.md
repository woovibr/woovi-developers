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
**consultar** uma TED e **listar** as TEDs enviadas e recebidas. O resultado de
cada TED chega por [webhook](./ted-webhooks.md).

| Endpoint | O que faz | Scope |
| --- | --- | --- |
| [`POST /api/v1/ted`](./ted-send-api.mdx) | Envia uma TED | `TED_POST` |
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
consulte a TED.

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

## Idioma das mensagens de erro

As mensagens de erro são traduzidas conforme o header `Accept-Language`
(`pt-BR` ou `en`). Sem o header, a resposta vem em português.

```json
{
  "error": "Saldo insuficiente para completar a transação"
}
```

## Valores

Todos os valores são inteiros em **centavos**: `150050` é R$ 1.500,50.

## Status de uma TED

| `status` | Significado |
| --- | --- |
| `PENDING` | Em processamento |
| `PROCESSING` | Enviada ao STR, aguardando a resposta do BACEN |
| `SCHEDULED` | Aguardando a próxima janela do STR |
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
