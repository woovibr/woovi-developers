---
id: conceitos-baas
title: Visão geral do BaaS
tags:
  - baas
  - concept
sidebar_position: 1
---

BaaS significa _Bank as a Service_ — "banco como serviço". Com o BaaS da Woovi, sua empresa oferece serviços bancários e financeiros como se fosse um banco, sem precisar ser uma instituição financeira. A Woovi fornece toda a estrutura necessária — tecnologia, regulamentação, segurança e APIs — para que você crie contas digitais para seus clientes, com a sua marca.

Em outras palavras: você cria contas bancárias digitais dentro do seu próprio sistema, com saldo, Pix, extrato e muito mais. Tudo isso funciona sobre a infraestrutura da Woovi, que é conectada ao Banco Central e segue todas as regras exigidas.

## Como as contas se relacionam

- **Conta principal** — a conta da sua empresa. Nela vive a **API Master**, a credencial administradora que cria contas e gera as credenciais de cada conta.
- **Contas dos seus clientes** — cada uma tem saldo próprio e isolado, chaves Pix, extrato e o próprio **AppID**, usado para operar aquela conta.

![contas no modo BaaS](__assets__/accounts.png)

:::tip Regra de ouro
O header `Authorization` define em qual conta a operação acontece. **API Master** = administração (criar contas, gerar credenciais, ler extratos). **AppID da conta** = operação (criar cobranças, pagar, webhooks).
:::

## O que cada conta pode fazer

- Receber Pix (via QR Code ou cobrança) e pagar com Pix
- Cadastrar chaves Pix e consultar extrato
- Receber notificações automáticas (webhooks) quando um Pix é recebido, enviado ou devolvido
- Ter saldo próprio, isolado das demais contas

Tudo acontece em tempo real: o Pix entra em milissegundos e pode ser automatizado.

## Benefícios de utilizar o BaaS da Woovi

- Você começa rápido: ativação em até 2 dias úteis
- Licença bancária integrada: IP regulada e participante direta da rede Pix
- Tudo pronto: sem precisar negociar com bancos
- Marca própria: os serviços aparecem com a cara da sua empresa
- APIs e webhooks de fácil integração

## Casos de uso comuns

Bancos e fintechs, e-commerces e marketplaces, empresas de varejo, sistemas ERP, corretoras — qualquer negócio que precise oferecer contas digitais aos próprios clientes.

## A jornada de integração

1. [Ative o modo BaaS](./ativacao-baas.md) e crie a sua API Master
2. [Prepare os documentos e dados de KYC](./documentos-kyc.md) do seu cliente
3. Crie a conta com o [link de onboarding KYC](./kyc/api-onboarding-create.mdx) — o seu cliente preenche os dados em uma tela hospedada pela Woovi
4. Acompanhe a aprovação por [webhook](./webhooks-por-conta.md) ou [consultando o cadastro](./kyc/api-account-register-get.mdx)
5. [Gere as credenciais da conta](./baas-api-master.md) com a API Master
6. [Crie uma chave Pix para a conta](./chaves-pix-contas.md)
7. [Crie cobranças para a conta](./cobrancas-por-conta.md)
8. Configure [webhooks](./webhooks-por-conta.md) e gerencie [saque, transferência e extrato](./movimentando-saldo.md)

O [fluxo básico de BaaS](./basic-flux.md) mostra essa mesma sequência em um único exemplo de ponta a ponta.
