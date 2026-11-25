---
id: integration-banco-do-brasil-bank
title: Charge Pix using a Banco do Brasil checking account
sidebar_label: Banco do Brasil
tags:
  - api
  - banco do brasil
---

### Integrating your Banco do Brasil checking account with Woovi

## Summary

This document explains how to connect your company's checking account held at Banco do Brasil to Woovi. Once your account is connected to Woovi, you can generate Pix QR Codes and Payment Links, use eCommerce Plugins, access the APIs, and manage and track Pix charges.

In this mode, the Pix amounts paid by your customers are deposited directly into your company's Banco do Brasil checking account.

> *This is one of the most common setups on the platform and is used by large companies or companies with high volumes.* 
*In this mode there's no need to open a new checking account, since your company's existing Banco do Brasil checking account is used.*

## 1. Getting the Client ID, Client Secret and Developer Api Key of your Banco do Brasil account

To operate with an existing checking account, you need to request the `Client ID`, `Client Secret` and `Developer Api Key` for your account. To request them, go to the [Portal Developers BB](https://developers.bb.com.br/)

Create a new Application for Woovi: [Criar App BB](https://app.developers.bb.com.br/#/menu/criar?origem=criar)

![BB Woovi App](/img/integrations/bb-openpix-app.png)
![BB Woovi Link Api](/img/integrations/bb-openpix-app-vincular.png)

Check your BB Application's credentials: [Consultar credenciais](https://app.developers.bb.com.br/#/menu/credenciais?origem=criar)

![BB Credentials](/img/integrations/bb-credentials.png)

## 2. Registering the Client ID, Client Secret and Developer Api Key of your checking account on the Woovi platform

Once you've received the production credentials on the Banco do Brasil Developers portal, just register the Client ID, Client Secret and Developer Api Key 

![BB Setup](/img/integrations/setup-bb-dev.png)

You can register more than one token, or multiple accounts 

> *Note: once registered, the credentials are encrypted and stored in an environment with an asymmetric HSM key. If the token is lost, this process must be repeated.* 


## 3. Testing the token

After registering the token on the platform, you can create charges for your customers. 

