---
id: pix-automatic-how-to-choose-journey
sidebar_position: 2
title: Qual jornada do Pix Automático devo escolher?
description: 'Qual jornada do Pix Automático escolher na Woovi para cada cenário: autorização com pagamento, só recorrência, push ou migração.'
tags:
  - pix-automatic
  - api
---

Em caso de dúvida sobre qual é a melhor jornada para seu negócio. Nós recomendamos escolher a jornada 3 `(PAYMENT_ON_APPROVAL)`. Por que ela é mais simples de ser implementada e de ser compreendida. Uma vez que ao ler o QRCode o usuário já efeuta o pagamento e autoriza a cobrança, além de a assinatura entrar em vigor imediatamente.

Contudo, caso você já possua uma assinatura em andamento e deseja migrar para o Pix Automático, recomendamos a jornada 4, pois a cobrança continuará sendo feita da maneira tradional, via e-mail. Contudo, será feito um convite para o consumidor migrar para o Pix Automático, gerando uma maior comodidade. Visto que a cobrança é automática.

Em um caso que a assinatura apenas entrará em vigor em um momento tardio, como na próxima semana/mês. Nós sugerimos a jornada 2 `(ONLY_RECURRENCY)`. Porque a cobrança somente será efetuada quando de fato começar a assinatura.

Se você já tem a conta bancária do consumidor (banco, agência e conta) e não quer depender da leitura de um QR Code, use a jornada 1 `(PUSH_NOTIFICATION)`. A solicitação de autorização chega como notificação no aplicativo do banco do consumidor, que aprova ali mesmo. A primeira cobrança precisa estar a pelo menos 3 dias da criação da assinatura, e a jornada 1 precisa ser habilitada para a sua conta: fale com o nosso suporte.
