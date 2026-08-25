---
id: cobrancas-por-conta
title: Criando cobranças para uma conta
tags:
  - baas
  - api
  - charge
sidebar_position: 7
---

Este documento mostra como criar uma cobrança Pix para uma conta específica do modo BaaS.

:::tip A conta é definida pela credencial
Não existe um "parâmetro de conta" na API de cobrança: **a cobrança é criada na conta dona do AppID usado no header `Authorization`**. Cobrança criada com o AppID de uma conta é creditada no saldo daquela conta.
:::

## Passo a passo

1. Gere o AppID da conta com a sua API Master — veja [Controlando as contas no modo BAAS](./baas-api-master.md)
2. Garanta que a conta tem uma chave Pix — veja [Chaves Pix das contas](./chaves-pix-contas.md)
3. Crie a cobrança usando o AppID **daquela conta** no header:

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/charge \
  --header 'Authorization: <APP_ID_DA_CONTA>' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "correlationID": "pedido-9134",
    "value": 1500,
    "comment": "Pedido 9134"
  }'
```

O `value` é sempre em **centavos**. Resposta (resumida):

```json
{
  "charge": {
    "status": "ACTIVE",
    "value": 1500,
    "correlationID": "pedido-9134",
    "brCode": "000201010212...",
    "qrCodeImage": "https://api.woovi.com/openpix/charge/brcode/image/...",
    "paymentLinkUrl": "https://openpix.com.br/pay/...",
    "expiresDate": "2026-09-24T18:00:00.000Z",
    "globalID": "Q2hhcmdlOi4uLg=="
  }
}
```

Todos os demais recursos de cobrança — expiração, dados do cliente, desconto, informações adicionais — funcionam normalmente. Veja a [documentação de cobrança](../charge/how-to-create-charge-using-api.mdx) e a [API Reference](https://developers.woovi.com/api#tag/charge).

## Confirmação de pagamento

Registre o webhook `OPENPIX:CHARGE_COMPLETED` **com o AppID da mesma conta** — veja [Webhooks por conta](./webhooks-por-conta.md). Quando o Pix for pago, o evento chega com os dados da cobrança e do pagador.

## Repassando uma parte para a conta principal

Para reter uma tarifa da sua plataforma em cada cobrança, use o split de transferência interna na criação da cobrança:

```json
{
  "value": 1500,
  "correlationID": "pedido-9134",
  "splits": [
    {
      "value": 150,
      "pixKey": "<CHAVE_PIX_DA_CONTA_PRINCIPAL>",
      "splitType": "SPLIT_INTERNAL_TRANSFER"
    }
  ]
}
```

Veja os detalhes e as regras em [Split para a conta principal no modo BaaS](./baas-split.md).
