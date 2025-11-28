---
id: boleto-juros-multa
title: Como usar o Boleto com Juros e Multa via API
sidebar_label: Boleto com Juros e Multa
tags:
- boleto
- juros
- multa
---

# Como utilizar o Boleto com Juros e Multa via API

## Resumo

Este documento explica como utilizar o Boleto via API com configuração de juros e multa para gerar boletos de cobrança que aplicam encargos em caso de atraso no pagamento. A integração permite que você configure valores de juros e multa que serão aplicados após o vencimento do boleto.

---

## Observações Importantes

Antes de começar, é fundamental entender os seguintes conceitos:

### Basis Points - Como Calcular

Os valores de juros (`interests.value`) e multa (`fines.value`) devem ser informados em **basis points**.

**Basis point** é uma unidade de medida igual a 0,01% (um centésimo de um por cento). A conversão é simples:

- **1 basis point = 0,01%**
- **100 basis points = 1%**
- **1000 basis points = 10%**

**Fórmula de conversão:**
```
Valor em basis points = Percentual desejado × 100
```

**Exemplos práticos:**
- Para configurar **1% de juros**: informe `100` (1 × 100 = 100)
- Para configurar **1,5% de juros**: informe `150` (1,5 × 100 = 150)
- Para configurar **2% de multa**: informe `200` (2 × 100 = 200)
- Para configurar **0,5% de juros**: informe `50` (0,5 × 100 = 50)

### Data Limite de Pagamento (daysAfterDueDate)

O campo `daysAfterDueDate` define o **prazo adicional** após a data de vencimento do boleto para que o pagamento ainda possa ser realizado. Este campo estabelece a **data limite de pagamento**, que é distinta da data de vencimento.

**Exemplo prático:**
- Data de vencimento: **20 de janeiro**
- `daysAfterDueDate`: **5 dias**
- Data limite de pagamento: **25 de janeiro** (20 + 5 dias)

Neste exemplo, o boleto pode ser pago até o dia 25 de janeiro, mesmo tendo vencido no dia 20.

### Outras Observações

- A criação de um boleto também gera um PIX. É possível pagar com qualquer uma das duas opções.

---

## 1. Requisitos Iniciais

Antes de começar, você precisará de:

- **Funcionalidade boleto ativa**: É necessário entrar em contato com a nossa equipe para analisarmos seu modelo de negócio e habilitar essa funcionalidade.

---

## 2. Utilizando a API

Para criar uma cobrança do tipo *Boleto* com juros e multa, você precisará acessar o endpoint de criação de cobrança:

