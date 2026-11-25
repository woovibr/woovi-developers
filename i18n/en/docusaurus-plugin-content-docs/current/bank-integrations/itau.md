---
id: integration-itau-bank
title: Charge Pix using an Itaú checking account
sidebar_label: Itaú
tags:
- bank
---

### Integrating your company's Itaú checking account with the Woovi platform

## Summary

This document explains how to connect your company's checking account held at Itaú to Woovi. Once your account is connected to Woovi, you can generate Pix QR Codes and Payment Links, use eCommerce Plugins, access the APIs, and manage and track Pix charges.

In this mode, the Pix amounts paid by your customers are deposited directly into your company's Itaú checking account.

> *This is one of the most common setups on the platform and is used by large companies or companies with high volumes.* 
*In this mode, your company's existing Itaú checking account is used.*

## 1. Getting the Itaú Developers access code

To operate with an existing checking account, you need to request a `Token de Acesso` (Access Token) *(also known as an access code)* for your account. This code lets you access the Itaú APIs related to your checking account.

### Contact your account manager

To request it, contact your account manager. When you contact your Itaú manager, ask for the Itaú Developers `Token de acesso` (Access Token). This process should take a few days.

**Important:** request the token for authentication type 2 - client credentials and mTLS.

> *Note: Don't confuse the Access Token with your Pix key. The `Token de Acesso` (Access Token) gives access to the APIs and the Itaú Developers platform*.

### Itaú will send an email with temporary access data

Once registered, you will receive an email from Itaú with a `ClientID` and a temporary `Código de acesso` (access code) to register your account on Itaú Developers. [Itaú Developers](https://developer.itau.com.br/) Important: this first password is only valid for 72 hours; if it expires, you must submit a new request to your account manager.

![Setup Itau Developers](/img/integrations/itau-developers-setup.png)


After completing this step, you will have the following from Itaú:

- `ClientID` *(Sent in the email body)*
- `AccessTokenTemp` *(Sent in an Excel file attached to the email)*

## 2. Registering the Pix key

First, register the Pix key of your Itaú account. It's usually your company's CNPJ.

![Pix Key](/img/integrations/pix-key.png)

## 3. Registering the temporary token sent by Itaú on the Woovi platform

Once you've received your `ClientID` and `AccessTokenTemp` from Itaú, just register them on the platform. 

> For your security, these access tokens are temporary; the access certificate is generated only by the platform and is fully encrypted. This means this step must be completed within 72 hours. If it expires, just request a new temporary access token.

### Registering the ClientID and AccessTokenTemp (temporary)

To finish, register your `ClientID` and `AccessTokenTemp` on the platform. In the Administrator menu, go to `Ajustes` (Settings) > `Pix` > `Conectar com Conta Corrente` (Connect checking account), select Banco Itaú and enter the data.

![ConnectWithCompanyBankAccount](/img/integrations/new-bank-account.png)

![Add Token](/img/integrations/itau-bank-setup.png)

You can register more than one token, or multiple accounts. From this step on, you can discard the email with the temporary token.


## 4. Production certificate

After the temporary data is registered, the platform itself generates the production certificate. The platform also regularly keeps the production certificate and access tokens up to date.

> *Note: Following high security standards, once generated, the production certificate is encrypted and stored in a secure environment with an asymmetric key and HSM hardware, and cannot be changed. If you need to register another checking account, just repeat the process*

## 5. Done!

After registering the token on the platform, you can create charges for your customers, or build applications!

