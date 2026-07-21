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

## 2026-04

- **Removido** — endpoints de _account register_ (`POST`/`PATCH`), previamente depreciados,
  foram removidos do contrato público após o período de depreciação.

## 2026-02

- **Adicionado** — bloqueio de saque em subconta (_subaccount withdraw block_).

---

> Este changelog passa a ser mantido de forma contínua. Mudanças aditivas entram como
> **Adicionado**; qualquer depreciação será anunciada aqui **com data de _sunset_** antes do
> desligamento, conforme a política.
