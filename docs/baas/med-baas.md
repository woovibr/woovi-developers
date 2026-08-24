---
id: med-baas
title: Baas e Med
tags: 
  - baas 
  - api
sidebar_position: 13
---

Este documento irá ajudá-lo a entender os principais conceitos de MED e qual a sua relação com BaaS.

### Gestão de MEDs (Devoluções Pix) para clientes BAAS

O MED (Mecanismo Especial de Devolução) é uma regra criada pelo Banco Central que permite que um Pix seja devolvido automaticamente quando há suspeita de fraude ou erro.

**Exemplo simples:**

Alguém fez um Pix para uma conta da sua plataforma, mas depois abriu uma reclamação dizendo que foi enganado. Esse pedido de devolução entra como um MED. Ele não devolve o dinheiro automaticamente, mas abre uma disputa entre os bancos e empresas envolvidas.

#### O que acontece quando um MED é aberto

 1. A Woovi avisa sua empresa na hora, via Webhook.
 2. Você tem 3 dias para enviar provas (como prints, conversas, termos de uso).
 3. O banco tem até 7 dias para analisar e decidir se o dinheiro será devolvido ou não.
 4. A Woovi te ajuda nesse processo — inclusive com API para envio das evidências.


#### Como a Woovi ajuda nisso

 * Envia notificação em tempo real
 * Permite enviar provas pela API
 * Tem um time de suporte pronto para te orientar
 * Dá apoio extra para empresas com muitos MEDs



