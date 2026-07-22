---
id: pix-automatic-how-to-create
sidebar_position: 4
title: Como criar um Pix Automático?
tags:
  - pix-automatic
  - api
---

Para criar um pix Automático você utilizará o mesmo endpoint de assinatura que já existe, porém necessitará de enviar alguns campos adicionais.

Você deverá fazer uma chamada POST para o _endpoint_ `/api/v1/subscriptions`.

Como parte do `body` da requisição, esperamos o envio dos seguintes itens:

- **`value`**: O valor em centavos da assinatura a ser criada.
- **`customer`**: O cliente da assinatura a ser cobrado. É obrigatório o envio do endereço do cliente. Este campo é [idempotente](../concepts/idempotence.md), o que significa que se você enviar dados de um cliente que já exista, utilizaremos o existente ao invés de criar um novo.
- **`type`**: Deve ser definido como `PIX_RECURRING`
- **`dayGenerateCharge`**: Dia do mês em que as cobranças serão geradas. Aceita um número de 1 a 31 (dia do mês) ou uma data ISO 8601 completa (ex.: `"2026-02-22T00:00:00.000Z"`) para definir a data de início da recorrência.
**Caso seja escolhido a jornada 3 (``PAYMENT_ON_APPROVAL``) a data deve ser o dia atual**. 
Caso o dia informado seja inferior ao dia atual, a primeira cobrança ocorrerá apenas no próximo mês.
- **`dayDue`**: Quantos dias para expirar cobrança. 
- **`comment`**: Texto usado como o contrato de adesão da recorrência (campo `contrato` do mandato). Deve ter menos de 30 caracteres. No Pix Automático o nome exibido para o pagador no aplicativo do banco é a razão social / nome fantasia do CNPJ da sua conta, não o `comment`.
- **`frequency`**: A frequência da recorrência. Valores aceitos no Pix Automático: `WEEKLY` (semanal), `MONTHLY` (mensal), `QUARTERLY` (trimestral, a cada 3 meses), `SEMIANNUALLY` (semestral) e `ANNUALLY` (anual). `BIMONTHLY` (bimestral) não é suportado pelo Pix Automático.

Dentro do objeto `pixRecurringOptions` você precisa definir alguns parâmetros exclusivos do pix automático:

- **`journey`**: Deve ser baseado em qual jornada escolheu utilizar (`ONLY_RECURRENCY`: Jornada 2,  `PAYMENT_ON_APPROVAL`: Jornada 3),
- **`retryPolicy`**: Qual Política de rententativa deve ser adotada ( `NON_PERMITED`: Sem política de retentativas, `THREE_RETRIES_7_DAYS`: 3 Retentativas em até 7 dias )
- **`minimumValue`** (Opcional): Caso sua cobrança tenha valor variável, você pode definir o valor mínimo a que deve ser aceito.

## Exemplo

O body da sua requisição será semelhante a este exemplo:

```json
{
  "name": "Pix Automático",
  "value": 100,
  "customer": {
    "name": "Dan",
    "taxID": "31324227036",
    "email": "email0@example.com",
    "phone": "5511999999999",
    "address": {
        "zipcode": "04556300",
        "street": "rua de são paulo",
        "number": "3432",
        "neighborhood": "BROOKLIN PAULISTA",
        "city": "SAO PAULO",
        "state": "SP",
        "complement": "CONJ 26"
    }
  },
  "correlationID": "UniqueID",
  "comment": "Comentários",
  "frequency": "MONTHLY",
  "type": "PIX_RECURRING",
  "pixRecurringOptions": {
    "journey": "PAYMENT_ON_APPROVAL",
    "retryPolicy": "NON_PERMITED"
  },
  "dayGenerateCharge": 10,
  "dayDue": 3
}
```

Após efetuar a requisição, se tudo ocorreu bem, o _status code_ da requisição será `2xx` e no `body` da resposta, retornaremos a assinatura criada.

Retornarmeros a seguinte resposta de exemplo:

```json
{
    "subscription": {
        "customer": {
            "name": "Teste",
            "email": "teste@pix.com",
            "address": {
                "zipcode": "04556300",
                "street": "rua de são paulo",
                "number": "3432",
                "neighborhood": "BROOKLIN PAULISTA",
                "city": "SAO PAULO",
                "state": "SP",
                "complement": "CONJ 26",
                "country": "BR",
                "_id": "689cafe1d7943ac642518543"
            },
            "taxID": {
                "taxID": "xxxxxxxx",
                "type": "BR:CPF"
            },
            "correlationID": "5a85c7a3-5c54-491d-a2f9-9c1ac486fd7a"
        },
        "dayGenerateCharge": 13,
        "value": 20,
        "status": "ACTIVE",
        "correlationID": "",
        "paymentLinkUrl": "https://woovi.dev/pay/8a421a7a-a9af-4b2d-add8-54fc1ac4320f",
        "pixRecurring": {
           "recurrencyId": "RN54811417202508244SORthDqe6c",
            "emv": "00020101021226870014br.gov.bcb.pix2565qr-h.woovi.digital/qr/v2/cob/464bf2d4-3b4b-4633-a9fc-c4b492f76e035204000053039865802BR5911Pedro Woovi6007VITORIA62070503***80870014br.gov.bcb.pix2565qr-h.woovi.digital/qr/v2/rec/a8493991-b364-4821-acea-f548ee239f416304E887",
            "journey": "PAYMENT_ON_APPROVAL",
            "status": "CREATED"
        },
        "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2ODljYWZlMWQ3OTQzYWM2NDI1MTg1NGY="
    }
}
```

## Início no mês seguinte

Para criar o mandato agora e cobrar o cliente apenas no próximo mês (ou em uma data futura), use a jornada 2 (`ONLY_RECURRENCY`). Nessa jornada nenhuma cobrança é disparada na criação — apenas o mandato de recorrência é registrado, e a primeira cobrança é gerada somente na data de início.

A data de início é definida pelo `dayGenerateCharge`, de duas formas:

- **Data ISO 8601** (recomendado): envie a data completa (ex.: `"2026-02-22T00:00:00.000Z"`). Ela passa a ser o início da recorrência e o dia dela vira o dia fixo das cobranças seguintes.
- **Número**: se o dia informado for menor que o dia de hoje, a primeira cobrança ocorre no próximo mês; se maior, ainda no mês atual.

Na jornada `ONLY_RECURRENCY`, a data de início precisa estar a pelo menos 3 dias de hoje, caso contrário a criação é rejeitada.

O `body` para uma assinatura mensal que começa apenas em 22/02/2026 seria semelhante a este:

```json
{
  "name": "Pix Automático",
  "value": 100,
  "customer": {
    "name": "Dan",
    "taxID": "31324227036",
    "email": "email0@example.com",
    "phone": "5511999999999",
    "address": {
        "zipcode": "04556300",
        "street": "rua de são paulo",
        "number": "3432",
        "neighborhood": "BROOKLIN PAULISTA",
        "city": "SAO PAULO",
        "state": "SP",
        "complement": "CONJ 26"
    }
  },
  "correlationID": "UniqueID",
  "comment": "Assinatura mensal",
  "frequency": "MONTHLY",
  "type": "PIX_RECURRING",
  "pixRecurringOptions": {
    "journey": "ONLY_RECURRENCY",
    "retryPolicy": "THREE_RETRIES_7_DAYS"
  },
  "dayGenerateCharge": "2026-02-22T00:00:00.000Z",
  "dayDue": 3
}
```