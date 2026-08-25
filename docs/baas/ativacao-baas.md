---
id: ativacao-baas
title: Ativando o modo BaaS
tags:
  - baas
  - api
sidebar_position: 2
---

Este documento mostra como habilitar o modo BaaS na sua conta Woovi e deixar tudo pronto para criar as contas dos seus clientes.

## Pré-requisitos

- Conta Woovi ativa, com CNPJ e cadastro aprovado
- Caso de uso descrito — o time da Woovi avalia o modelo de negócio na ativação

## 1. Solicite a ativação das features

O modo BaaS depende de duas features habilitadas na sua conta: **BaaS** e **Criação de conta**.

A ativação é feita pelo time da Woovi — fale com o **suporte** (chat ou WhatsApp) ou com o seu **gerente de conta**. A ativação costuma sair em até 2 dias úteis.

## 2. Crie a API Master

Na plataforma, acesse **API/Plugins → Nova API/Plugin** e crie uma API do tipo **MASTER**.

Ela precisa ser desse tipo porque é a única capaz de criar credenciais (applications) para as outras contas. A conta bancária vinculada a essa API é usada como base no processo de criação das novas contas.

O passo a passo de criação de uma chave de API — incluindo o fator duplo de autenticação — está em [Primeiros passos com a API](./kyc/api-getting-started.mdx).

:::caution Guarde o AppID com segurança
O AppID da API Master administra todas as suas contas. Armazene-o em um cofre de segredos e nunca o exponha em front-end ou repositórios de código.
:::

## 3. Confira se está tudo ativo

Faça uma chamada de teste listando as suas contas:

```bash
curl --request GET \
  --url https://api.woovi.com/api/v1/account \
  --header 'Authorization: <MASTER_APP_ID>'
```

Se os endpoints de criação de conta responderem `403` com `"You need feature BAAS to access this endpoint"`, a feature ainda não foi habilitada — volte ao passo 1.

## Próximo passo

Com o modo BaaS ativo, [prepare os documentos e dados de KYC](./documentos-kyc.md) para criar a primeira conta.
