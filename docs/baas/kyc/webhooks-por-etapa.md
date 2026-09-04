---
id: webhooks-por-etapa
title: Webhooks por etapa do onboarding
tags:
  - baas
  - kyc
  - webhook
sidebar_position: 6
---

Entre "link de onboarding criado" e o desfecho da conta existem várias etapas que o lojista
precisa preencher. Um único evento — `ACCOUNT_REGISTER_STEP_UPDATED` — cobre todas elas, dizendo
no payload **qual** etapa mudou e **como**. Assim você monta o checklist do seu lojista e diz
exatamente o que falta, com **uma** assinatura de webhook em vez de uma por etapa.

Registre o evento com a **API Master** (veja [Webhooks por conta](../webhooks-por-conta.md)).

## `ACCOUNT_REGISTER_STEP_UPDATED`

Três campos identificam a etapa:

| Campo | O que é |
| --- | --- |
| `step` | qual etapa (tabela abaixo) |
| `stepStatus` | `COMPLETED` (o lojista concluiu) ou `BLOCKED` (algo está barrando) |
| `stepScope` | `COMPANY` ou `REPRESENTATIVE` — no segundo caso vem também o bloco `representative` |

### Etapas da empresa (`stepScope: "COMPANY"`)

| `step` | `COMPLETED` quando |
| --- | --- |
| `COMPANY_DATA` | os dados da empresa foram preenchidos |
| `ADDRESS` | o endereço da empresa está completo |
| `SOCIAL_CONTRACT` | o contrato social (ou o CCMEI, no caso de MEI) foi aceito |
| `BC_PROTEGE` | o BC Protege+ foi autorizado — CNPJ e todos os sócios administradores |
| `PARTNERS` | todos os sócios ativos estão completos |
| `TERMS` | os termos de uso foram aceitos |

