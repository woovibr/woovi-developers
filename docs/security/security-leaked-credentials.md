---
id: security-leaked-credentials
title: "Credencial exposta ou vazada: como remediar"
sidebar_label: Credencial vazada
tags:
  - security
  - api
  - leaked-credentials
  - remediation
---

Esta é a documentação pública de remediação da Woovi para credenciais expostas.
Use esta página se um AppID, `clientSecret` ou secret key de webhook da Woovi foi
publicado em um repositório público, log, ticket, print, pacote npm/composer,
bundle de frontend, ou detectado por uma ferramenta de _secret scanning_.

:::danger Trate como comprometida
Qualquer credencial que saiu do seu ambiente controlado deve ser considerada
comprometida, mesmo que o repositório fosse privado, mesmo que o commit tenha
sido revertido e mesmo que o vazamento tenha durado poucos minutos. Reescrever o
histórico do Git **não** remedia o vazamento — só a rotação da credencial remedia.
:::

## Resumo (faça agora)

1. **Rotacione ou revogue** a credencial no painel da Woovi — isso invalida a credencial exposta imediatamente.
2. **Atualize seus sistemas** com a nova credencial.
3. **Revise o extrato, as transações e a auditoria** do período em que a credencial ficou exposta e, se encontrar qualquer atividade que não reconhece, escreva para [security@woovi.com](mailto:security@woovi.com).

## 1. Identifique o tipo de credencial

