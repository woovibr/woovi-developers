---
id: woovi-apps-how-to-create
sidebar_position: 1
title: Como criar um WooviApp?
tags:
  - woovi-apps
  - oauth
  - integrations
---

## Criando um WooviApp

Para integrar sua aplicação à conta Woovi de outras empresas via OAuth, você precisa primeiro registrar um WooviApp na loja de apps.

Acesse [store.woovi.com/create](https://store.woovi.com/create) (opção "Novo" dentro de "Meus apps") para cadastrar um novo aplicativo.

## Campos do formulário

- **Nome do app** — obrigatório.
- **Descrição** — opcional, exibida na tela de consentimento.
- **Site** — opcional.
- **Categoria** — opcional: `Automação`, `Vendas`, `Financeiro`, `Analytics`, `Conteúdo & IA` ou `Segurança`.
- **URL do logo** — opcional. Quando não informada, o avatar exibe a inicial do nome do app sobre a cor escolhida.
- **Cor do avatar** — opcional, usada como fallback quando não há logo.

## Redirect URIs

É obrigatório cadastrar ao menos uma URI de redirecionamento. É para essas URLs que a empresa será redirecionada após autorizar (ou negar) o acesso do seu app, com o parâmetro `code` (ou `error`) anexado à query string.

> Somente URIs cadastradas aqui podem ser usadas no fluxo de autorização. Veja [Como funciona o fluxo de autorização de um WooviApp](./woovi-apps-how-to-authorize.md).

### Dados enviados no callback

Ao final do fluxo de autorização, a Woovi redireciona a empresa de volta para a `redirect_uri` com um dos seguintes formatos de query string:

- **Autorização concedida**:

  ```
  {redirect_uri}?code={authorizationCode}
  ```

  - **`code`**: um código de autorização de uso único, que expira em 10 minutos. Seu backend deve trocá-lo por uma aplicação da API da Woovi via `POST https://api.woovi.com/api/v1/woovi-apps/application`. Veja [Como funciona o fluxo de autorização de um WooviApp](./woovi-apps-how-to-authorize.md).

- **Autorização negada**:

  ```
  {redirect_uri}?error=access_denied
  ```

  - **`error`**: sempre `access_denied` quando a empresa nega o consentimento explicitamente.

Nenhum outro dado (como `client_id`, escopos ou informações da empresa) é enviado no callback — apenas `code` ou `error`. A identificação da empresa só fica disponível depois de trocar o `code` pela aplicação da API da Woovi (veja a resposta da troca em [Como funciona o fluxo de autorização de um WooviApp](./woovi-apps-how-to-authorize.md)).

## Permissões (scopes)

As permissões disponíveis fazem parte de um catálogo fixo, agrupado por recurso (`ACCOUNT`, `CHARGE`, `PAYMENT`, `PIX_KEY`, `SUBACCOUNT`, `WEBHOOK`, entre outros). Para cada permissão do catálogo, você escolhe um dos três níveis:

- **Obrigatória**: sempre concedida quando a empresa autoriza o app, sem opção de recusa individual pela empresa.
- **Opcional**: a empresa pode optar por conceder ou não no momento da autorização.
- **Nenhum** (padrão): a permissão não é solicitada pelo app.

O app precisa declarar ao menos uma permissão, obrigatória ou opcional, para ser criado. Se alguma permissão declarada não existir no catálogo, a criação falha com o erro `Scope not permitted: "<scope>"`.

### Permissões bloqueadas

As seguintes permissões não fazem parte do catálogo e não podem ser solicitadas por nenhum WooviApp, nem como obrigatórias nem como opcionais, por permitirem ações sensíveis como movimentação de fundos, exclusão de recursos ou escalonamento de privilégios:

- `ACCOUNT_WITHDRAW_POST`
- `ACCOUNT_DELETE`
- `ACCOUNT_REGISTER_DELETE`
- `APPLICATION_POST`
- `APPLICATION_DELETE`
- `PARTNER_COMPANY_POST`
- `PARTNER_APPLICATION_POST`
- `PAYMENT_POST`
- `PAYMENT_APPROVE_POST`
- `SUBACCOUNT_WITHDRAW_POST`
- `SUBACCOUNT_DELETE`
- `SUBACCOUNT_TRANSFER_POST`
- `SUBACCOUNT_DEBIT_POST`
- `SUBACCOUNT_CREDIT_POST`
- `TRANSFER_POST`
- `KYC_ONBOARDING_POST`

Num exemplo prático, os dados enviados na criação seguiriam semelhante a este:

```json
{
  "name": "Meu Integrador",
  "description": "Sincroniza pagamentos com meu ERP",
  "redirectUris": ["https://meuapp.com/callback"],
  "requiredScopes": ["CHARGE_GET", "CHARGE_GET_LIST"],
  "optionalScopes": ["PAYMENT_GET"],
  "category": "AUTOMATION",
  "website": "https://meuapp.com"
}
```

## Resposta: Client ID e Client Secret

Ao criar o app com sucesso, a resposta traz o `clientId` do app e o `clientSecret` gerado:

```json
{
  "wooviApp": {
    "clientId": "a1b2c3d4e5f6...",
    "name": "Meu Integrador"
  },
  "clientSecret": "9f8e7d6c5b4a..."
}
```

:::caution
O `clientSecret` é exibido **apenas uma vez**, no momento da criação. A Woovi armazena apenas o hash (SHA-256) do secret — se você perdê-lo, não há como recuperá-lo, sendo necessário cadastrar um novo app. Salve as credenciais em local seguro antes de fechar a tela de confirmação.
:::

## Próximos passos

Com o `clientId` e o `clientSecret` em mãos, seu app está pronto para iniciar o fluxo de autorização e solicitar acesso à conta de uma empresa. Veja [Como funciona o fluxo de autorização de um WooviApp](./woovi-apps-how-to-authorize.md).
