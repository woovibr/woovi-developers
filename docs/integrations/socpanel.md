---
id: socpanel-woovi
title: Integrar SocPanel com Pix
tags:
  - integration
  - socpanel
---

## Pré requisitos para integrar o SocPanel com Pix

Para integrar o SocPanel com Pix, você deve:

- 1. Possuir um ambiente da SocPanel configurado
- 2. Possuir acesso à plataforma da woovi

## Como integrar o SocPanel com Pix?

### Adicionar a woovi como meio de pagamento

- 1. Acesse o ambiente da SocPanel e clique em **Meios de Pagamento**
- 2. Clique em **Adicionar Meio de Pagamento**

![SocPanel payment method](/img/integrations/soc-panel-payment-method.png)

- 1. Pesquise por **woovi** e clique em **Adicionar**
![SocPanel Info](/img/integrations/soc-panel-info.png)

### Configurar o woovi

- 1. Dentro da plataforma da woovi acesse [aqui](https://app.woovi.com.br/home/applications/add), e crie uma API
- 2. Copie o APP ID e cole no campo **Authorization** do SocPanel
![SocPanel AppID](/img/integrations/socpanel-app-id.png)
- 3. Crie um **Webhook** para receber as notificações de pagamento [aqui](https://app.woovi.com.br/home/applications/webhook/create)
  - 3.1 Copie o campo **URL** do seu webhook mostrado no SocPanel. Exemplo: `https://meusite.com/api/payments/woovi/webhook`
  - 3.2 Preencha a página de webhook assim:
    ![SocPanel AppID](/img/integrations/socpanel-webhook-page.png)
  - 3.3 Clique em **Salvar**
- 4. Acesse o detalhe do webhook criado
  - 4.1 Copie o campo **HMAC Secret Key** e cole no campo **HMAC Secret Key** do SocPanel
- 5. Garanta que o preenchimento dos campos está semelhante ao da imagem abaixo
  ![SocPanel AppID](/img/integrations/socpanel-filled-form.png)
- 6. Clique em **Adicionar tipo de pagamento** na plataforma da SocPanel e pronto!
