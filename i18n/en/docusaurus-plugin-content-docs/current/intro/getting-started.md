---
id: getting-started
title: Set up the Woovi platform
sidebar_label: Getting started
description: 'How to set up the Woovi platform: inviting users, Single Sign-On with Google, Azure or SAML, APIs and domains to allow in your firewall.'
tags:
- flow
- getting-started
- comecando
---

The Woovi platform was built to make the developer experience easier while guaranteeing the highest level of security. This documentation helps developers and system administrators set up the platform correctly.

*Automated methods such as Single Sign-On and APIs are preferred, since they provide a better user experience, increase security and automate processes.*

## Getting started

Once registered on the platform, you will be able to invite more users to the platform, configure login methods such as single sign-on, APIs, or even import users using Excel files. 

## Configuring Single Sign-On (SSO)

Woovi supports multiple SSO identity providers (IdP). An Identity Provider is a server that can provide identity information about your company's users. For example, Google can be an identity provider for companies using G Suite. If your company uses G Suite, you can sign in to Woovi automatically with your Google account; a Google server will then send your identity information to this site.

### Azure Single Sign On

If your company uses Azure Single Sign On, you can sign in to Woovi automatically using Azure as the IdP. To use this login strategy, you must enable this option in the settings menu.

### Google Single Sign On

If your company uses G Suite, you can sign in to Woovi automatically using Google as the IdP.

### SAML Single Sign on

If your company uses SAML, you can sign in to Woovi automatically using your SAML servers as the IdP.

## Security and Firewall

### Allowed Woovi Domains list

To work properly, your company's users need access to Woovi's servers. Woovi uses standard web technologies and encrypts all communications, so in most cases your setup should work out of the box with no additional requirements.

If you run into problems using the platform, please check the following requirements.

- Make sure your proxy server or internal firewall has an allow list with Woovi's domains. Your users must be able to access all domains and subdomains.
  
  > You must allow all Woovi domains *.woovi.com

- Make sure you are not blocking emails from the Woovi domain.
  
  > You must allow all Woovi domains *.woovi.com in your email provider
  
- Do not cache

    > Do not change or impose new caching policies for Woovi static content or IP addresses. Woovi uses a global CDN and additional server protections, so IPs change frequently and without notice.
