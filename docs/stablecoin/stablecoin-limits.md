---
id: stablecoin-limits
sidebar_position: 6
title: Limites
tags:
  - stablecoin
  - api
---

## Limites do Stablecoin

Os limites de stablecoin estão vinculados ao **KYB** (Know Your Business) da sua empresa e são validados a cada depósito.

## Subconta ativa (KYB)

Para criar qualquer depósito, sua empresa precisa de uma subconta de stablecoin com status `CONFIRMED`. Enquanto o KYB não estiver aprovado, a criação do depósito retorna `400`:

```json
{ "error": "Nenhuma subconta de stablecoin ativa. É necessário um KYB, entre em contato com o suporte." }
```

## Limite padrão

O limite padrão é de **R$ 120.000,00 por mês** (120k BRL/mês). A cada depósito, a Woovi valida o valor contra o limite disponível da sua conta; quando um depósito excede o limite, a requisição é rejeitada e o motivo é retornado na resposta de erro.

## Como aumentar o limite

Para aumentar o limite é necessário comunicar o suporte. Será necessário um **KYC estendido**, com informações referentes à capacidade financeira e comprovantes de endereço.

## Valor mínimo

O campo `value` do depósito deve ser um número positivo, em centavos de BRL. Valores inválidos retornam:

```json
{ "error": "value must be a positive number (in cents)" }
```

> Os valores exatos de limite dependem do nível de KYB da sua empresa. Para aumentar limites, entre em contato com o suporte.
