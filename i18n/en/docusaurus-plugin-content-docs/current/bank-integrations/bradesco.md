---
id: integration-bradesco-bank
title: Charge Pix using a Bradesco checking account
sidebar_label: Bradesco
tags:
- bank
---

### Integrating your Bradesco checking account with Woovi

## Summary

This document explains how to connect your company's checking account held at Bradesco to Woovi. Once your account is connected to Woovi, you can generate Pix QR Codes and Payment Links, use eCommerce Plugins, access the APIs, and manage and track Pix charges.

In this mode, the Pix amounts paid by your customers are deposited directly into your company's Bradesco checking account.

> *This is one of the most common setups on the platform and is used by large companies or companies with high volumes.*
*In this mode there's no need to open a new checking account, since your company's existing Bradesco checking account is used.*

## 1. A1 certificate or e-CNPJ
Bradesco uses your company's digital certificate to authenticate you. If you don't have one yet, you can get it at this link: [Obter Certificado Digital](https://www.gov.br/pt-br/servicos/obter-certificacao-digital)

## 2. Getting the Client ID and Client Secret of your Bradesco account

To operate with an existing checking account, you need to request the `Client ID` and `Client Secret` for your account. To request them, contact your Bradesco account manager. This process should take a few days.

Once registered, you will receive an email from Bradesco with your `Client ID` and `Client Secret`

After registering on Bradesco Developers, you will have the following from Bradesco:

- `ClientID`
- `ClientSecret`
- `Certificado A1` (A1 certificate)
- `Senha Certificado A1` (A1 certificate password)

## 3. Registering your checking account token on the Woovi platform

After receiving the `Client ID`, `Client Secret`, `Certificado A1` and `Senha Certificado A1`, register them on the Woovi platform

![Bradesco Setup](/img/integrations/bradesco-setup.png)

You can register more than one token, or multiple accounts

> *Note: once registered, the token is encrypted and stored in an environment with an asymmetric HSM key. If the token is lost, this process must be repeated.*


## 4. Testing the token

After registering the token on the platform, you can create charges for your customers. 

