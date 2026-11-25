---
id: integration-gerencianet-bank
title: Charge Pix using a Gerencia Net checking account
sidebar_label: Gerencia Net
tags:
- bank
---

### Integrating your company's Gerencia Net checking account with the Woovi platform

## Summary

This document explains how to connect your company's checking account, held at Gerencia Net, to Woovi. Once your account is connected to Woovi, you can generate Pix QR Codes and Payment Links, use eCommerce Plugins, access the APIs, and manage and track Pix charges.

In this mode, the Pix amounts paid by your customers are deposited directly into your company's Gerencia Net checking account.

> *This is one of the most common setups on the platform and is used by large companies or companies with high volumes.* 
*In this mode, your company's existing checking account at Gerencia Net is used.*

## 1. Getting the Client ID and Client Secret from Gerencia Net

To get the `Client ID` and `Client Secret` from Gerencia Net, you need to create a New Application ([register a New Application here](https://sistema.gerencianet.com.br/api/minhas-aplicacoes/nova-aplicacao)). Allow all Pix API scopes for production and staging.

Enable all PIX API scopes:

![Permissoes](/img/integrations/gn-permisions.png)

## 2. Production Certificate

Generate a production Certificate in Gerencia Net to complete the integration.

![Certificado](/img/integrations/gn-certificado.png)

## 3. Registering the Pix Key

First, register the Pix key of your Gerencianet account. This is usually your company's CNPJ.

![Pix Key](/img/integrations/pix-key.png)

## 4. Registering the Gerencia Net credentials on the Woovi platform

![GN Setup](/img/integrations/gn-setup.png)

You can register more than one checking account in Woovi.

## 5. Done!

You can now charge your customers using Woovi.
