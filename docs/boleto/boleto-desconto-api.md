---
id: boleto-desconto
title: Como usar o Boleto com Desconto de Pontualidade via API
sidebar_label: Boleto com Desconto
tags:
- boleto
- desconto
---

# Como utilizar o Boleto com Desconto de Pontualidade via API

## Resumo

O desconto de pontualidade dá um abatimento ao pagador que paga o boleto **antes** de uma data. Você define até 3 faixas, cada uma com uma data e um valor, e o banco aplica a faixa vigente no dia do pagamento.

O desconto é registrado no boleto, no banco, e no Pix que acompanha o boleto. O pagador tem o mesmo desconto pagando por qualquer um dos dois.

---

## 1. Requisitos

- **Boleto ativo**: é preciso falar com a nossa equipe para habilitar o boleto na sua conta.
- **Desconto no boleto ativo**: o desconto em boleto também precisa ser habilitado pela nossa equipe. Sem ele, o campo `discountSettings` é ignorado em cobranças do tipo `BOLETO` e o boleto é emitido sem desconto.

---

## 2. Utilizando a API

Use o endpoint de criação de cobrança:

[Criar cobrança](/api#tag/charge/POST/api/v1/charge)

Envie `type: BOLETO` e o objeto `discountSettings`:

- **`discountSettings.modality`**: uma das duas modalidades aceitas no boleto:
  - `FIXED_VALUE_UNTIL_SPECIFIED_DATE`: desconto em **centavos**.
  - `PERCENTAGE_UNTIL_SPECIFIED_DATE`: desconto em **basis points** (100 = 1%).
- **`discountSettings.discountFixedDate`**: de 1 a 3 faixas, cada uma com:
  - `daysActive`: quantos dias depois da criação da cobrança o desconto vale (inclusive).
  - `value`: valor do desconto, inteiro e maior que zero, na unidade da modalidade.

Todas as datas de desconto precisam cair **até o vencimento do boleto**. O vencimento é o `daysForDueDate` quando a cobrança tem juros ou multa (veja [Boleto com Juros e Multa](/docs/boleto/boleto-juros-multa)); sem juros e multa, é a expiração da cobrança (`expiresIn`).

### Exemplo de Requisição

Boleto de R$ 100,00 com vencimento em 10 dias: R$ 5,00 de desconto se pago até o 3º dia e R$ 2,00 se pago até o 7º dia.

```json
{
  "correlationID": "9134e286-6f71-427a-bf00-241681624590",
  "value": 10000,
  "type": "BOLETO",
  "comment": "R$ 5,00 off until day 3, R$ 2,00 off until day 7",
  "daysForDueDate": 10,
  "daysAfterDueDate": 5,
  "interests": {
    "value": 100
  },
  "fines": {
    "value": 200
  },
  "discountSettings": {
    "modality": "FIXED_VALUE_UNTIL_SPECIFIED_DATE",
    "discountFixedDate": [
      { "daysActive": 3, "value": 500 },
      { "daysActive": 7, "value": 200 }
    ]
  },
  "customer": {
    "name": "John Doe",
    "taxID": "31324227036",
    "email": "email0@example.com",
    "phone": "5511999999999",
    "address": {
      "state": "SP",
      "city": "São Paulo",
      "neighborhood": "TESTE",
      "number": "1",
      "street": "Rua a b e C",
      "zipcode": "00000000"
    }
  }
}
```

---

## 3. Erros

A validação acontece antes da emissão: se a requisição for recusada, nenhum boleto é registrado.

| Situação | Resposta `400` |
| --- | --- |
| Modalidade diferente das duas aceitas no boleto | `Discount modality not supported on boleto` |
| Mais de 3 faixas em `discountFixedDate` | `Boleto accepts at most 3 discount dates` |
| Faixa com data depois do vencimento do boleto | `Discount date must be on or before the boleto due date` |
| `value` que não é inteiro maior que zero | `Discount value must be a positive integer` |

---

## 4. Desconto e juros/multa juntos

O desconto só vale para pagamentos **antes** das datas das faixas. A partir do vencimento não há desconto, e juros e multa passam a ser somados ao valor, como em [Boleto com Juros e Multa](/docs/boleto/boleto-juros-multa).

Para visualizar dia a dia quanto o pagador paga, use o [Simulador de desconto](/docs/charge/discount-simulator).
