---
id: pix-automatic-what-is-it
sidebar_position: 1
title: O que é o Pix Automático?
tags:
  - pix-automatic
  - api
---

O Pix Automático permite cobranças automáticas, diretamente da conta bancária do usuário. Sendo ideal para pagamentos recorrentes como assinaturas ou mensalidades.

## Funcionamento

O Funcionamento do pix automático é composto por 2 etapas:

1. Criação da Assinatura
2. Autorização da assinatura pelo cliente

Após aprovação do cliente, as cobranças serão criadas a partir da configuração feita pela assinatura, podendo ser semanal, mensal, semestral ou anual.

## Jornadas

As jornadas são as diferentes maneiras de se utilizar o Pix Automático definidas pelo Banco Central. Sendo elas:

### Jornada 1 | Autorização via Push Notification

Na jornada 1 o recebedor envia uma notificação ao usuário, convidando-o para entrar em uma recorrência.

### Jornada 2 | Autorização via QRCode

Na jornada 2, o recebedor enviará ao consumidor um QRCode que será responsável pela autorização da recorrência. Ao aceitar, a partir da data pré definidia na assinatura, serão feitas as próximas cobranças.

### Jornada 3 | Autorização + Pagamento da primeira parcela

Na jornada 3, o recebedor enviará ao consumidor um QRCode que será responsável pela autorização e a cobrança da primeira parcela da assinatura. Nesta jornada, não é possível recusar o pagamento da primeira parcela e apenas aceitar a recorrência. Caso esse seja o funcionamento desejado, utilize a jornada 2.

### Jornada 4 | Pagamento + Oferta da Recorrência

Na jornada 4, o recebedor enviará ao consumidor um QRCode que será responsável por uma cobrança e também será ofertada a possibilidade de uma recorrência. Essa oferta poderá tanto ser aceita quanto recusada.

## Falha na Cobrança

Ao criar uma assinatura você poderá definir sua política em caso de falha na cobrança. No momento existem duas opções:

1. `NON_PERMITED`: Sem novas retentativas
2. `THREE_RETRIES_7_DAYS`: Será feita até 3 novas cobranças no período de 7 dias

Se ao final das retentativas não for possível cobrar o usuário, a assinatura será cancelada.
