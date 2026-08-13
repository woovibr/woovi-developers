---
id: webhook-public-keys
title: "Buscando a chave pública da Woovi via API"
description: "Endpoint público que retorna a chave usada para verificar o header x-webhook-signature"
tags:
  - webhook
  - security
  - signature
  - api
---

A Woovi assina todo webhook que envia. A chave pública que verifica essa assinatura
está publicada num endpoint aberto, para você buscá-la programaticamente em vez de
deixá-la fixa no seu código:

```
GET https://api.woovi.com/api/v1/webhook/public-keys
```

O mesmo endpoint responde em todos os domínios da API:

| Ambiente | URL |
|----------|-----|
| Produção (Woovi) | `https://api.woovi.com/api/v1/webhook/public-keys` |
| Produção (OpenPix) | `https://api.openpix.com.br/api/v1/webhook/public-keys` |
| Sandbox | `https://api.woovi-sandbox.com/api/v1/webhook/public-keys` |

**Não é preciso autenticação.** A chave é pública por definição, e quem recebe webhook
normalmente valida a assinatura num contexto que não tem o AppID em mãos.

## A resposta

```json
{
  "public_keys": [
    {
      "key_identifier": "9dce618794f8986c603915a51b7029126c260e5cfdb2aa47e131d837fd62311c",
      "is_current": true,
      "key": "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/+NtIkjzevvqD+I3MMv3bLXDt\npvxBjY4BsRrSdca3rtAwMcRYYvxSnd7jagVLpctMiOxQO8ieUCKLSWHpsMAjO/zZ\nWMKbqoG8MNpi/u3fp6zz0mcHCOSqYsPUUG19buW8bis5ZZ2IZgBObWSpTvJ0cnj6\nHKBAA82Jln+lGwS1MwIDAQAB\n-----END PUBLIC KEY-----\n"
    }
  ]
}
```

| Campo | O que é |
|-------|---------|
| `key` | A chave pública em PEM, pronta para uso |
| `key_identifier` | SHA-256 da chave em DER — identifica a chave de forma estável |
| `is_current` | `true` na chave que está assinando os webhooks agora |

## Por que é uma lista

Hoje há uma chave só. A resposta é uma lista para que a chave possa ser trocada sem
quebrar sua integração: durante uma rotação publicamos a chave antiga e a nova ao mesmo
tempo, e `is_current` indica qual está assinando.

**Aceite qualquer chave da lista ao verificar.** Se você aceitar apenas a `is_current`,
volta a ter o mesmo problema da chave fixa no código — os webhooks assinados com a chave
anterior, ainda em trânsito ou em retry, falham na validação.

## Como a assinatura funciona

Todo webhook chega com o header `x-webhook-signature`. Ele é:

```
base64( RSA-SHA256( corpo bruto da request, chave privada da Woovi ) )
```

Dois detalhes que costumam derrubar a validação:

1. **Assine o corpo bruto.** Verifique antes de fazer o parse do JSON. Se você fizer
   `JSON.parse` e depois `JSON.stringify` para reconstruir o corpo, a ordem das chaves e
   o espaçamento mudam, os bytes mudam, e a assinatura não bate mais. A maioria dos
   frameworks tem uma forma de guardar o corpo cru (`express.json({ verify })`,
   `php://input`, etc.).
2. **A assinatura vem em Base64**, não em hexadecimal.

## Exemplo

Buscando a chave e validando o webhook:

```js
import crypto from 'crypto';

// Busque uma vez e mantenha em cache — a resposta traz Cache-Control de 1 hora.
// Não busque a cada webhook recebido.
let cachedKeys = null;

const getPublicKeys = async () => {
  if (cachedKeys) return cachedKeys;

  const response = await fetch('https://api.woovi.com/api/v1/webhook/public-keys');
  const { public_keys } = await response.json();

  cachedKeys = public_keys.map((entry) => entry.key);

  return cachedKeys;
};

// `rawBody` precisa ser o corpo exatamente como chegou (Buffer ou string),
// nunca o objeto já parseado e reserializado.
export const verifyWebhook = async ({ rawBody, signature }) => {
  const keys = await getPublicKeys();

  return keys.some((publicKey) => {
    const verify = crypto.createVerify('sha256');

    verify.write(Buffer.from(rawBody));
    verify.end();

    return verify.verify(publicKey, signature, 'base64');
  });
};
```

Recebendo no Express, preservando o corpo bruto:

```js
import express from 'express';

const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.post('/webhook', async (req, res) => {
  const isValid = await verifyWebhook({
    rawBody: req.rawBody,
    signature: req.headers['x-webhook-signature'],
  });

  if (!isValid) {
    return res.status(401).send('assinatura inválida');
  }

  // a partir daqui o payload é confiável
  res.status(200).send('ok');
});
```

## Cache

A resposta vem com `Cache-Control: public, max-age=3600`. Busque a chave na inicialização
da aplicação ou em cache com TTL de 1 hora — não faça uma request a este endpoint a cada
webhook recebido.

Se a busca falhar, prefira continuar usando a chave que você já tem em cache a rejeitar o
webhook: uma indisponibilidade temporária deste endpoint não significa que o webhook é
inválido.

## E o HMAC?

São mecanismos diferentes e complementares:

| Método | Header | O que prova |
|--------|--------|-------------|
| Assinatura | `x-webhook-signature` | Que o webhook veio **da Woovi** — chave pública da Woovi |
| HMAC | `x-openpix-signature` | Que o webhook veio **da sua configuração específica de webhook** — secret que você definiu |

A assinatura é o método recomendado. Veja
[Validando Webhook payload usando x-webhook-signature](./webhook-signature-validation)
para mais exemplos, e [Webhook IPs](./webhook-ips) para restringir por origem no firewall.
