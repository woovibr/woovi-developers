---
id: how-to-payment-link-custom-domain
title: How to serve the payment link on your own domain?
tags:
  - charge
  - payment
---

By default, a charge's payment link lives at `https://woovi.com/pay/<paymentLinkID>`.
If you want your customers to see an address with your brand, such as `https://pay.yourstore.com/pay/<paymentLinkID>`,
put a **reverse proxy on your own infrastructure** pointing to Woovi.

You don't need access to Woovi's infrastructure or any setting on the platform.
The payment page is still Woovi's; only the address changes.

## How it works

```text
Payer ──> pay.yourstore.com/pay/...  ──(your proxy)──>  woovi.com/pay/...
```

Everything the payment page needs lives under the `/pay` path: the HTML, scripts, icons
and the API the page calls (`/pay/graphql`). So the proxy only needs to forward that path
(and `/receipts`, if you also want to serve receipts).

Real-time payment confirmation uses a websocket that the browser opens directly with `wss://woovi.com`.
You don't need to forward that traffic.

## Prerequisites

- A domain or subdomain you own, for example `pay.yourstore.com`.
- A valid TLS certificate for that domain (Let's Encrypt, for example).
- A reverse proxy: nginx, Caddy, Cloudflare, AWS ALB/CloudFront, etc.

## Configuring the proxy

The most important part is sending the `Host: woovi.com` header to Woovi. Without it, the request is rejected.

### nginx

```nginx
server {
  listen 443 ssl http2;
  server_name pay.yourstore.com;

  ssl_certificate     /etc/ssl/pay.yourstore.com/fullchain.pem;
  ssl_certificate_key /etc/ssl/pay.yourstore.com/privkey.pem;

  # payment page, scripts, icons and the page's API
  location /pay/ {
    proxy_pass https://woovi.com;
    proxy_set_header Host woovi.com;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_ssl_server_name on;
  }

  # optional: receipts
  location /receipts/ {
    proxy_pass https://woovi.com;
    proxy_set_header Host woovi.com;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_ssl_server_name on;
  }
}
```

### Caddy

```caddy
pay.yourstore.com {
  @woovi path /pay/* /receipts/*
  reverse_proxy @woovi https://woovi.com {
    header_up Host woovi.com
  }
}
```

Caddy issues the TLS certificate automatically.

## Sending the link with your domain

The API still returns `paymentLinkUrl` with Woovi's domain. Before sending the link to your customer,
swap the domain for yours. The `paymentLinkID` stays the same:

```js
const toMyDomain = (paymentLinkUrl) =>
  paymentLinkUrl.replace(
    'https://woovi.com/pay/',
    'https://pay.yourstore.com/pay/',
  );

// https://woovi.com/pay/1efcc519-...  ->  https://pay.yourstore.com/pay/1efcc519-...
```

If you build the link from the `paymentLinkID`, use `https://pay.yourstore.com/pay/<paymentLinkID>` directly.

Emails and messages that Woovi itself sends to the payer still use `woovi.com`.

## Testing

1. Create a charge and copy its `paymentLinkID`.
2. Open `https://pay.yourstore.com/pay/<paymentLinkID>` in a browser. The QR Code and the Pix Copy and Paste button should show up.
3. Check that the page's API answers on your domain:

```bash
curl -s -X POST https://pay.yourstore.com/pay/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ __typename }"}'
# {"data":{"__typename":"Query"}}
```

4. Pay the charge and watch the page switch to "paid" without reloading.

## Limitations

- Link previews in apps such as WhatsApp (title, image and URL) still point to `woovi.com`.
- The page keeps Woovi's visual identity.
- All traffic reaches Woovi from your proxy's IP. If you expect high traffic, talk to our support before going to production.

## Security

The proxy sits between the payer and Woovi and can see and change the page, including the QR Code.
Keep the server up to date, use HTTPS only and don't modify the content returned by Woovi.
