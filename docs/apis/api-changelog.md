---
id: api-changelog
sidebar_position: 3
title: Changelog da API
tags:
  - api
---

Registro datado das mudanças relevantes da API pública. Mudanças **aditivas** (novos
endpoints, campos ou parâmetros opcionais) são compatíveis e não exigem ação. Depreciações e
remoções seguem a [Política de Versionamento e Depreciação](./api-versioning-deprecation),
com anúncio prévio e prazo de _sunset_.

Tipos: **Adicionado** · **Alterado** · **Depreciado** · **Removido**.

## 2026-08

- **Adicionado** — query string opcional `companyBankAccount` em
  `GET /api/v1/statement` e `GET /api/v1/transaction/{id}`. Uma aplicação `MASTER` de
  uma empresa com a feature `MASTER_APP_READ_ANY_ACCOUNT` lê o extrato e a transação de
  outra conta da mesma empresa, sem criar um AppId por conta. Veja
  [Controlando as contas no modo BAAS](../baas/baas-api-master.md).
- **Adicionado** — `GET /api/v1/application/scopes`, que lista os grupos de escopos que uma
  aplicação pode solicitar. Não exige escopo.
- **Adicionado** — `POST /api/v1/application/rotate-secret`, que gera um novo `clientSecret`
  para uma aplicação da mesma empresa. Exige o escopo `APPLICATION_ROTATE_POST` e uma
  aplicação `MASTER`.

## 2026-04

- **Removido** — endpoints de _account register_ (`POST`/`PATCH`), previamente depreciados,
  foram removidos do contrato público após o período de depreciação.

## 2026-02

- **Adicionado** — bloqueio de saque em subconta (_subaccount withdraw block_).

---

> Este changelog passa a ser mantido de forma contínua. Mudanças aditivas entram como
> **Adicionado**; qualquer depreciação será anunciada aqui **com data de _sunset_** antes do
> desligamento, conforme a política.
