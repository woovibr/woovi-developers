---
id: consultas-chave-pix-sem-pagamento
title: Consultas de chave Pix sem pagamento
description: Como funciona o limite de consultas de chave Pix sem pagamento nas contas do modo BaaS e o que fazer quando a conta recebe 429.
tags:
  - baas
  - api
  - payment
sidebar_position: 9.5
---

Pelo Regulamento do Pix, a consulta de uma chave no DICT, o diretório de chaves do Banco Central, só pode ser feita para identificar o destinatário de um Pix que vai ser pago em seguida. Por isso, toda [Verificação de Chave Pix](../payment/check-pix-key.md) precisa ser seguida de um pagamento para a chave consultada.

Para garantir isso, a Woovi acompanha as consultas que cada conta faz sem pagamento. Quando a conta chega ao limite, ela fica um dia sem poder consultar chaves.

## Como funciona

- **É por conta.** Cada conta do modo BaaS tem o seu próprio limite: a conta vinculada à chave de API (AppID) que fez a consulta. Uma conta no limite não afeta as outras.
- **O limite é de 10 consultas sem pagamento.** Não é por dia nem por mês: contam as consultas feitas sem que os pagamentos correspondentes tenham sido feitos.
- **Na 10ª consulta sem pagamento, a conta fica 24 horas sem poder consultar chaves.**

### O que conta como pagamento

O pagamento por chave Pix criado com o `pixKeyEndToEndId` devolvido pela consulta. É esse identificador que liga a consulta ao pagamento no Banco Central. Veja [Criar Pagamento](../payment/payment-how-to-use-api-to-create.mdx).

:::caution
Transferência para agência e conta e pagamento de boleto não contam como pagamento da consulta. Se a consulta é usada só para conferir o destinatário e o pagamento sai por agência e conta, as consultas se acumulam até o limite.
:::

## Quando a consulta é bloqueada

Durante as 24 horas, toda consulta de chave da conta responde `429`:

```json
{
  "error": "Muitas consultas de chave Pix sem pagamento. Tente novamente amanhã.",
  "errorCode": "PIX_KEY_CHECK_UNPAID_LIMIT_REACHED"
}
```

- Só a consulta de chave fica bloqueada (`GET /api/v1/pix-keys/{pixKey}/check` e `POST /api/v1/pix-keys/check`). A conta não é bloqueada: pagamentos, saques e cobranças seguem funcionando.
- O bloqueio termina sozinho depois de 24 horas. Não é preciso pedir a liberação.

:::info Dois tipos de 429
A consulta de chave tem outro limite, o [Token Bucket](../payment/pix-key-token-bucket.md), que pesa as consultas a chaves inexistentes e volta em cerca de 1 minuto. Para saber qual dos dois limites a conta atingiu, veja o `errorCode`:

- `PIX_KEY_CHECK_UNPAID_LIMIT_REACHED`: limite de consultas sem pagamento, descrito nesta página. Dura 24 horas.
- `TOO_MANY_REQUESTS`: token bucket. Aguarde o `nextRefresh` de `GET /api/v1/pix-keys/tokens`.
:::

## Validar os dados bancários sem pagar

Se o objetivo for validar a conta de um cliente no cadastro, e não pagar em seguida, não use a consulta de chave. Use o envio de 1 centavo: ele é um pagamento de verdade, devolve o titular confirmado da conta de destino e funciona com chave Pix ou com agência e conta. Veja [Validação de dados bancários](../flows/validate-bank-data-manual.md).

## Boas práticas

1. **Consulte só quando houver um pagamento a fazer.** Não use a consulta para validar cadastro, onboarding, KYC ou montar base de chaves.
2. **Guarde o `pixKeyEndToEndId`** de cada consulta e envie no pagamento correspondente.
3. **Não repita a consulta da mesma chave** antes de pagar: cada consulta conta.
4. **Trate o `429` pelo `errorCode`.** O limite de consultas sem pagamento não volta com retry: espere as 24 horas.
5. **Se o pagador desistir**, não consulte a chave de novo automaticamente.

## Prompt para IA

Copie o trecho abaixo numa IA de coding (Claude / Cursor / Gemini / ChatGPT) pra tratar o limite de consultas sem pagamento no seu app:

> Ajuste a integração com a API da Woovi para respeitar o limite de consultas de chave Pix sem pagamento nas contas do modo BaaS.
>
> **Regra**: cada conta (a conta da chave de API que faz a chamada) pode fazer no máximo 10 consultas em `GET /api/v1/pix-keys/{pixKey}/check` ou `POST /api/v1/pix-keys/check` sem o pagamento correspondente. Na 10ª consulta sem pagamento, a conta recebe `429` em todas as consultas por 24 horas, com o corpo `{ "error": "Muitas consultas de chave Pix sem pagamento. Tente novamente amanhã.", "errorCode": "PIX_KEY_CHECK_UNPAID_LIMIT_REACHED" }`. Transferência para agência e conta e boleto não contam como pagamento da consulta.
>
> **Requisitos**:
> - Chame a consulta só quando houver um pagamento a ser feito para a chave. Nunca use para validar cadastro ou montar base de dados.
> - Guarde o `pixKeyEndToEndId` retornado pela consulta e envie no corpo da criação do pagamento (`POST /api/v1/payment`).
> - Não consulte a mesma chave de novo antes de pagar.
> - Diferencie os dois `429` pelo `errorCode`: com `PIX_KEY_CHECK_UNPAID_LIMIT_REACHED`, pare de consultar por 24 horas e não faça retry; com `errorCode: TOO_MANY_REQUESTS`, é o token bucket: espere o `nextRefresh` de `GET /api/v1/pix-keys/tokens`.
> - Para validar dados bancários sem pagamento, use o envio de 1 centavo descrito em https://developers.woovi.com/docs/flows/validate-bank-data-manual.
