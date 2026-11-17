---
id: consultas-chave-pix-sem-pagamento
title: Consultas de chave Pix sem pagamento
description: Como funciona o limite de consultas de chave Pix sem pagamento nas contas do modo BaaS, o que zera a contagem e o que fazer quando a conta recebe 429.
tags:
  - baas
  - api
  - payment
sidebar_position: 9.5
---

Pelo Regulamento do Pix, a consulta de uma chave no DICT, o diretório de chaves do Banco Central, só pode ser feita para identificar o destinatário de um Pix que vai ser pago em seguida. Por isso, toda [Verificação de Chave Pix](../payment/check-pix-key.md) precisa ser seguida de um pagamento para a chave consultada.

Para garantir isso, a Woovi conta as consultas que cada conta faz sem pagamento. Quando a conta chega ao limite, ela fica um dia sem poder consultar chaves.

## Como funciona a contagem

- **É por conta.** Cada conta do modo BaaS tem a sua própria contagem: a conta vinculada à chave de API (AppID) que fez a consulta. Uma conta no limite não afeta as outras.
- **Não é por dia nem por mês.** A contagem soma as consultas feitas desde o último pagamento por chave Pix daquela conta.
- **O limite é de 10 consultas seguidas sem pagamento.** Na 10ª, a conta fica **24 horas** sem poder consultar chaves.
- **Contam as consultas que chegam ao DICT:** chave encontrada (`200`) e chave não encontrada (`404 PIX_KEY_INFO_NOT_FOUND`). Chave em formato inválido, DICT indisponível e consultas recusadas com `429` não contam.
- A contagem vale por até 30 dias sem nenhuma consulta. Depois disso, recomeça do zero.

### O que zera a contagem

Um pagamento por chave Pix feito pela mesma conta zera a contagem, no momento em que o pagamento é aprovado. Envie no pagamento o `pixKeyEndToEndId` devolvido pela consulta: é ele que liga a consulta ao pagamento no Banco Central. Veja [Criar Pagamento](../payment/payment-how-to-use-api-to-create.mdx).

:::caution
Transferência para agência e conta e pagamento de boleto não zeram a contagem. Só pagamento por chave Pix zera.
:::

### Exemplos

| Sequência da conta | Resultado |
| --- | --- |
| 9 consultas, 1 pagamento por chave Pix, mais 9 consultas | Continua consultando |
| 10 consultas sem nenhum pagamento entre elas | Bloqueada por 24 horas na 10ª consulta |
| 10 consultas espalhadas em 3 semanas, sem pagamento | Bloqueada por 24 horas na 10ª consulta |
| 5 consultas e 5 transferências para agência e conta | A contagem continua em 5 |

## Quando a conta é bloqueada

Durante as 24 horas, toda consulta de chave da conta responde `429`, sem chegar ao DICT:

```json
{
  "error": "Muitas consultas de chave Pix sem pagamento. Tente novamente amanhã."
}
```

- O bloqueio vale só para as consultas de chave (`GET /api/v1/pix-keys/{pixKey}/check` e `POST /api/v1/pix-keys/check`). Pagamentos, saques e cobranças da conta seguem funcionando.
- O bloqueio termina sozinho 24 horas depois da 10ª consulta, e a conta recomeça a contagem do zero.
- As consultas feitas durante o bloqueio não entram na contagem seguinte.
- A funcionalidade de consulta continua liberada para a conta: não é preciso pedir a liberação de novo.

:::info Dois tipos de 429
A consulta de chave tem outro limite, o [Token Bucket](../payment/pix-key-token-bucket.md), que pesa as consultas a chaves inexistentes e volta em cerca de 1 minuto. Para saber qual dos dois limites a conta atingiu, veja a mensagem:

- `Muitas consultas de chave Pix sem pagamento. Tente novamente amanhã.`: limite de consultas sem pagamento, descrito nesta página. Dura 24 horas.
- `You tried to consult many Pix keys that do not exist.` (`errorCode: TOO_MANY_REQUESTS`): token bucket. Aguarde o `nextRefresh` de `GET /api/v1/pix-keys/tokens`.
:::

## Pagamento sem o pixKeyEndToEndId

Um pagamento por chave Pix criado pela API para uma chave que a empresa consultou nas últimas 12 horas precisa levar o `pixKeyEndToEndId` daquela consulta. Sem ele, o pagamento é recusado:

```json
{
  "error": "Este pagamento precisa do pixKeyEndToEndId retornado pela consulta da chave Pix"
}
```

Reenvie o pagamento com o `pixKeyEndToEndId` devolvido pela consulta. Depois de um pagamento com o identificador, o próximo pagamento para a mesma chave não é mais recusado.

## Validar os dados bancários sem pagar

Se o objetivo for validar a conta de um cliente no cadastro, e não pagar em seguida, não use a consulta de chave. Use o envio de 1 centavo: ele é um pagamento de verdade, devolve o titular confirmado da conta de destino e funciona com chave Pix ou com agência e conta. Veja [Validação de dados bancários](../flows/validate-bank-data-manual.md).

## Boas práticas

1. **Consulte só quando houver um pagamento a fazer.** Não use a consulta para validar cadastro, onboarding, KYC ou montar base de chaves.
2. **Guarde o `pixKeyEndToEndId`** de cada consulta e envie no pagamento correspondente.
3. **Não repita a consulta da mesma chave** antes de pagar: cada consulta conta.
4. **Trate o `429` pela mensagem.** O limite de consultas sem pagamento não volta com retry: espere as 24 horas.
5. **Se o pagador desistir**, não consulte a chave de novo automaticamente.

## Prompt para IA

Copie o trecho abaixo numa IA de coding (Claude / Cursor / Gemini / ChatGPT) pra tratar o limite de consultas sem pagamento no seu app:

> Ajuste a integração com a API da Woovi para respeitar o limite de consultas de chave Pix sem pagamento nas contas do modo BaaS.
>
> **Regra**: cada conta (a conta da chave de API que faz a chamada) pode fazer no máximo 10 consultas seguidas em `GET /api/v1/pix-keys/{pixKey}/check` ou `POST /api/v1/pix-keys/check` sem um pagamento por chave Pix entre elas. Contam as consultas com resposta `200` ou `404 PIX_KEY_INFO_NOT_FOUND`. Um pagamento por chave Pix aprovado da mesma conta zera a contagem; transferência para agência e conta e boleto não zeram. Na 10ª consulta sem pagamento, a conta recebe `429` em todas as consultas por 24 horas, com o corpo `{ "error": "Muitas consultas de chave Pix sem pagamento. Tente novamente amanhã." }`.
>
> **Requisitos**:
> - Chame a consulta só quando houver um pagamento a ser feito para a chave. Nunca use para validar cadastro ou montar base de dados.
> - Guarde o `pixKeyEndToEndId` retornado pela consulta e envie no corpo da criação do pagamento (`POST /api/v1/payment`). Um pagamento por chave consultada nas últimas 12 horas sem esse campo é recusado com `Este pagamento precisa do pixKeyEndToEndId retornado pela consulta da chave Pix`.
> - Não consulte a mesma chave de novo antes de pagar.
> - Diferencie os dois `429`: com a mensagem `Muitas consultas de chave Pix sem pagamento...`, pare de consultar por 24 horas e não faça retry; com `errorCode: TOO_MANY_REQUESTS`, é o token bucket: espere o `nextRefresh` de `GET /api/v1/pix-keys/tokens`.
> - Para validar dados bancários sem pagamento, use o envio de 1 centavo descrito em https://developers.woovi.com/docs/flows/validate-bank-data-manual.
