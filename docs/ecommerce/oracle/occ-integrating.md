---
id: occ-integrating
title: Integrando Oracle Commerce Cloud na Woovi
sidebar_position: 0
tags:
- ecommerce
- occ
- oracle
---

### Plugin Pix para OCC - Oracle Commerce Cloud

## Resumo

Este documento detalha passos necessários para conectar a sua plataforma de e-Commerce, baseada em Oracle Commerce Cloud, na Woovi. A plataforma Woovi efetua em tempo real a conciliação entre seu Banco e seu e-Commerce.
Após conectar a sua conta na Woovi é possível cobrar clientes em tempo real com QrCodes Pix, enviar Links de Pagamento, gerenciar cobranças incluindo extornos.

> *Nota: Este documento espera que você já tenha um ambiente Oracle Commerce Cloud ativo.*

## 1. Crie um Registered Applications na OCC

Entre em `<ambiente>.occa.ocs.oraclecloud.com/occs-admin/#/settings/webAPI` e crie uma nova aplicação para a Woovi

## 2. Crie uma nova Aplicação do tipo Oracle na Woovi

![App](/img/ecommerce/occ-app.png)

Escolhe o tipo Oracle para a Aplicação Woovi. Cadastre o Application ID, o Application Secret e a url da sua instância Oracle Commerce Cloud.
Ao salvar será automaticamente registrado os Webhooks de Generic Payments.

## 3. Instale o Plugin Woovi na sua instância Oracle Commerce Cloud

Converse com o integrador para adicionar as extensoes e widgtes da Woovi na sua Storefront

#### Requisitos de sistema

- Oracle Commerce Cloud 18D e acima 
- Ser cliente ativo Woovi.
