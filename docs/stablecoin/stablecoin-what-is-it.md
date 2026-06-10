---
id: stablecoin-what-is-it
sidebar_position: 1
title: O que é o Stablecoin?
tags:
  - stablecoin
  - api
---

O Stablecoin da Woovi permite que sua empresa converta reais (BRL) em stablecoins — como **USDT** e **USDC**. A partir do saldo em BRL da conta da sua empresa, o valor é entregue, já convertido, em stablecoin na carteira de destino, na rede escolhida.

É ideal para quem precisa de saldo em dólar digital de forma simples.

:::warning Aviso importante
Os serviços de ativos virtuais são prestados pelas **PSAVs** (Prestadoras de Serviços de Ativos Virtuais) parceiras da Woovi. A Woovi não realiza custódia ou liquidação de ativos virtuais.

Verifique o endereço da carteira de destino com atenção. Após a confirmação, a operação é **irreversível** e não pode ser reembolsada.
:::

## Funcionamento

O funcionamento é composto por 2 etapas principais:

1. **Criar um depósito**
2. **Aprovar o depósito (compra do USDT)**, que debita o saldo em BRL da conta, dispara a liquidação on-chain e entrega a stablecoin

Resumindo: você cria um depósito e o aprova; a Woovi debita o saldo em BRL da conta da empresa, converte em stablecoin e envia para a carteira de destino na blockchain.

## Stablecoins e redes suportadas

Nem todo ativo está disponível em todas as redes. A matriz suportada é:

| Stablecoin | Redes |
| --- | --- |
| `USDT` | `POLYGON`, `ETHEREUM`, `CELO`, `TRON` |
| `USDC` | `POLYGON`, `ETHEREUM`, `BASE`, `CELO` |

Quando o campo `network` é omitido, o padrão é `POLYGON`. Enviar uma combinação de ativo/rede fora da matriz acima retorna `400`.

## Pré-requisito: KYB

Para criar depósitos, sua empresa precisa ter uma **subconta de stablecoin** com status `CONFIRMED`, ou seja, com o KYB (Know Your Business) aprovado — parte da infraestrutura de [BaaS](https://developers.woovi.com/docs/category/baas) da Woovi. Sem uma subconta ativa, a criação do depósito é rejeitada com `400` e a mensagem:

```json
{ "error": "Nenhuma subconta de stablecoin ativa. É necessário um KYB, entre em contato com o suporte." }
```

Para iniciar o processo de KYB, entre em contato com o suporte.

## Próximos passos

- [Endpoints](./stablecoin-endpoints.md) — todas as rotas da API
- [Fluxo passo a passo](./stablecoin-flow.md) — do depósito à entrega on-chain
- [Webhooks](./stablecoin-webhooks.md) — como ser notificado
- [Taxas](./stablecoin-fees.md)
- [Limites](./stablecoin-limits.md)
