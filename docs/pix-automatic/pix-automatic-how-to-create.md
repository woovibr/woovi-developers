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
- **`journey`**: Deve ser baseado em qual jornada escolheu utilizar ( `PUSH_NOTIFICATION`: Jornada 1, `ONLY_RECURRENCY`: Jornada 2,  `PAYMENT_ON_APPROVAL`: Jornada 3, `PAYMENT_WITH_OFFER_TO_RECURRENCY`: Jornada 4),
- **`retryPolicy`**: Qual Política de rententativa deve ser adotada ( `NON_PERMITED`: Sem política de retentativas, `THREE_RETRIES_7_DAYS`: 3 Retentativas em até 7 dias )
- **`dayGenerateCharge`**: Dia do mês em que as cobranças serão geradas. 
**Caso seja escolhido a jornada 3 (``PAYMENT_ON_APPROVAL``) a data da cobrança deve ser o dia atual**. 
Outra observação desse campo, caso o valor seja inferior ao dia atual, a primeira cobrança ocorrerá apenas no próximo mês
- **`comment`**: A descrição da cobrança aparecerá para o seu cliente ao ler o qrcode no aplicativo do banco.

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