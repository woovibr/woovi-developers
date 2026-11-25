---
id: integration-original-bank
title: Charge Pix using a Banco Original checking account
sidebar_label: Banco Original
tags:
   - bank
---

### Integrating your Banco Original checking account

## Summary

This document explains how to connect your company's checking account, held at Banco Original, to Woovi. After connecting your account to Woovi, you can generate Pix QR Codes and Payment Links, use eCommerce Plugins, access APIs, and manage and track Pix charges.

In this mode, the Pix amounts paid by your customers are deposited directly into your company's checking account at Banco Original

> *This is one of the most common setups on the platform and is used by large companies or companies with high volumes.*
*In this mode there is no need to open a new checking account, since your company's existing checking account at Banco Original is used.*

## 1. Getting the Client ID and Client Secret of your Banco Original account

To operate using an existing checking account, you need to create a new API Key in your account.

See the Banco Original [Documentation](https://www.originalhub.com.br/documentacao)

## 2. Registering your checking account's Banco Original credentials on the Woovi platform

Once you have received the production credentials from the Banco Original portal, just register them

You can register more than one token, or multiple accounts

> *Note: once registered, the credentials will be encrypted and stored in an environment with an asymmetric HSM key. If the token is lost, this operation will have to be redone.*


## 3. Testing the Token

After registering the Token on the platform, you can create charges for your customers.
