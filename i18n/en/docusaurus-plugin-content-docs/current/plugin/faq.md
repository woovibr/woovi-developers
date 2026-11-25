---
id: plugin-faq
title: FAQ
tags:
  - plugin
  - api
  - faq
---

## How do I use the JavaScript Plugin inside an iframe?

To use the JavaScript Plugin inside an iframe, add the `allow="clipboard-read; clipboard-write"` attribute to the iframe.

Example

```html
<iframe
  class="frameapp"
  frameborder="0"
  src="https://woovi.com/cashback"
  width="372"
  height="555"
  style="border: 10px blue solid;"
  allow="clipboard-read; clipboard-write"
></iframe>
```
