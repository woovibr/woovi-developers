---
id: faq-not-display-QRCode-checkout
title: QrCode-Magento1
sidebar_label: QrCode Checkout Magento1
tags:
- faq
- magento1
- qrcode
- checkout
---

### The QR Code doesn't show up in the Magento1 checkout

If your Magento store has a custom checkout, the QR Code may not show up in the checkout. This is because our files live in Magento's default folders, while the custom checkout lives in another one.

To fix this, copy the files from the
`app/design/frontend/base/default/template/openpix/*` and `app/design/frontend/base/default/layout/openpix/*` folders to the folder of your custom checkout, e.g. `app/design/frontend/layout-personalizado/template/openpix/*` and `app/design/frontend/layout-personalizado/layout/openpix/*`.
