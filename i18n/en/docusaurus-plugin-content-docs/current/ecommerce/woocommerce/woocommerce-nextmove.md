---
id: woocommerce-nextmove
title: Configuring WooCommerce Openpix with NextMove
sidebar_label: Woovi Plugin NextMove
tags:
- ecommerce
- woocommerce
- plugin
---

## Integrating Woovi with NextMove

1. Install the Woovi Plugin on your WooCommerce instance
2. Configure the WooCommerce Plugin [here](./woocommerce-plugin.mdx)
3. In the NextMove plugin, go to `Settings` > `Edit/rules` of the `Thank You` page

![NextMove-settings](/img/ecommerce/woocommerce/woocommerce-nextmove-settings.png)

4. On the edit page, click `Manage Components`

5. On the component edit page, click `HTML` and add the following code

```html
<div id='openpix-order' style='margin-bottom: 40px'></div>
```

![NextMove-settings](/img/ecommerce/woocommerce/woocommerce-nextmove-html-settings.png)

6. Create a charge using Woovi and check that the QR code is displayed
