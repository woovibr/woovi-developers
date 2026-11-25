---
id: integration-flagship
title: Charge Pix using a Flagship checking account
sidebar_label: Flagship
tags:
- bank
---

### Integrating your Flagship checking account

## Summary

This document explains how to connect your company's checking account, held at Flagship, to Woovi. After connecting your account to Woovi you can generate Pix QR Codes and Payment Links, use eCommerce Plugins, access APIs, and manage and track Pix charges.

In this mode, the Pix amounts paid by your customers are deposited directly into your company's checking account at Flagship

> *This is one of the most common setups on the platform and is used by large companies or companies with high volumes.* 
*In this mode there is no need to create a new checking account, since your company's existing checking account at Flagship is used.*

## 1. Getting the Account ID of your Flagship account

Contact Woovi support to open your Flagship account


## 2. Registering your checking account's Account ID on the Woovi platform

Once you have received your Flagship account's production credentials, just register the Account ID and Developer Api Key

In the Admin Menu, go to `Ajustes` > `Pix`. Click `Conectar com Conta Corrente`.

![ConnectWithCompanyBankAccount](/img/integrations/new-bank-account.png)

![Flagship Setup](/img/integrations/flagship-setup.png)

You can register more than one token, or multiple accounts 

> *Note: once registered, the credentials are encrypted and stored in an environment with an HSM asymmetric key. If the token is lost, this operation will have to be done again.* 

## 3. Testing the Token

After registering the Token on the platform, you can create charges for your customers. 