`BC_PROTEGE` é a única etapa que também chega com `stepStatus: "BLOCKED"` — veja
[Quando o BC Protege+ está barrando](#quando-o-bc-protege-está-barrando).

### Etapas de cada sócio (`stepScope: "REPRESENTATIVE"`)

Estas vêm com um bloco `representative` com o CPF, para você saber de qual sócio se trata.

| `step` | `COMPLETED` quando |
| --- | --- |
| `REPRESENTATIVE_DOCUMENTS` | o documento de identificação do sócio foi enviado |
| `REPRESENTATIVE_FACEMATCH` | a selfie do sócio foi enviada |
| `REPRESENTATIVE_ADDRESS` | o endereço do sócio foi salvo |
| `PIX_AUTH` | a autenticação Pix do sócio administrador foi conferida |

### Ciclo de vida da conta

Estes continuam sendo eventos próprios: quem reage a eles normalmente não é o mesmo código que
desenha o checklist, e eles não pertencem a nenhuma etapa.

| Evento | Dispara quando |
| --- | --- |
| `ACCOUNT_REGISTER_SUBMITTED` | o lojista submeteu o onboarding: a conta entrou em análise |
| `ACCOUNT_REGISTER_IN_REVIEW` | a conta entrou em análise por outro caminho (um analista promoveu) |
| `ACCOUNT_REGISTER_DOCUMENTS_REQUESTED` | foram solicitados documentos. Lista o que foi pedido e o que voltou a pendente |
| `ACCOUNT_REGISTER_RFI_RESOLVED` | a solicitação de documentos foi atendida |
| `ACCOUNT_REGISTER_PENDING` | a conta está pendente de ação do lojista |
| `ACCOUNT_REGISTER_APPROVED` | a conta foi aprovada |
| `ACCOUNT_REGISTER_REJECTED` | a conta foi recusada |

## O payload

```json
{
  "event": "ACCOUNT_REGISTER_STEP_UPDATED",
  "accountRegister": {
    "accountRegisterId": "6a99c2616bd0772f866024b8",
    "correlationID": "seu-id-de-correlacao",
    "taxID": { "taxID": "00000000000000", "type": "BR:CNPJ" },
    "officialName": "EMPRESA EXEMPLO LTDA",
    "status": "PENDING",

    "completedSteps": ["COMPANY_DATA", "ADDRESS", "SOCIAL_CONTRACT", "BC_PROTEGE"],
    "pendingSteps": ["PARTNERS", "TERMS", "REVIEW"],

    "step": "PIX_AUTH",
    "stepStatus": "COMPLETED",
    "stepScope": "REPRESENTATIVE",
    "stepCompletedAt": "2026-09-03T18:57:44.000Z",

    "retrying": false,
    "retryCount": 0,

    "representative": {
      "taxID": { "taxID": "52998224725", "type": "BR:CPF" },
      "type": "ADMIN",
      "completedSteps": ["REPRESENTATIVE_FACEMATCH", "REPRESENTATIVE_DOCUMENTS", "REPRESENTATIVE_PIX_AUTH"]
    }
  }
}
```

Filtrar é um `if`:

```js
if (body.event === 'ACCOUNT_REGISTER_STEP_UPDATED' && body.accountRegister.step === 'PIX_AUTH') {
  // ...
}
```

`completedSteps` e `pendingSteps` juntos são o que permite renderizar o checklist inteiro a
partir de um único evento. `pendingSteps` já respeita o que **aquela** conta deve: um MEI não
recebe `SOCIAL_CONTRACT` na lista, e uma empresa que não usa BC Protege+ não recebe `BC_PROTEGE`.

:::note `step` x `completedSteps`
`step` é o nome público da etapa; `completedSteps` traz os nomes como estão gravados na conta e
por isso é mais granular em dois casos — `REPRESENTATIVE_ADDRESS_PROOF` (endereço do sócio com
comprovante anexado) aparece lá como tal, e a autenticação Pix aparece como
`REPRESENTATIVE_PIX_AUTH`. Para lógica de negócio, use `step`.
:::

## `retrying`: quando a conta é devolvida

Uma conta pode entrar em análise, receber um pedido de documento e voltar a ficar pendente. Quando
o lojista refaz a etapa, **o evento dela sai de novo** — e vem marcado como retentativa.

```
ACCOUNT_REGISTER_PENDING              a conta voltou, com o motivo
ACCOUNT_REGISTER_DOCUMENTS_REQUESTED  invalidatedSteps: ["REPRESENTATIVE_DOCUMENTS", "PARTNERS"]
      ... o lojista reenvia o documento ...
ACCOUNT_REGISTER_STEP_UPDATED         step: REPRESENTATIVE_DOCUMENTS, retrying: true, retryCount: 1
ACCOUNT_REGISTER_STEP_UPDATED         step: PARTNERS, retrying: true, retryCount: 1
ACCOUNT_REGISTER_RFI_RESOLVED
ACCOUNT_REGISTER_IN_REVIEW
```

Três coisas que vale entender sobre isso:

**`retrying` é por etapa, não por conta.** Uma devolução que pediu só o contrato social não
marca `TERMS` como retentativa. Só as etapas que de fato foram invalidadas voltam marcadas.

**`retryCount` conta devoluções, não reenvios.** É quantas vezes a conta foi mandada de volta ao
lojista. Serve para o seu suporte saber que está na terceira tentativa.

**Reenviar sem uma nova devolução não emite nada.** Cada etapa concluída emite exatamente um
evento por ciclo — repetir a mesma ação não duplica o webhook.

:::tip Como usar isso na prática
Trate `retrying: true` como "o lojista corrigiu algo que havia sido recusado" e
`invalidatedSteps` (no `ACCOUNT_REGISTER_DOCUMENTS_REQUESTED`) como "estas etapas voltaram a
pendente". Com esses dois campos você avisa o lojista na hora, sem esperar o reenvio.
:::

## Quando o BC Protege+ está barrando

Com `stepStatus: "BLOCKED"`, o `BC_PROTEGE` traz um bloco `bcProtection` dizendo exatamente quem
ainda não autorizou:

```json
{
  "event": "ACCOUNT_REGISTER_STEP_UPDATED",
  "accountRegister": {
    "step": "BC_PROTEGE",
    "stepStatus": "BLOCKED",
    "stepScope": "COMPANY",
    "bcProtection": {
      "scope": "CNPJ",
      "unauthorizedTaxID": "00000000000000",
      "situation": "UNVERIFIED"
    }
  }
}
```

`scope` é `CNPJ` quando falta a autorização da empresa e `REPRESENTATIVE` quando falta a de um
sócio. Quando o CNPJ autoriza mas um sócio ainda não, você recebe um novo `BLOCKED` apontando
para o sócio — cada bloqueio distinto é anunciado uma vez.

Quando tudo libera, chega o mesmo evento com `stepStatus: "COMPLETED"` e `BC_PROTEGE` passa a
aparecer em `completedSteps`.

## Assinatura

Como todo webhook da Woovi, estes vêm assinados no header `x-webhook-signature`. Veja
[Validando a assinatura](../../webhook/webhook-headers.mdx).
