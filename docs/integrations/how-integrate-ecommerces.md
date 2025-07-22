---
id: ecommerce-workflow
title: Como integrar a woovi com ecommerces
tags: 
  - integration
  - ecommerce
---

Para integrar ecommerces a proposta para desenvolvimento vai ser dividido em duas partes

## 1. Criar cobranças utilizando a woovi como meio de pagamento

### 1.1 Pré-requisitos

- 1. Ter uma conta na woovi
- 2. Ter um ecommerce
- 3. Criar um appID dentro da plataforma da woovi do tipo plugin
- 4. Salvar o appID dentro do ecommerce

### 1.2 Fluxo de criação de cobrança

Nesse ponto é esperado que o lojista já consiga fazer os seguintes passos

- 1. Se possível, visualizar o plugin da woovi no store do ecommerce
- 2. Instalar o plugin da woovi no ecommerce
- 3. Configurar o plugin da woovi no ecommerce ( colocar o appID  )
- 4. Criar uma cobrança dentro do ecommerce utilizando a woovi como meio de pagamento.
  - 4.1.  Quando a cobrança for criada é estritamente necessário ser salvo um correlationID dentro do   pedido do ecommerce, e o mesmo deve ser enviado na requisição para a api da woovi.
  - 4.2. O cliente final deve conseguir escolher a woovi como meio de pagamento
  - 4.3. O lojista deve conseguir visualizar esse pedido(charge) dentro da plataforma da woovi
  - 4.4. O lojista deve conseguir visualizar esse pedido(charge) dentro do ecommerce
  - 4.5. O cliente final deve conseguir visualizar esse pedido dentro da aba meus pedidos
- 5. Deve ser possível passar informações como email, nome, idade, e CPF

## 2. Após ser criada a cobrança, e paga pelo cliente final

### 2.1 Pré-requisitos

- 2. Criar um webhook dentro da plataforma da woovi do tipo CHARGE COMPLETED
- 1. Conseguir executar o fluxo de criação de cobrança
- 3. Abrir um endpoint no ecommerce para receber a notificação da woovi
- 4. Validar se a notificação é realmente da woovi ( PONTO PRINCIPAL )

Nesse ponto entra a parte de notificação, onde a woovi vai notificar o ecommerce que a cobrança foi paga sendo assim é esperado que:

- 1. Quando o cliente final pagar a cobrança, a woovi vai notificar o ecommerce
- 2. O plugin recebe a notificação e valida se a notificação é realmente da woovi
- 3. O plugin busca o pedido pelo correlationID e atualiza o status do pedido para pago
- 4. Após feita essa busca é esperado que atualize o pedido para pago.
