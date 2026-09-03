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
precisa preencher. Cada uma emite seu próprio webhook, então você pode montar o checklist do
seu lojista e dizer exatamente o que falta — sem consultar o console e sem dar suporte no escuro.

Registre esses eventos com a **API Master** (veja [Webhooks por conta](../webhooks-por-conta.md)).

## Eventos de etapa

### Etapas da empresa

| Evento | Dispara quando |
| --- | --- |
| `ACCOUNT_REGISTER_STEP_COMPANY_DATA` | os dados da empresa foram preenchidos |
| `ACCOUNT_REGISTER_STEP_ADDRESS` | o endereço da empresa está completo |
| `ACCOUNT_REGISTER_STEP_SOCIAL_CONTRACT` | o contrato social (ou o CCMEI, no caso de MEI) foi aceito |
| `ACCOUNT_REGISTER_STEP_BC_PROTEGE` | o BC Protege+ foi autorizado — CNPJ e todos os sócios administradores |
| `ACCOUNT_REGISTER_STEP_BC_PROTEGE_BLOCKED` | o BC Protege+ está barrando. O payload diz **quem** falta autorizar |
| `ACCOUNT_REGISTER_STEP_PARTNERS` | todos os sócios ativos estão completos |
| `ACCOUNT_REGISTER_STEP_TERMS` | os termos de uso foram aceitos |

### Etapas de cada sócio

Estes vêm com `stepScope: "REPRESENTATIVE"` e um bloco `representative` com o CPF, para você
saber de qual sócio se trata.

| Evento | Dispara quando |
| --- | --- |
| `ACCOUNT_REGISTER_STEP_REPRESENTATIVE_DOCUMENTS` | o documento de identificação do sócio foi enviado |
| `ACCOUNT_REGISTER_STEP_REPRESENTATIVE_FACEMATCH` | a selfie do sócio foi enviada |
| `ACCOUNT_REGISTER_STEP_REPRESENTATIVE_ADDRESS` | o endereço do sócio foi salvo |
| `ACCOUNT_REGISTER_STEP_PIX_AUTH` | a autenticação Pix do sócio administrador foi conferida |

### Ciclo de vida da conta

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
  "event": "ACCOUNT_REGISTER_STEP_PIX_AUTH",
  "accountRegister": {
    "accountRegisterId": "6a99c2616bd0772f866024b8",
    "correlationID": "seu-id-de-correlacao",
    "taxID": { "taxID": "00000000000000", "type": "BR:CNPJ" },
    "officialName": "EMPRESA EXEMPLO LTDA",
    "status": "PENDING",

    "completedSteps": ["COMPANY_DATA", "ADDRESS", "SOCIAL_CONTRACT", "BC_PROTEGE"],
    "pendingSteps": ["PARTNERS", "TERMS", "REVIEW"],

    "step": "REPRESENTATIVE_PIX_AUTH",
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

`completedSteps` e `pendingSteps` juntos são o que permite renderizar o checklist inteiro a
partir de um único evento. `pendingSteps` já respeita o que **aquela** conta deve: um MEI não
recebe `SOCIAL_CONTRACT` na lista, e uma empresa que não usa BC Protege+ não recebe `BC_PROTEGE`.

## `retrying`: quando a conta é devolvida

Uma conta pode entrar em análise, receber um pedido de documento e voltar a ficar pendente. Quando
o lojista refaz a etapa, **o evento dela sai de novo** — e vem marcado como retentativa.

```
ACCOUNT_REGISTER_PENDING                        a conta voltou, com o motivo
ACCOUNT_REGISTER_DOCUMENTS_REQUESTED            invalidatedSteps: ["REPRESENTATIVE_DOCUMENTS",
                                                                   "PARTNERS"]
      ... o lojista reenvia o documento ...
ACCOUNT_REGISTER_STEP_REPRESENTATIVE_DOCUMENTS  retrying: true, retryCount: 1
ACCOUNT_REGISTER_STEP_PARTNERS                  retrying: true, retryCount: 1
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

`ACCOUNT_REGISTER_STEP_BC_PROTEGE_BLOCKED` traz um bloco `bcProtection` dizendo exatamente quem
ainda não autorizou:

```json
{
  "event": "ACCOUNT_REGISTER_STEP_BC_PROTEGE_BLOCKED",
  "accountRegister": {
    "step": "BC_PROTEGE",
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
sócio. Quando o CNPJ autoriza mas um sócio ainda não, você recebe um novo `_BLOCKED` apontando
para o sócio — cada bloqueio distinto é anunciado uma vez.

Quando tudo libera, chega o `ACCOUNT_REGISTER_STEP_BC_PROTEGE` e `BC_PROTEGE` passa a aparecer em
`completedSteps`.

## Assinatura

Como todo webhook da Woovi, estes vêm assinados no header `x-webhook-signature`. Veja
[Validando a assinatura](../../webhook/webhook-headers.mdx).
