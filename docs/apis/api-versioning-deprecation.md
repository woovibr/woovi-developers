---
id: api-versioning-deprecation
sidebar_position: 2
title: Versionamento e Depreciação da API
tags:
  - api
---

A Woovi se compromete a **não quebrar silenciosamente** integrações em produção.
Esta página descreve como versionamos a API, o que garantimos de compatibilidade, e como
conduzimos a depreciação de recursos com prazo de _sunset_ e comunicação prévia.

## Versionamento

- A API é versionada no **caminho da URL**: `https://api.woovi.com/api/v1/...`
  (produção) e `https://api.woovi-sandbox.com/api/v1/...` (sandbox).
- Seguimos **[SemVer](https://semver.org/lang/pt-BR/)**: a versão é composta por
  `major.minor.patch`. **Mudanças compatíveis não geram nova versão _major_.**
- Uma mudança **incompatível** (que quebra contrato) **nunca** é aplicada na major vigente:
  ela só entra em uma **nova major** (ex.: `/api/v2`), e a major anterior continua no ar.

## Garantia de compatibilidade

Dentro de uma mesma major, aplicamos apenas **mudanças aditivas**, que podem ocorrer a
qualquer momento e **não exigem ação** do integrador:

- novos endpoints;
- novos parâmetros **opcionais**;
- novos campos na resposta;
- novos valores em enumerações;
- reordenação de campos.

> **Regra de ouro do cliente:** ignore campos que você não conhece e não dependa da ordem
> dos campos. Assim sua integração absorve mudanças aditivas sem quebrar.

São consideradas **mudanças incompatíveis** (só em nova major): remover ou renomear um campo
ou endpoint, mudar o tipo de um campo, tornar obrigatório um parâmetro antes opcional, ou
remover um valor de enumeração.

## Depreciação e _sunset_

Quando um recurso (endpoint, campo ou versão) precisa ser aposentado, seguimos este rito:

1. **Depreciação:** o recurso é marcado como depreciado (na documentação/OpenAPI e, quando
   aplicável, via headers HTTP `Deprecation` e `Sunset` — [RFC 8594](https://www.rfc-editor.org/rfc/rfc8594)),
   mas **continua funcionando**.
2. **Prazo de _sunset_:** definimos uma **data de desligamento** com antecedência mínima de
   **90 dias** (3 meses) a partir do anúncio, período em que o recurso depreciado segue ativo.
3. **Comunicação prévia:** a depreciação é registrada no [Changelog](./api-changelog) e
   comunicada aos integradores afetados (e-mail e/ou painel) antes do _sunset_.
4. **Desligamento:** somente após o prazo o recurso é efetivamente removido.

Mudanças que quebram contrato **sem** caminho de migração não são feitas na major vigente —
elas motivam uma nova major, com o mesmo rito de anúncio e prazo.

## Comunicação e Changelog

- Toda mudança relevante é publicada no **[Changelog da API](./api-changelog)**, com data.
- Depreciações e _sunsets_ são anunciados no Changelog e comunicados diretamente aos
  integradores afetados antes da data de desligamento.

## Estabilidade do `v1`

A `v1` é estável desde o lançamento. Não houve nenhuma mudança incompatível não anunciada;
as depreciações realizadas seguiram anúncio prévio antes da remoção.
