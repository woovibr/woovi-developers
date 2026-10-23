---
id: pix-key-format
sidebar_position: 4
title: Formato da chave Pix
tags:
  - payment
  - api
---

Toda chave Pix enviada para a API (no pagamento, na consulta de chave, na criação de subconta e nos splits) tem que estar no formato do seu tipo. O tipo da chave é identificado pelo formato, e um formato errado pode fazer a chave ser lida como outro tipo.

## Formato por tipo

| Tipo     | Formato                                                      | Exemplo                                |
| -------- | ------------------------------------------------------------ | -------------------------------------- |
| `CPF`    | 11 dígitos, sem pontuação                                    | `00000000191`                          |
| `CNPJ`   | 14 dígitos, sem pontuação                                    | `00000000000191`                       |
| `PHONE`  | formato internacional E.164: `+`, DDI, DDD e número          | `+5511912345684`                       |
| `EMAIL`  | o endereço de e-mail                                         | `fulano@example.com`                   |
| `RANDOM` | a chave aleatória (EVP), UUID de 36 caracteres               | `c4249323-b4ca-43f2-8139-8232aab09b93` |

## Telefone

A chave de telefone é sempre enviada no formato internacional E.164, só com o sinal `+` e dígitos, sem espaços, parênteses ou hífen:

```
+ DDI DDD número
```

- **DDI**: o código do país. Para o Brasil, `55`.
- **DDD**: o código de área com 2 dígitos, sem o `0` (ex.: `11` para São Paulo, `21` para o Rio de Janeiro).
- **Número**: o número do telefone. Para celular no Brasil, 9 dígitos, começando com `9`.

| Como o número aparece  | Como enviar      |
| ---------------------- | ---------------- |
| `(11) 91234-5684`      | `+5511912345684` |
| `11 91234-5684`        | `+5511912345684` |
| `011 91234-5684`       | `+5511912345684` |
| `+55 (11) 91234-5684`  | `+5511912345684` |

:::warning Telefone sem +55
Um número só com dígitos que seja um CPF válido é lido como CPF, mesmo que também seja um celular. Muitos celulares também são CPFs válidos: `11912345684`, por exemplo, é ao mesmo tempo um celular de DDD 11 e um CPF. Enviado sem `+55`, o Pix vai para o dono do CPF `11912345684`, e não para o dono do telefone.

Envie sempre o telefone com `+55` e informe o tipo da chave (`destinationAliasType: "PHONE"` no pagamento).
:::

## Chave ambígua: CPF ou telefone

Uma chave só com dígitos que é ao mesmo tempo um CPF válido e um celular brasileiro (ex.: `11912345684`) é **ambígua**: sem o tipo, não dá para saber se ela é o CPF ou o telefone.

A API **recusa com `400`** uma chave ambígua enviada sem o tipo, em vez de tratá-la como CPF. Para que a chave seja aceita, informe o tipo correto:

- se é o **CPF**, envie o tipo `CPF` com os 11 dígitos (`11912345684`);
- se é o **telefone**, envie o tipo `PHONE` com o número no formato internacional (`+5511912345684`).

O tipo é informado no campo de cada endpoint:

| Endpoint | Campo da chave | Campo do tipo |
| --- | --- | --- |
| `POST /api/v1/payment` | `destinationAlias` | `destinationAliasType` |
| `POST /api/v1/subaccount` | `pixKey` | `pixKeyType` |
| `POST /api/v1/charge` (splits) | `splits[].pixKey` | `splits[].pixKeyType` |
| `POST /api/v1/pix-keys/withdraw` e `PUT /api/v1/pix-keys/withdraw` | `pixKey` | `pixKeyType` |
| `POST /api/v1/stablecoin/payout` | `pixKey` | `pixKeyType` |

Exemplos de pagamento:

```json
{
  "value": 100,
  "destinationAlias": "+5511912345684",
  "destinationAliasType": "PHONE",
  "correlationID": "31ee9576-99ec-412a-9ac7-e142a4a6acf0"
}
```

```json
{
  "value": 100,
  "destinationAlias": "11912345684",
  "destinationAliasType": "CPF",
  "correlationID": "8a1d3c6e-6f2b-4f0e-9b7a-1c2d3e4f5a6b"
}
```

Resposta para uma chave ambígua enviada sem o tipo:

```json
{
  "error": "destinationAlias is valid for more than one Pix key type (CPF, PHONE). Please inform destinationAliasType"
}
```

Nos outros endpoints a mensagem é a mesma, com o nome do campo do tipo (`pixKeyType`); na criação de subconta ela vem com `errorCode: "AMBIGUOUS_PIX_KEY"`.

Mesmo para chaves que não são ambíguas, **sempre informe o tipo da chave**.

## Consulta de chave

A [consulta de chave Pix](./check-pix-key.md) segue o mesmo formato. Para consultar um telefone, envie `+5511912345684`; o campo `type` da resposta mostra o tipo da chave que foi consultada.
