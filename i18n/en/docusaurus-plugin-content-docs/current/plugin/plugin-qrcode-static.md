---
id: plugin-qrcode-static
title: Generate a Static QR Code using the Plugin
tags:
- misc
- plugin
---

## Generating a Static QR Code

```jsx
window.$openpix.push([
  'static',
  {
    key: 'pixKey - cpf/email/phone',
    value: 1000,
    name: 'Merchant Name',
    reference: 'Description name',
  },
]);
```

- key (required): Pix key that receives the payment
- value (optional): charge amount in cents
- name (optional): merchant name
- reference (optional): description of this charge