| Credencial | Onde é usada | Como reconhecer | Risco |
| - | - | - | - |
| **AppID de API** | Header `Authorization` das chamadas a `api.woovi.com` | String base64 que decodifica para `Client_Id_<uuid>:Client_Secret_<...>` | **Alto** — permite chamar a API em nome da sua empresa, dentro dos escopos atribuídos |
| **AppID de Plugin** | Frontend / checkout | Mesmo formato do AppID de API | **Baixo/Médio** — é público por design e só acessa rotas de plugin, mas recomendamos rotacionar |
| **`clientSecret` de WooviApp** (OAuth) | Backend do seu app, na troca do `code` | Retornado uma única vez na criação do app em [store.woovi.com](https://store.woovi.com/create) | **Alto** — permite se passar pelo seu app no fluxo OAuth |
| **`clientId` / `clientSecret` de Limites de Conta** | HTTP Basic Auth (`Authorization: Basic ...`) | Par de credenciais criado no painel de limites | **Alto** |
| **Secret key HMAC de Webhook** | Validação do header `X-OpenPix-Signature` | Secret exibido no detalhe do webhook em `API/Plugins` | **Médio** — permite forjar webhooks que o seu sistema aceitaria como legítimos |

Se você não conseguir identificar o tipo, trate como AppID de API (o cenário mais
sensível) e siga o passo 2.

## 2. Rotacione ou revogue a credencial

### AppID de API ou de Plugin

Rotacionar gera um novo AppID e **invalida o antigo imediatamente**:

1. Acesse [app.woovi.com](https://app.woovi.com.br/home/applications/tab/list) e vá em **API/Plugins → API/Plugins**.
2. Selecione a aplicação cuja chave foi exposta.
3. Clique em **Regerar AppID**.
4. Confirme com o seu segundo fator de autenticação (2FA).
5. Copie o novo AppID — ele é exibido apenas nesse momento.

Se a integração não é mais usada, prefira **remover a aplicação** em vez de
rotacionar. Você também pode remover a aplicação pela API, autenticando com o
próprio AppID exposto:

```bash
curl --request DELETE \
  --url https://api.woovi.com/api/v1/application \
  --header 'Authorization: APPID_EXPOSTO'
```

Essa rota exige o escopo `APPLICATION_DELETE`. A aplicação _master_ da empresa
não pode ser removida — nesse caso, rotacione pelo painel.

:::tip
Se a mesma credencial estava em uso por várias integrações, crie um AppID por
integração antes de rotacionar. Assim o próximo incidente afeta apenas um sistema.
:::

### `clientSecret` de WooviApp (OAuth)

O `clientSecret` é exibido apenas uma vez na criação e a Woovi armazena somente o
hash SHA-256 dele — não há como recuperá-lo nem rotacioná-lo. Para remediar:

1. Cadastre um novo app em [store.woovi.com/create](https://store.woovi.com/create) com as mesmas _redirect URIs_ e permissões.
2. Migre seu backend para o novo `clientId` / `clientSecret`.
3. Remova o app antigo.

Cada empresa que autorizou o seu app pode revogar o acesso a qualquer momento em
[store.woovi.com/authorized-apps](https://store.woovi.com/authorized-apps), e a
revogação invalida o _access token_ imediatamente. Oriente seus clientes a
revogar o app antigo depois da migração.

### `clientId` / `clientSecret` de Limites de Conta

Crie um novo par de credenciais no painel, atualize sua integração e remova o par
exposto.

### Secret key HMAC de Webhook

A secret key faz parte da configuração do webhook. Para trocá-la, remova o
webhook e cadastre-o novamente — o novo webhook recebe uma nova secret key.
Consulte [Validando Webhook payload usando HMAC-SHA1](../webhook/seguranca/webhook-hmac.mdx).

Considere migrar para a validação por
[chave pública (`x-webhook-signature`)](../webhook/seguranca/webhook-signature-validation.mdx),
que não depende de um secret compartilhado e portanto não pode vazar do seu lado.

## 3. Avalie o impacto

Com a credencial rotacionada, verifique o que aconteceu enquanto ela estava exposta:

- **Extrato e transações** — procure cobranças, pagamentos, saques ou reembolsos que você não reconhece.
- **Auditoria** — todas as ações na plataforma são auditadas com IP e geolocalização.
- **Sessões** — confira as sessões ativas e os alertas de login de dispositivos ou locais desconhecidos.
- **Webhooks** — se a secret key HMAC vazou, revise os eventos que seu sistema processou no período.

Encontrou algo suspeito? Escreva imediatamente para
[security@woovi.com](mailto:security@woovi.com) com o AppID afetado (nunca o
valor completo da credencial), a janela de tempo e o que você observou.

## 4. Previna o próximo vazamento

- **Nunca versione credenciais.** Use variáveis de ambiente ou um gerenciador de segredos.
- **Restrinja escopos.** Um AppID sem escopos definidos tem acesso completo às rotas do seu tipo de aplicação. Veja [Adicionando escopos ao seu AppID](../apis/api-scopes.md).
- **Restrinja IPs.** Libere apenas os IPs dos seus servidores. Veja [Adicionando filtro de IP à sua API](../apis/api-security-ip-whitelist.md).
- **Uma chave por integração.** Não reutilize AppIDs entre serviços ou ambientes.
- **Desative chaves não utilizadas.**
- **Nunca use um AppID de API no frontend.** Para frontend existe o tipo Plugin.
- **Habilite MFA** para todos os usuários da sua empresa. Veja [Autenticação multi-fator](./security-user-mfa.md).
- **Ative o _secret scanning_** no seu provedor de Git para ser avisado antes de nós.

## 5. Fale com a Woovi

| Assunto | Canal |
| - | - |
| Credencial vazada, atividade suspeita, incidente de segurança | [security@woovi.com](mailto:security@woovi.com) · [infosec@woovi.com](mailto:infosec@woovi.com) |
| Divulgação responsável de vulnerabilidade | [security@woovi.com](mailto:security@woovi.com) |
| Dúvidas de integração e suporte | [ajuda.woovi.com](https://ajuda.woovi.com) |

## Para plataformas de _secret scanning_

Esta página é a URL canônica de remediação pública da Woovi e pode ser
referenciada em alertas de vazamento de credenciais Woovi.

- Português: `https://developers.woovi.com/docs/security/security-leaked-credentials`
- English: `https://developers.woovi.com/en/docs/security/security-leaked-credentials`

Para reportar credenciais Woovi encontradas em fontes públicas, ou para tratar de
um programa de parceria de _secret scanning_, escreva para
[security@woovi.com](mailto:security@woovi.com).

Veja também: [Política de Segurança](./security-policy.md) e
[Diretrizes de Segurança](./security-guidelines.md).
