---
id: pix-automatic-how-to-create
sidebar_position: 3
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
- **`journey`**: Deve ser baseado em qual jornada escolheu utilizar ( `AUT1`: Jornada 1, `AUT2`: Jornada 2,  `AUT3`: Jornada 3, `AUT4`: Jornada 4),
- **`retryPolicy`**: Qual Política de rententativa deve ser adotada ( `NON_PERMITED`: Sem política de retentativas, `THREE_RETRIES_7_DAYS`: 3 Retentativas em até 7 dias )

O body também aceita outros campos **opcionais**:

- **`dayGenerateCharge`**: Dia do mês em que as cobranças serão geradas. Deve ser um valor de 0 a 27.

## Exemplo

O body da sua requisição será semelhante a este exemplo:

```json
{
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
  "type": "PIX_RECURRING",
  "journey": "AUT3",
  "retryPolicy": "NON_PERMITED",
}
```

Após efetuar a requisição, se tudo ocorreu bem, o _status code_ da requisição será `2xx` e no `body` da resposta, retornaremos a assinatura criada.

Retornarmeros a seguinte resposta de exemplo:

```json
{
  "subscription": {
    "globalID": "UGF5bWVudFN1YnNjcmlwdGlvbjo2M2UzYjJiNzczZDNkOTNiY2RkMzI5OTM=",
    "value": 100,
    "customer": {
      "name": "Dan",
      "email": "email0@example.com",
      "phone": "5511999999999",
      "taxID": {
        "taxID": "31324227036",
        "type": "BR:CPF"
      }
    },
    "dayGenerateCharge": 5
  }
}
```