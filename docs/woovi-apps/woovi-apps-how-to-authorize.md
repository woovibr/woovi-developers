---
id: woovi-apps-how-to-authorize
sidebar_position: 2
title: Como funciona o fluxo de autorização de um WooviApp?
tags:
  - woovi-apps
  - oauth
  - authorize
  - token
---

## Fluxo de autorização

Depois de [criar seu WooviApp](./woovi-apps-how-to-create.md) e obter `clientId`/`clientSecret`, seu app pode solicitar acesso à conta Woovi de uma empresa através de um fluxo de autorização no estilo OAuth 2.0 (_authorization code_).

## 1. Redirecionando a empresa para a tela de consentimento

Redirecione a empresa (a merchant que vai autorizar seu app) para:

```
https://store.woovi.com/authorize?client_id={clientId}&redirect_uri={redirectUri}&scope={scopes}&company_id={companyId}
```

Parâmetros de query:

- **`client_id`** _(obrigatório)_: o Client ID do seu WooviApp.
- **`redirect_uri`** _(obrigatório)_: uma das URIs cadastradas na criação do app. Se não corresponder a nenhuma URI registrada, a tela de consentimento retorna erro e a autorização não prossegue.
- **`scope`** _(opcional)_: lista de permissões separadas por espaço ou vírgula, restrita às permissões **opcionais** declaradas pelo app. As permissões obrigatórias são sempre solicitadas, independente deste parâmetro. Quando omitido, todas as permissões opcionais do app vêm pré-selecionadas na tela.
- **`company_id`** _(opcional)_: identificador da empresa que está autorizando. Quando omitido, a Woovi usa a empresa da sessão autenticada no momento.

:::info
A empresa precisa estar autenticada na Woovi (sessão via cookie) para chegar à tela de consentimento. Sem sessão ativa e sem `company_id` na URL, a tela exibe o aviso "nenhum contexto de empresa encontrado".
:::

## 2. Comportamento da tela de consentimento

A tela exibe o nome, logo, site e descrição do app, além de duas listas de permissões:

- **Obrigatórias**: sempre marcadas, sem opção de desativar.
- **Opcionais**: cada uma com um _toggle_ individual, iniciando marcada ou não conforme o parâmetro `scope` recebido.

Se a empresa já havia autorizado esse app anteriormente, a tela mostra um estado de "app já autorizado", oferecendo apenas as opções de reautorizar ou cancelar.

## 3. Aprovação ou negação

- **Autorizar**: ao confirmar, a Woovi valida que todas as permissões solicitadas fazem parte do que o app declarou (obrigatórias + opcionais), gera um `authorizationCode` de uso único e redireciona a empresa para:

  ```
  {redirect_uri}?code={authorizationCode}
  ```

- **Negar**: redireciona a empresa para:

  ```
  {redirect_uri}?error=access_denied
  ```

:::caution
O `authorizationCode` expira em **10 minutos** e só pode ser trocado por uma aplicação da API da Woovi uma única vez. Se as permissões solicitadas excederem o que o app declarou na criação, a autorização é rejeitada com o erro `Requested scopes exceed what the app declared`.
:::

## 4. Trocando o código por uma aplicação da API da Woovi

Com o `code` recebido no `redirect_uri`, seu backend cria diretamente uma aplicação da API da Woovi (com `clientId`/`clientSecret` próprios, escopados pelas permissões concedidas) para consumir a [API pública da Woovi](https://api.woovi.com). A troca do `code` pelo token de acesso acontece internamente, servidor a servidor — você não precisa (nem consegue) chamar esse passo intermediário diretamente:

```
POST https://api.woovi.com/api/v1/woovi-apps/application
Content-Type: application/json
Authorization: {seu appID}
```

Authorization: Você precisa de um appID da sua empresa com o escopo WOOVI_APP_APPLICATION_POST para poder fazer essa troca.

```json
{
  "code": "authorization-code-recebido",
  "client_id": "seu-client-id",
  "client_secret": "seu-client-secret"
}
```

- **`code`**, **`client_id`**, **`client_secret`** _(obrigatórios)_: o código de autorização recebido no callback e as credenciais do seu WooviApp. A Woovi valida essas informações antes de prosseguir.

O nome da aplicação criada é gerado automaticamente a partir da empresa dona do WooviApp, o tipo é sempre `API`, e os escopos são exatamente os que a empresa concedeu na tela de autorização — não há como sobrescrever nenhum desses valores por esta rota.

Resposta (`201`):

```json
{
  "application": {
    "name": "WooviApp - Minha Empresa",
    "isActive": true,
    "type": "API",
    "clientId": "a1b2c3d4e5f6...",
    "clientSecret": "9f8e7d6c5b4a...",
    "appID": "...",
    "scopes": ["CHARGE_GET", "CHARGE_GET_LIST"]
  }
}
```

Possíveis erros: `invalid_request` (faltam `code`, `client_id` ou `client_secret`), `invalid_client` (client_id/secret inválidos), `invalid_grant` (código inexistente, expirado ou já utilizado) e `unsupported_grant_type` (não deveria ocorrer neste fluxo, mas é retornado por completude caso o tipo de concessão internamente usado não seja suportado).

:::caution
O `clientSecret` desta aplicação também é exibido apenas nesta resposta — armazene-o com segurança. Use `clientId`/`clientSecret` (ou o `appID`) para autenticar as próximas chamadas na [API pública da Woovi](https://api.woovi.com), já restritas aos escopos concedidos pela empresa.
:::

## Revogação

A empresa pode revogar o acesso concedido a um app a qualquer momento pela tela de apps autorizados em [store.woovi.com/authorized-apps](https://store.woovi.com/authorized-apps). A revogação invalida o _access token_ imediatamente.