[Criar cobrança](https://developers.woovi.com.br/api#tag/charge/paths/~1api~1v1~1charge/get)

O processo de criação de um boleto com juros e multa é similar ao boleto comum, porém com a adição dos seguintes parâmetros:

- `interests`: Objeto contendo o valor dos juros a serem aplicados
- `fines`: Objeto contendo o valor da multa a ser aplicada
- `daysAfterDueDate`: Número de dias extras após o vencimento para ainda poder realizar o pagamento (data limite de pagamento)

### Parâmetros de Juros e Multa

- **interests.value**: Valor dos juros em basis points. Consulte a seção [Basis Points - Como Calcular](#basis-points---como-calcular) acima para entender como converter percentuais em basis points.
- **fines.value**: Valor da multa em basis points. Consulte a seção [Basis Points - Como Calcular](#basis-points---como-calcular) acima para entender como converter percentuais em basis points.
- **daysAfterDueDate**: Define o prazo adicional após a data de vencimento para que o pagamento ainda possa ser realizado, estabelecendo assim a data limite de pagamento. Consulte a seção [Data Limite de Pagamento (daysAfterDueDate)](#data-limite-de-pagamento-daysafterduedate) acima para mais detalhes.

### Exemplo de Requisição

```json
{
  "correlationID": "9134e286-6f716-427a-bf00-241681624580",
  "value": 350,
  "type": "BOLETO",
  "comment": "Produto X",
  "interests": {
    "value": 100
  },
  "fines": {
    "value": 100
  },
  "daysAfterDueDate": 1,
  "customer": {
    "name": "John Doe",
    "taxID": "31324227036",
    "email": "email0@example.com",
    "phone": "5511999999999",
    "address": {
      "state": "SP",
      "city": "São Paulo",
      "neighborhood": "TESTE",
      "number": 1,
      "street": "Rua a b e C",
      "zipcode": "00000000"
    }
  },
  "additionalInfo": [
    {
      "key": "Product",
      "value": "Pencil"
    },
    {
      "key": "Invoice",
      "value": "18476"
    },
    {
      "key": "Order",
      "value": "302"
    }
  ]
}
```

### Exemplo de Resposta

A resposta deve ser algo como:

```json
{
  "charge": {
    "customer": {
      "name": "John Doe",
      "email": "email0@example.com",
      "phone": "+5511999999999",
      "taxID": {
        "taxID": "31324227036",
        "type": "BR:CPF"
      },
      "correlationID": "dee90bf2-56ca-43ec-a21e-af387b12b2a5",
      "address": {
        "zipcode": "00000000",
        "street": "Rua a b e C",
        "number": "1",
        "neighborhood": "TESTE",
        "city": "São Paulo",
        "state": "SP"
      }
    },
    "value": 350,
    "comment": "Produto X",
    "identifier": "86f79ae121314f9d8f7f25e2aaa8f62a",
    "correlationID": "9134e286-6f716-427a-bf00-241681624580",
    "transactionID": "86f79ae121314f9d8f7f25e2aaa8f62a",
    "status": "ACTIVE",
    "additionalInfo": [
      {
        "key": "Product",
        "value": "Pencil"
      },
      {
        "key": "Invoice",
        "value": "18476"
      },
      {
        "key": "Order",
        "value": "302"
      }
    ],
    "fee": 50,
    "discount": 0,
    "valueWithDiscount": 350,
    "expiresDate": "2025-12-28T19:51:26.670Z",
    "type": "BOLETO",
    "paymentLinkID": "79a6b6f5-60f7-47b6-9771-26efcab84b1e",
    "createdAt": "2025-11-28T19:51:27.763Z",
    "updatedAt": "2025-11-28T19:51:27.763Z",
    "ensureSameTaxID": false,
    "interestsSettings": {
      "fines": {
        "value": 100
      },
      "interests": {
        "value": 100
      }
    },
    "brCode": "00020101021226870014br.gov.bcb.pix2565qr-h.woovi.digital/qr/v2/cob/9fb5f17d-d687-4337-88cd-2abd98f9d43b52040000530398654043.505802BR5917Teste_Description6009Sao_Paulo622905250514087053ef4559a0c942bd06304A66C",
    "expiresIn": 2592000,
    "pixKey": "78447c87-9961-4eb1-a2de-f60597e849e2",
    "paymentLinkUrl": "undefined/79a6b6f5-60f7-47b6-9771-26efcab84b1e",
    "qrCodeImage": "https://api.woovi.dev/openpix/charge/brcode/image/79a6b6f5-60f7-47b6-9771-26efcab84b1e.png",
    "globalID": "Q2hhcmdlOjY5MjlmZDNmZWEwZmMwM2JmYzgwMjg3Mw==",
    "paymentMethods": {
      "boleto": {
        "method": "BOLETO",
        "correlationID": "80748320",
        "boletoBarcode": "34192863800000100011570000105681500052061000",
        "boletoDigitable": "34191570070010568150600520610007286380000010001",
        "status": "CREATED",
        "value": 350,
        "fee": 50,
        "barcodeImage": "https://api.woovi.dev/api/image/barcode/79a6b6f5-60f7-47b6-9771-26efcab84b1e.png"
      },
      "pix": {
        "method": "PIX_COB",
        "status": "ACTIVE",
        "value": 350,
        "txId": "0514087053ef4559a0c942bd01f65302",
        "fee": 50,
        "brCode": "00020101021226870014br.gov.bcb.pix2565qr-h.woovi.digital/qr/v2/cob/9fb5f17d-d687-4337-88cd-2abd98f9d43b52040000530398654043.505802BR5917Teste_Description6009Sao_Paulo622905250514087053ef4559a0c942bd06304A66C",
        "transactionID": "0514087053ef4559a0c942bd01f65302",
        "identifier": "0514087053ef4559a0c942bd01f65302",
        "qrCodeImage": "https://api.woovi.dev/openpix/charge/brcode/image/79a6b6f5-60f7-47b6-9771-26efcab84b1e.png"
      }
    }
  },
  "correlationID": "9134e286-6f716-427a-bf00-241681624580",
  "brCode": "00020101021226870014br.gov.bcb.pix2565qr-h.woovi.digital/qr/v2/cob/9fb5f17d-d687-4337-88cd-2abd98f9d43b52040000530398654043.505802BR5917Teste_Description6009Sao_Paulo622905250514087053ef4559a0c942bd06304A66C"
}
```

## 3. Campos Importantes na Resposta

Na resposta da API, você encontrará o objeto `interestsSettings` que confirma as configurações de juros e multa aplicadas ao boleto:

```json
"interestsSettings": {
  "fines": {
    "value": 100
  },
  "interests": {
    "value": 100
  }
}
```

Este objeto confirma que os valores de juros e multa foram configurados corretamente. Os valores são retornados em basis points (100 = 1%).

