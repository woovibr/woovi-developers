---
id: decode-emv
title: Decodificar QR Code Pix / Copia e Cola
tags:
  - api
---

Este documento irá ajudá-lo a decodificar uma string de QR Code Pix ou Copia e Cola (formato EMV / BR Code do BCB).

O Copia e Cola é a mesma string que o QR Code carrega visualmente — basta passar essa string no body que o endpoint devolve os dados já parseados.

O endpoint cobre os três cenários típicos:
- **Estático**: chave Pix, valor e nome do recebedor já estão dentro do próprio payload e voltam direto na resposta, sem nenhuma chamada externa.
- **Dinâmico de cobrança (COB / COBV)**: o payload carrega uma URL `location` apontando pro PSP emissor da cobrança. O endpoint resolve essa URL, baixa o payload retornado pelo PSP e devolve em `cobLocation.payload`. O conteúdo vem em JWS assinado pelo PSP, mas a Woovi **não valida** a assinatura ICP-Brasil nem o domínio — se precisar dessa garantia, valide pelo seu lado a partir do `url`/`payload` retornado.
- **Pix Automático (REC)**: similar ao dinâmico, mas a `location` vem em outra tag do EMV (`unreservedTemplates`) e aponta para a estrutura de recorrência (idRec, periodicidade, contrato). O endpoint resolve e devolve em `recLocation.payload`.

- Faça a requisição passando a string do QR / Copia e Cola no campo `emv`:
```bash
curl -X POST "https://api.woovi.com/api/v1/decode/emv" \
  -H "Authorization: {APP_ID}" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "emv": "<string do QR Code ou Copia e Cola>"
  }'
```

