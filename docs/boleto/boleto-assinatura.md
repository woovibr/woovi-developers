---
id: boleto-assinatura
title: Boleto em Assinaturas
sidebar_label: Boleto em Assinaturas
tags:
- boleto
- subscription
- recurrence
---

# Boleto em Assinaturas

## Resumo

Além das cobranças avulsas, você pode usar o **boleto como forma de cobrança de
uma assinatura (recorrência)**. Nesse modelo, a cada ciclo da assinatura geramos
automaticamente um novo boleto para o seu cliente — que também pode ser pago via
Pix, já que todo boleto emitido pela Woovi expõe um QR Code Pix.

:::info Boleto precisa estar habilitado
A cobrança por boleto exige que a funcionalidade esteja ativa na sua conta. Entre
em contato com o nosso time para habilitar.
:::

---

## Como criar

Crie a assinatura pelo endpoint `POST /api/v1/subscriptions` informando:

- **`type`**: `RECURRENT`
- **`chargeType`**: `BOLETO`

```json
{
  "value": 15000,
  "type": "RECURRENT",
  "chargeType": "BOLETO",
  "customer": {
    "name": "Dan",
    "taxID": "31324227036",
    "email": "email0@example.com",
    "phone": "5511999999999"
  }
}
```

O passo a passo completo, com a resposta esperada e exemplos em cURL/JavaScript,
está em
**[Como criar uma Assinatura cobrada com Boleto usando a API?](../subscription-recurrence/subscription-with-boleto-create-api.mdx)**.

Consulte também a referência do endpoint na
[API Reference](https://developers.woovi.com/api#tag/subscription/POST/api/v1/subscriptions).

---

## Ciclo de vida

A cada parcela (definida por `frequency` e `dayGenerateCharge`) geramos uma
**cobrança do tipo boleto**. Essa cobrança segue o mesmo formato da
[cobrança de boleto avulsa](./boleto-api.md): traz `paymentMethods.boleto` (com
`boletoBarcode` e `boletoDigitable`) e também um Pix, de forma que o cliente pode
quitar por qualquer uma das duas opções.

---

## Webhook

Quando o boleto de uma parcela é **pago**, disparamos o webhook
`OPENPIX:CHARGE_COMPLETED` — o mesmo evento do fluxo de boleto avulso. O payload
completo, o cadastro e a validação da assinatura estão em
**[Webhook de Boleto pago](./boleto-webhook.md)**.

:::warning Pagamento não é liquidação
O webhook indica que o boleto foi **pago**, não que o valor já está disponível. A
**liquidação** ocorre depois (tipicamente D+3). Trate o webhook como "parcela
quitada", não como saldo disponível. Veja
[Conciliação de liquidação do Boleto](./boleto-reconciliation.md).
:::

---

## Resumo rápido

| Pergunta | Resposta |
| --- | --- |
| Como cobro uma assinatura por boleto? | `POST /api/v1/subscriptions` com `type: RECURRENT` e `chargeType: BOLETO`. |
| Cada parcela gera um boleto? | Sim. A cada ciclo geramos um novo boleto (que também aceita Pix). |
| Qual webhook recebo? | `OPENPIX:CHARGE_COMPLETED`, no pagamento de cada parcela. |
| O dinheiro já está disponível? | Não. Pagamento ≠ liquidação (≈ D+3). |
