---
id: plugin-order
title: Renderizando uma cobrança Pix existente
tags:
  - plugin
  - order
  - charge
  - pix
---

## Renderizando uma cobrança Pix existente

Para renderizar a cobrança Pix igual a Woovi renderiza no link de pagamento (ex. [https://woovi.com/pay/13829f18-ef6b-4842-9f6c-583f2b50940d](https://woovi.com/pay/13829f18-ef6b-4842-9f6c-583f2b50940d))

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Woovi Order</title>
  </head>
  <body>
    <!-- Woovi order -->
    <div 
      id='openpix-order' 
      data-appid={"your app id"}
      data-correlationid={"charge correlationID"} 
    />
    <script src="https://plugin.woovi.com/v1/openpix.js" async></script>
  </body>
</html>
```

![Plugin JS](./__assets__/plugin-order.png)