Você pode acessar [aqui](https://developers.woovi.com/api#tag/decode/paths/~1api~1v1~1decode~1emv/post) a documentação referente a esse _endpoint_.

### O que é retornado ?

A resposta sempre traz o objeto `emv` com o payload parseado e, quando aplicável, `cobLocation` ou `recLocation` com os dados resolvidos no PSP emissor.

Exemplo de resposta para um QR dinâmico de cobrança imediata (COB):

```json
{
  "emv": {
    "payloadFormatIndicator": "01",
    "pointOfInitiationMethod": "12",
    "merchantAccountInformationPix": {
      "gui": "br.gov.bcb.pix",
      "url": "qr-h.woovi.digital/qr/v2/cob/fb274322-221c-43d4-b58b-fab36d87c75c"
    },
    "merchantCategoryCode": "0000",
    "transactionCurrency": "986",
    "transactionAmount": "10.00",
    "countryCode": "BR",
    "merchantName": "Fulano",
    "merchantCity": "Sao_Paulo",
    "additionalDataFieldTemplate": {
      "referenceLabel": "fb274322-221c-43d4-b58b-f"
    },
    "crc": "0C98"
  },
  "cobLocation": {
    "isValid": true,
    "locationErrors": [],
    "payload": {
      "calendar": {
        "presentation": "2025-02-25T13:27:54.168Z",
        "expiration": 86400,
        "creation": "2025-02-12T16:59:22.939Z"
      },
      "key": "4004901d-bd85-4769-8e52-cb4c42c506dc",
      "debtor": {
        "cpf": "62550186362",
        "name": "Fulano de Tal"
      },
      "additionalInfo": [
        { "name": "Entrega", "value": "Residencial" }
      ],
      "revision": 0,
      "status": "ATIVA",
      "txid": "d71a2ffd7a7b468eba993cef83428583",
      "value": { "original": "120.58" }
    },
    "url": "qr-h.woovi.digital/qr/v2/cob/fb274322-221c-43d4-b58b-fab36d87c75c"
  },
  "recLocation": null
}
```

Quando o QR é uma cobrança com vencimento (COBV), o `cobLocation.payload` traz campos adicionais — `calendar.dueDate`, `validityAfterDueDate`, subcampos de juros/multa/desconto em `value` e dados completos do recebedor. Esses campos vêm direto do PSP emissor da cobrança, então a presença depende do que o PSP devolve:

```json
{
  "emv": {
    "payloadFormatIndicator": "01",
    "pointOfInitiationMethod": "12",
    "merchantAccountInformationPix": {
      "gui": "br.gov.bcb.pix",
      "url": "qrcode.exemplo.com.br/v1/cobv/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
    },
    "merchantCategoryCode": "0000",
    "transactionCurrency": "986",
    "countryCode": "BR",
    "merchantName": "Fulano Comercio LTDA",
    "merchantCity": "FLORIANOPOLIS",
    "additionalDataFieldTemplate": {
      "referenceLabel": "***"
    },
    "crc": "F684"
  },
  "cobLocation": {
    "isValid": true,
    "locationErrors": [],
    "payload": {
      "calendar": {
        "dueDate": "2026-05-22",
        "validityAfterDueDate": 30,
        "creation": "2026-05-22T16:07:05.051Z",
        "presentation": "2026-05-22T16:07:05.051Z"
      },
      "value": {
        "original": "100.00",
        "final": "100.00",
        "interest": "0.00",
        "fine": "0.00",
        "discount": "0.00",
        "rebate": "0.00"
      },
      "receiver": {
        "street": "Rua Exemplo 123",
        "city": "Florianopolis",
        "state": "SC",
        "zipcode": "88000000",
        "cnpj": "00000000000191",
        "name": "Fulano Comercio LTDA"
      },
      "debtor": {
        "cpf": "00000000191",
        "name": "Maria Compradora"
      },
      "revision": 0,
      "key": "11111111-2222-3333-4444-555555555555",
      "txid": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      "status": "ATIVA"
    },
    "url": "qrcode.exemplo.com.br/v1/cobv/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
  },
  "recLocation": null
}
```

Exemplo de resposta para um QR de Pix Automático (REC):

```json
{
  "emv": {
    "payloadFormatIndicator": "01",
    "merchantAccountInformationPix": {
      "gui": "br.gov.bcb.pix",
      "pixKey": "f4c6089a-bfde-4c00-a2d9-9eaa584b0219",
      "additionalInformation": "CobrancaEstatica"
    },
    "merchantCategoryCode": "0000",
    "transactionCurrency": "986",
    "transactionAmount": "546.28",
    "countryCode": "BR",
    "merchantName": "Pix",
    "merchantCity": "BRASILIA",
    "additionalDataFieldTemplate": {
      "referenceLabel": "84767c56c2ab4e65b6670de2a"
    },
    "unreservedTemplates": {
      "gui": "br.gov.bcb.pix",
      "url": "qr-h.sandbox.pix.bcb.gov.br/rest/api/rec/4b62d4a088fe4f51bcb4c64cf0788691"
    },
    "crc": "4486"
  },
  "cobLocation": null,
  "recLocation": {
    "isValid": true,
    "locationErrors": [],
    "payload": {
      "updates": [
        { "date": "2025-10-24T18:42:58Z", "status": "CRIADA" }
      ],
      "calendar": {
        "startDate": "2025-10-24",
        "periodicity": "SEMANAL"
      },
      "idRec": "RN5481141720251024BnwNHejs9h9",
      "retryPolicy": "NAO_PERMITE",
      "receiver": {
        "cnpj": "44720743000101",
        "participantIspb": "54811417",
        "name": "Woovi Demo"
      },
      "value": { "valueRec": "0.01" },
      "link": {
        "contract": "Woovi Demo - Pix Automático",
        "debtor": {
          "cpf": "15775023706",
          "name": "Pedro Cliente"
        }
      }
    },
    "url": "qr-h.sandbox.pix.bcb.gov.br/rest/api/rec/4b62d4a088fe4f51bcb4c64cf0788691"
  }
}
```

Para QR estático sem location, `cobLocation` e `recLocation` voltam como `null` e a chave / valor / nome do recebedor já estão dentro de `emv` (campos `merchantAccountInformationPix.pixKey`, `transactionAmount`, `merchantName`).

### Quando combinar com a Verificação de Chave Pix

Se depois do decode você for efetivamente disparar um pagamento via API, use a [Verificação de Chave Pix](./check-pix-key.md) com a chave extraída — ela devolve o `pixKeyEndToEndId` exigido pelo endpoint de [Criar Pagamento](./payment-how-to-use-api-to-create.mdx).

## Prompt para IA

Copie o trecho abaixo numa IA de coding (Claude / Cursor / Gemini / ChatGPT) pra implementar a integração no seu app:

> Implemente uma função `decodePixCode(emv)` que aceita a string de um QR Code Pix ou copia e cola (formato BR Code) e devolve os dados do destinatário já parseados (chave Pix, valor, nome, banco), pronta pra preview antes de o usuário confirmar o pagamento.
>
> **Endpoint**: `POST https://api.woovi.com/api/v1/decode/emv`
> **Header**: `Authorization: <APP_ID>` e `Content-Type: application/json`
> **Body**: `{ "emv": "<string do QR Code ou copia e cola>" }`
>
> **A resposta sempre traz `emv` com o payload parseado**. Dependendo do tipo de QR, um dos dois objetos abaixo vem populado (o outro vem `null`):
>
> - **QR estático**: `cobLocation` e `recLocation` ambos `null`. A chave, valor e nome do recebedor já estão dentro de `emv.merchantAccountInformationPix.pixKey`, `emv.transactionAmount` e `emv.merchantName`.
> - **QR dinâmico de cobrança imediata (COB) ou com vencimento (COBV)**: `cobLocation.payload` traz os dados completos já resolvidos no PSP emissor — `calendar` (creation/presentation/expiration ou dueDate), `value.original` (e `value.final/interest/fine/discount/rebate` para COBV), `key` (chave do recebedor), `debtor`, `receiver`, `txid`, `status`.
> - **QR de Pix Automático (REC)**: `recLocation.payload` traz `idRec`, `calendar.periodicity` (`SEMANAL` / `MENSAL` / etc), `receiver`, `value.valueRec`, `link.contract`, `link.debtor`.
>
> Em todos os casos com location, `isValid` é `true` quando o PSP emissor respondeu e `false` quando não — trate como erro e mostre fallback.
>
> **UX recomendada**:
> - Para o usuário, mostre o valor e o nome do recebedor logo que o decode retornar, mesmo antes da confirmação final.
> - Se o BRcode for dinâmico, prefira os campos de `cobLocation.payload` ou `recLocation.payload` (vêm direto do PSP emissor, são autoritativos) sobre os campos dentro de `emv` (são só os do payload local).
> - Se for disparar um pagamento via API em seguida, chame o endpoint de Pix Check com a chave extraída pra obter o `pixKeyEndToEndId` (exigido pra criar pagamento).
>
> Trate erros 400 (EMV inválido) e 500 mostrando mensagem amigável e oferecendo entrada manual da chave.
