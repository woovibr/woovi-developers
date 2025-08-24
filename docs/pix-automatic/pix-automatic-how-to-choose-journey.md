---
id: pix-automatic-how-to-choose-journey
sidebar_position: 2
title: Qual jornada do Pix Automático devo escolher?
tags:
  - pix-automatic
  - api
---

Em caso de dúvida sobre qual é a melhor jornada para seu negócio. Nós recomendamos escolher a jornada 3 `(PAYMENT_ON_APPROVAL)`. Por que ela é mais simples de ser implementada e de ser compreendida. Uma vez que ao ler o QRCode o usuário já efeuta o pagamento e autoriza a cobrança, além de a assinatura entrar em vigor imediatamente.

Contudo, caso você já possua uma assinatura em andamento e deseja migrar para o Pix Automático, recomendamos a jornada 4, pois a cobrança continuará sendo feita da maneira tradional, via e-mail. Contudo, será feito um convite para o consumidor migrar para o Pix Automático, gerando uma maior comodidade. Visto que a cobrança é automática.

Em um caso que a assinatura apenas entrará em vigor em um momento tardio, como na próxima semana/mês. Nós sugerimos a jornada 2 `(ONLY_RECURRENCY)`. Porque a cobrança somente será efetuada quando de fato começar a assinatura.

Caso o consumidor demonstre uma ncessidade de efetuar as cobranças de maneira automática. A jornada 1 será o ideal nesse caso. Pois será enviado uma notificação para o consumidor no seu aplicativo de banco o convidando para autorizar a recorrência.