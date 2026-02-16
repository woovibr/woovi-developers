---
id: subaccount-withdraw-blocked
title: Por que o saque da subconta foi bloqueado?
tags:
  - api
  - subaccount
  - saque
  - withdraw
---

Uma subconta precisa ter uma chave pix válida e existente para que o saque seja realizado. Quando uma tentativa de saque é feita e a chave pix da subconta não é encontrada no DICT (Diretório de Identificadores de Contas Transacionais) do Banco Central, o campo `withdrawBlocked` da subconta é marcado como `true` e todas as tentativas futuras de saque serão bloqueadas imediatamente.

## Por que o bloqueio acontece?

Cada consulta de chave pix no DICT consome tokens do limitador de taxa da sua conta. Quando a chave pix não existe, o custo em tokens é significativamente maior. Para proteger a sua conta de esgotar os tokens disponíveis com tentativas repetidas para chaves inválidas, a subconta é bloqueada automaticamente após a primeira tentativa sem sucesso.

O bloqueio também acontece quando a chave pix está associada a uma conta restrita por fraude pelo Banco Central.

### Códigos de erro que causam o bloqueio

| Código do Erro | Descrição |
| --- | --- |
| `PIX_KEY_INFO_NOT_FOUND` | A chave pix não está registrada em nenhuma instituição bancária |
| `ENTRY_ASSOCIATED_WITH_RESTRICTED_ACCOUNT_OR_USER` | A conta associada à chave pix está restrita por fraude pelo Banco Central |

## Como verificar o status do bloqueio?

O campo `withdrawBlocked` pode ser visualizado tanto pela API quanto pela plataforma.

### Via API

Ao consultar uma subconta pelo endpoint `GET /api/v1/subaccount/{id}`, o campo `withdrawBlocked` será retornado na resposta:

```json
{
  "subAccount": {
    "id": "...",
    "pixKey": "...",
    "withdrawBlocked": true
  }
}
```

O campo também é retornado ao listar todas as subcontas pelo endpoint `GET /api/v1/subaccount`.

### Via Plataforma

O status de bloqueio de saque também pode ser visualizado diretamente na plataforma, nos detalhes da subconta.

## Recomendação

Se você identificar que a chave pix de uma subconta está inválida, retire todo o saldo da subconta. Mesmo após o bloqueio, os endpoints de `/credit` e `/debit` continuam funcionando normalmente — apenas o saque via `/withdraw` é bloqueado.

## Como desbloquear?

Para desbloquear o saque da subconta, é necessário atualizar a chave pix da subconta para uma chave válida e existente e entrar em contato com o suporte técnico.
