---
id: check-account-data
sidebar_position: 3
title: Validação de Dados Bancários
tags:
  - payment
  - api
---

Este documento explica como validar uma chave Pix ou uma conta bancária (agência e conta) antes de pagar.

A validação envia um Pix de **R$ 0,01** para o destino e espera a instituição recebedora aceitar ou recusar. Assim você sabe se a conta existe e pode receber Pix e, no caso de agência e conta, se ela pertence ao CPF/CNPJ informado.

A funcionalidade precisa ser habilitada para a sua empresa, junto com Pix out, e a aplicação precisa do escopo `ACCOUNT_DATA_CHECK_POST`. Veja [Como solicitar acesso a pagamentos](./payment-how-to-request-access.md).

Para só consultar o titular de uma chave Pix, sem enviar Pix, use a [Verificação de Chave Pix](./check-pix-key.md).

## Validando uma chave Pix

```bash
curl -X POST "https://api.woovi.com/api/v1/account-data-check" \
  -H "Authorization: {APP_ID}" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "correlationID": "validacao-1",
    "pixKey": "fulano@example.com",
    "pixKeyType": "EMAIL"
  }'
```

Envie sempre o `pixKeyType`. Para CPF e celular ele é importante, porque 11 dígitos podem ser um CPF válido e um celular ao mesmo tempo: envie CPF só com os dígitos e celular no formato internacional (`+5511912345684`). Veja [Formato da chave Pix](./pix-key-format.md).

Valores aceitos em `pixKeyType`: `CPF`, `CNPJ`, `EMAIL`, `PHONE` e `RANDOM` (chave aleatória).

## Validando agência e conta

```bash
curl -X POST "https://api.woovi.com/api/v1/account-data-check" \
  -H "Authorization: {APP_ID}" \
  -H "Content-Type: application/json" \
  --data-raw '{
    "correlationID": "validacao-2",
    "holder": {
      "name": "Fulano de Tal",
      "taxID": { "type": "BR:CPF", "taxID": "11144477735" }
    },
    "account": {
      "branch": "0001",
      "account": "123456",
      "accountType": "CACC"
    },
    "psp": {
      "id": "001",
      "name": "Banco do Brasil S.A."
    }
  }'
```

- `branch`: agência com 4 dígitos, sem o dígito verificador.
- `account`: conta só com números, com o dígito verificador.
- `accountType`: `CACC` (conta corrente), `SVGS` (poupança), `SLRY` (salário) ou `TRAN` (conta de pagamento, comum em bancos digitais).
- `psp.id`: código COMPE (3 dígitos) ou ISPB (8 dígitos) do banco.

Quando `pixKey` é enviada, `holder`, `account` e `psp` são ignorados.

Você pode acessar [aqui](/api#tag/payment-request-access/POST/api/v1/account-data-check) a documentação referente a esse _endpoint_.

## O que é retornado?

A requisição espera até 10 segundos pelo resultado:

```json
{
  "accountDataCheck": {
    "correlationID": "validacao-2",
    "status": "VALID",
    "valid": true,
    "reason": null,
    "endToEndId": "E54811417202610281934RGw6Ky9Qlu3",
    "attempts": 1,
    "fee": 100,
    "createdAt": "2026-10-28T19:34:37.537Z"
  }
}
```

Quando a instituição recusa os dados, `reason` traz o código e a descrição da recusa. A descrição, assim como o `error`, vem no idioma da sua empresa: no seu código, trate o resultado pelo `status` e pelo `reason.code`, nunca pelo texto.

```json
{
  "accountDataCheck": {
    "correlationID": "validacao-2",
    "status": "INVALID",
    "valid": false,
    "reason": { "code": "AC03", "description": "Número da conta do recebedor inválido" },
    "endToEndId": "E54811417202610281934RGw6Ky9Qlu3",
    "attempts": 1,
    "fee": 100,
    "createdAt": "2026-10-28T19:34:37.537Z"
  }
}
```

| `status` | `valid` | O que significa |
|---|---|---|
| `VALID` | `true` | A instituição recebedora aceitou o Pix. |
| `INVALID` | `false` | A instituição recusou os dados da conta (`AC03`, `AC06`, `AC07`, `AC14`, `AG03`, `BE01`, `CH11`). O código e a descrição vêm em `reason`. |
| `INCONCLUSIVE` | `null` | O Pix foi recusado por um motivo que não diz nada sobre a conta (por exemplo `AB03`, `DS04`, `FRAD`), ou não chegou a sair. A resposta traz também `error`, com a orientação do que fazer. Chame de novo com o mesmo `correlationID` para enviar um novo Pix de R$ 0,01, sem nova taxa. |
| `PENDING` | `null` | O resultado não chegou a tempo. Chame de novo com o mesmo `correlationID` para consultar. |

Uma chave Pix que não está registrada no DICT não chega a receber o Pix: a resposta é `400` com o `error` explicando, sem `accountDataCheck` e sem taxa.

## O `correlationID`

- Repetir a chamada com o **mesmo** `correlationID` e o **mesmo** corpo devolve a validação como está, sem enviar um novo Pix e sem cobrar de novo. Só um resultado `INCONCLUSIVE` envia um novo Pix.
- Repetir o `correlationID` com **qualquer dado diferente** (outra chave, outro tipo de chave, outra conta ou outro titular) devolve `400`. Depois de corrigir os dados, use um `correlationID` novo.

## Custo

- O Pix de R$ 0,01 conta para os limites de Pix out da conta. Se a instituição recusar, o R$ 0,01 volta para o seu saldo; a taxa da validação não volta.
- A taxa da validação é cobrada uma vez por `correlationID`, quando o primeiro Pix sai, qualquer que seja a resposta da instituição. O valor aparece em `fee`, em centavos (`null` enquanto ainda não foi cobrado).

## Erros possíveis

Os erros voltam com o campo `error`.

- `400`: dados inválidos ou chave Pix não encontrada; `correlationID` já usado com outros dados; a aplicação não tem conta padrão ou a conta não é uma conta Woovi; saldo insuficiente; limites de Pix out atingidos; Pix out desabilitado na conta.
- `401`: aplicação inválida, ou a empresa exige IP permitido na aplicação para movimentar saída e nenhum foi configurado.
- `403`: a empresa não tem Pix out ou a validação de dados bancários habilitados, ou a aplicação não tem o escopo `ACCOUNT_DATA_CHECK_POST`.
