---
id: split-internal-transfer
title: Como utilizar o split de transferência entre contas
tags:
  - split
---

:::info
Para a utilização dessa funcionalidade é necessário possuir uma conta na woovi e a funcionalidade Split, entre em contato com nosso time de suporte para habilitar essa funcionalidade.
:::

## Split de transferência entre contas (SPLIT_INTERNAL_TRANSFER)

é necessário usar o type no objeto de split `SPLIT_INTERNAL_TRANSFER`

Se a conta destino estiver dentro da sua empresa, você consegue fazer o split utilizando a `pixKey` (chave pix) 

Esse tipo de split só é possível ser feito via API


```curl
curl -X POST "https://api.woovi.com/api/v1/charge" \
  -H "Authorization: MEU_APP_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "value": 10000,
    "correlationID": "c782e0ac-833d-4a89-9e73-9b60b2b41d3a",
    "splits": [
      {
        "type": "SPLIT_INTERNAL_TRANSFER",
        "pixKey": "destinatario1@woovi.com.br",
        "value": 6000
      },
      {
        "type": "SPLIT_INTERNAL_TRANSFER",
        "pixKey": "destinatario2@woovi.com.br",
        "value": 4000
      }
    ]
  }'
```
## Exemplo de regra personalizada de split

```ts
// função para lidar com calculo do valor split em porcentagem
const calculateSplitPercentage = (value: number, percentage: number) => {
  return value * (percentage / 100)
}

const createCharge = () => {
  // 100 reais em centavos
  const totalValueCharge = 10000
  // a porcentagem que será paga para o recebedor
  // essa porcentagem pode ser ajustada baseado nas suas necessidades e regras de negócio
  const splitPercentageRecipient = 20
  // calculando o valor que o recebedor deverá receber
  const valueSplitRecipient = calculateSplitPercentage(totalValueCharge, splitPercentageRecipient)

  // nessa requisição o valor total da cobrança e o valor split do recebedor e as demais informações
  fetchwooviApi('/api/v1/charge', {
    method: 'POST',
    body: {
      "value": totalValueCharge,
      "correlationID": "c782e0ac-833d-4a89-9e73-9b60b2b41d3a",
      "splits": [
        {
          "type": "SPLIT_INTERNAL_TRANSFER",
          "pixKey": "destinatario1@woovi.com.br",
          "value": valueSplitRecipient
        }
      ]
    },
    headers: {
      Authorization: 'MEU_APP_ID'
    }
  })
}
```