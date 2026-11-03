---
id: notification-billing-rule
sidebar_position: 1
title: O que é a régua de cobrança?
tags:
  - notification
  - billing-rule
  - api
---

A régua de cobrança define quais avisos os seus clientes recebem sobre as cobranças e parcelas de assinatura da sua empresa, por quais canais eles saem e em quais momentos.

É a mesma configuração da tela **Cobranças > Régua de cobrança** do painel. Você pode alterá-la pela tela ou pela [API](./notification-get-api), e as duas formas mudam a mesma régua.

## Os avisos

Cada aviso é identificado por um `notificationType`:

| `notificationType`                              | Quando sai                                                                        | O que o cliente recebe                                    | Canais              | Momentos |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------- | -------- |
| `NOTIFY_CUSTOMER_ON_CHARGE_CREATED`             | Quando a cobrança é criada                                                        | A cobrança, com o link de pagamento e o Pix Copia e Cola  | `WHATSAPP`, `EMAIL` | —        |
| `NOTIFY_CUSTOMER_BEFORE_CHARGE_DUE_DATE`        | Antes do vencimento, de 24 horas até 30 dias antes                                | Um lembrete de que a cobrança vai vencer                  | `WHATSAPP`, `EMAIL` | Até 5    |
| `NOTIFY_CUSTOMER_ON_CHARGE_DUE_DATE`            | No dia do vencimento, menos de 24 horas antes de vencer                           | Um aviso de que a cobrança vence hoje                     | `WHATSAPP`, `EMAIL` | Até 5    |
| `NOTIFY_CUSTOMER_AFTER_CHARGE_DUE_DATE`         | Depois do vencimento, até 30 dias depois, enquanto a cobrança ainda pode ser paga | Um aviso de que a cobrança está vencida e ainda em aberto | `WHATSAPP`, `EMAIL` | Até 5    |
| `NOTIFY_CUSTOMER_ON_CHARGE_PAID`                | Quando a cobrança é paga                                                          | O comprovante de pagamento                                | `WHATSAPP`, `EMAIL` | —        |
| `NOTIFY_CUSTOMER_ON_INSTALLMENT_CHARGE_CREATED` | Quando a parcela de uma assinatura é gerada                                       | A cobrança da parcela                                     | `EMAIL`             | —        |
| `NOTIFY_CUSTOMER_ON_INSTALLMENT_EXPIRED`        | Quando a parcela de uma assinatura expira sem pagamento                           | Um aviso de que a parcela expirou                         | `EMAIL`             | —        |

Cada aviso tem:

- **`active`**: se o aviso é enviado. Desligar um aviso mantém os canais e os momentos dele, para quando você religar.
- **`channels`**: por onde o aviso sai. Um aviso ligado precisa de pelo menos um canal, e cada canal aparece uma vez só.
- **`offsets`**: os momentos dos avisos de vencimento. Só existem nos três avisos de vencimento (`BEFORE`, `ON` e `AFTER`).
- **`attachments`**: os arquivos que vão junto do e-mail. Só existem na cobrança criada e na parcela criada.

## Momentos (`offsets`)

Os três avisos de vencimento saem uma vez para cada momento configurado. Um momento é a distância até o vencimento, ou a partir dele:

```json
{ "value": 3, "unit": "DAY" }
```

- `value` é um número inteiro positivo, e `unit` é `MINUTE`, `HOUR` ou `DAY`.
- Um aviso aceita até 5 momentos, e dois momentos do mesmo aviso não podem cair no mesmo instante, como `1 DAY` e `24 HOUR`.
- Nenhum momento pode estar a mais de 30 dias do vencimento.
- **Antes do vencimento** (`BEFORE`): cada momento precisa estar a pelo menos 24 horas do vencimento.
- **No dia do vencimento** (`ON`): cada momento precisa estar a menos de 24 horas do vencimento, por exemplo `3 HOUR` ou `30 MINUTE`.
- **Depois do vencimento** (`AFTER`): conta a partir do vencimento.

Exemplos com uma cobrança que vence em 10/12 às 18:00:

| Aviso    | Momentos         | Envios                          |
| -------- | ---------------- | ------------------------------- |
| `BEFORE` | `5 DAY`, `1 DAY` | 05/12 às 18:00 e 09/12 às 18:00 |
| `ON`     | `3 HOUR`         | 10/12 às 15:00                  |
| `AFTER`  | `1 DAY`, `3 DAY` | 11/12 às 18:00 e 13/12 às 18:00 |

### Quando um momento não é enviado

- **Antes e no dia do vencimento:** um momento que já passou quando a cobrança é criada não é enviado. Uma cobrança criada 2 dias antes de vencer não recebe o lembrete de 5 dias antes.
- **Depois do vencimento:** só a cobrança com data de vencimento (Pix com vencimento) recebe esse aviso, porque é ela que continua podendo ser paga depois de vencer. O Pix imediato não pode mais ser pago quando expira e não recebe aviso depois do vencimento. Um momento depois do último dia de pagamento da cobrança não é enviado.
- Para o Pix imediato, o vencimento é a data em que a cobrança expira.

## Anexos (`attachments`)

Os avisos de cobrança criada e de parcela criada podem levar arquivos no e-mail:

- `CHARGE_PDF`: o PDF do boleto da cobrança, para cobranças com boleto.
- `INVOICE`: a nota fiscal da cobrança, quando a sua empresa emite a nota fiscal na criação da cobrança.

Enquanto a sua empresa não escolher os anexos, o campo não aparece na resposta da API. Os outros avisos não aceitam anexos.

## Quem recebe

O aviso vai para o cliente da cobrança, nos canais da régua para os quais o cliente tem contato:

- `WHATSAPP` precisa do telefone do cliente.
- `EMAIL` precisa do e-mail do cliente.

Um cliente sem telefone não recebe o aviso por WhatsApp, mesmo com o canal ligado na régua.

## Quando uma mudança vale

- Desligar um aviso, ou tirar um canal, vale na hora, inclusive para as cobranças que já existem.
- Remover um momento também vale para as cobranças que já existem. Momentos novos valem para as cobranças criadas depois da mudança.
- Os avisos de vencimento só saem enquanto a cobrança está em aberto. Depois que ela é paga, não sai mais nenhum.

## Próximos passos

- [Ler a régua de cobrança pela API](./notification-get-api)
- [Alterar a régua de cobrança pela API](./notification-patch-api)
