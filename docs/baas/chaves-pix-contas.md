---
id: chaves-pix-contas
title: Chaves Pix das contas
tags:
  - baas
  - api
  - pix-keys
sidebar_position: 10
---

Cada conta precisa de ao menos uma chave Pix — é a chave _default_ da conta que as cobranças usam. Gerencie as chaves de uma conta com o **AppID da própria conta**.

## Criando uma chave aleatória (EVP)

```bash
curl --request POST \
  --url https://api.woovi.com/api/v1/pix-keys \
  --header 'Authorization: <APP_ID_DA_CONTA>' \
  --header 'Content-Type: application/json' \
  --data-raw '{ "type": "EVP" }'
```

Resposta `200`:

```json
{
  "pixKey": {
    "pixKey": "b6295ee1-f054-4b8f-a8b4-dfe4ad2d8e9f",
    "type": "EVP",
    "isDefault": false
  }
}
```

## Tipos suportados

| Tipo              | Campo `pixKey`        | Observações                                     |
| ----------------- | --------------------- | ----------------------------------------------- |
| `EVP`             | não enviar — é gerada | recomendado: sem dado pessoal, criação imediata |
| `CNPJ`            | obrigatório           | o CNPJ da conta                                 |
| `EMAIL` / `PHONE` | obrigatório           | dependem de verificação — fale com o suporte    |
| `CPF`             | —                     | não suportado via API                           |

Para os tipos que exigem o campo, envie a chave em `pixKey`:

```json
{ "pixKey": "11222333000181", "type": "CNPJ" }
```

## Gerenciando as chaves

- `GET /api/v1/pix-keys` — lista as chaves da conta
- `PUT /api/v1/pix-keys/:pixKey/default` — define a chave padrão das cobranças
- `DELETE /api/v1/pix-keys/:pixKey` — remove a chave
- `GET /api/v1/pix-keys/:pixKey/check` — verifica a situação da chave

:::info
A API de chaves opera sobre a conta vinculada ao AppID usado no header. AppIDs criados pela API Master para uma conta (veja [Controlando as contas no modo BAAS](./baas-api-master.md)) já atendem a esse requisito.
:::

Para criar chaves pela plataforma, veja [Como criar uma nova chave Pix](../pix-keys/how-to-create-new-pix-key.md).
