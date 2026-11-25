---
id: integrating-pix-with-whatsapp
title: Integrating Pix with WhatsApp via Woovi + BotConversa
tags:
  - whatsapp
  - integration
---

## 1. Creating the webhook in BotConversa

In the `Automação` section, open the `Webhook` option. You will land on this page:

![Create a webhook in the BotConversa platform](/img/botconversa-create-webhook.png)

Click the `Criar webhook` button. A new item will be added to the webhook list,
and you can give it any name you like. In this case, we'll name it `Teste` for now.

What you see should look similar to this:

![BotConversa webhook created](/img/botconversa-webhook-created.png)

After creating the webhook, you can click it to open a screen
showing some details and actions for that webhook.

What you see will look similar to this:

![BotConversa webhook detail](/img/botconversa-webhook-detail.png)

In place of the black blur you will see your webhook URL; this is the
URL you will register on our platform.

Click the `Copiar` button to copy your webhook URL.

## 2. Creating the webhook on Woovi

To create the webhook on Woovi, we recommend following our 
[tutorial](/docs/webhook/platform/webhook-platform-api).

### Webhook test request

After adding the webhook, go back to the webhook detail in BotConversa.
Click the `Receber dados` button. If everything went well, you will see an option containing
the response to your first request:

![Woovi webhook first response](/img/botconversa-webhook-first-response.png)

This is the information you will see in the webhook request response.

You can ignore it for now. The first request we make to every webhook
endpoint checks whether the URL is valid; it is used strictly
to test the endpoint.

### Valid webhook request

After receiving the test request, you will be able to receive the real requests
from our webhook. In this case, we selected the `Nova Cobrança criada` (new charge created) option to
continue the tutorial. So, after you:

1. Create a new charge on Woovi
2. Press the reload button on the webhook detail in BotConversa

You will see the following information:

![Woovi webhook charge created response](/img/botconversa-webhook-valid-response.png)

This is a valid webhook _payload_ for when a charge is created. It contains information
such as: charge amount, customer information, payment link, BR code for payment (Pix copy and paste),
among other useful information.

## 3. Configuring the webhook contact in BotConversa

After adding the BotConversa webhook on Woovi, you need to add the contact
that will receive the message on WhatsApp.

You will see the following form:

![BotConversa contact form initial state](/img/botconversa-webhook-initial-form-contact.png)

Fill in both fields as expected, as in the example below:

![BotConversa contact form initial state](/img/botconversa-webhook-filled-form-contact.png)

## 4. Starting the conversation flow and sending the message

If you choose the simplest way, you can add a new action and choose the `Enviar mensagem` option;
this way you can add the message that will be sent to the contact.

However, we recommend doing these actions through a "Conversation flow", which gives you
better control and more detail over how and when messages
are sent.

### Creating the conversation flow

To create the conversation flow, open `Fluxo de conversas` in the sidebar.
You will see the following screen:

![BotConversa - Conversation flows](/img/botconversa-conversation-flow-screen.png)

On this screen, click the `Criar` button. A modal will appear where you can enter the name of the
flow. For this example, we'll name it `Teste`.

After creating the flow, click it to open it. You will see the flow detail.
The boxes are action blocks; you can learn more about them in this tutorial [here](https://ajuda.botconversa.com.br/construtor-de-fluxos-botconversa/fluxos-de-conversa/o-que-e-um-bloco-de-conteudo).

Your flow will look similar to this one:

![BotConversa - Conversation flow detail](/img/botconversa-conversation-detail.png)

Click the content block. You will be able to enter text however you like.
You can also split it into multiple messages or add other logic depending
on what you need.

### Linking the conversation flow to the webhook action

After creating and configuring your conversation flow, go back to the webhook detail
and add another action.

Select the `Enviar fluxo` option and choose the flow you just created (or any
flow you want).

![BotConversa - Conversation flow action](/img/botconversa-webhook-flow-action.png)

What you see will look similar to the image above.

This way, the conversation flow will run whenever the webhook is executed
in BotConversa.

Congratulations! You have set up BotConversa with Woovi!

## 5. Additional steps (optional)

### Adding webhook data to the conversation flow text

If you want to insert data and information from the webhook response, watch the following tutorial: 
[Webhook disponibilizado para BotConversa ser acionado por outros sistemas sem intermediários](https://us06web.zoom.us/rec/play/3Xj5dcuBRDULOApuSKMPgwJa4eCmjzHkyBwRXvgR4OHDKq2FZwyiE-YZ3Rweygr4qn8kOOo74Zcyffc7.6-YttRdjMSm1VdNm?startTime=1664975296000&_x_zm_rtaid=PZVKWRNiRkeAYNHwBjDPnA.1673398847814.5bd6a02e3760d79e2115e1c2c8286b28&_x_zm_rhtaid=589).

## 6. Additional materials from the Woovi community

- [How to generate a Pix on WhatsApp with Woovi and BotConversa via Make](https://www.youtube.com/watch?v=5wdp1lCwyYY)

<iframe width="560" height="315" src="https://www.youtube.com/embed/5wdp1lCwyYY?si=UNvkwTXheuXWqGYE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
