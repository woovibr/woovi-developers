import type { Actor } from '../types';

export const A = {
  cli: { id: 'cli', title: 'Cliente', sub: 'navegador / app' },
  you: { id: 'you', title: 'Seu sistema', sub: 'backend' },
  woovi: { id: 'woovi', title: 'Woovi', sub: 'api.woovi.com' },
  bank: { id: 'bank', title: 'Banco do pagador', sub: 'Pix · SPI' },
} satisfies Record<string, Actor>;

export const company = {
  id: '5fa58a32bb2a83003433e506',
  name: 'Loja Exemplo',
  taxID: '05460236000124',
};

/** Express handler that verifies x-webhook-signature and then runs `body` */
export function nodeHandler(body: string): string {
  return `import crypto from 'node:crypto';
import express from 'express';

// chave pública da Woovi em base64 (GET /api/v1/webhook/public-keys)
const WOOVI_PUBLIC_KEY = Buffer.from(process.env.WOOVI_PUBLIC_KEY_BASE64, 'base64').toString('ascii');

const app = express();

// corpo bruto: a assinatura é calculada sobre os bytes exatos
app.post('/webhooks/woovi', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.header('x-webhook-signature');
  const verify = crypto.createVerify('sha256');
  verify.write(req.body);
  verify.end();
  if (!signature || !verify.verify(WOOVI_PUBLIC_KEY, signature, 'base64')) {
    return res.sendStatus(401);
  }

  const data = JSON.parse(req.body.toString());

${body
  .split('\n')
  .map((l) => (l ? '  ' + l : l))
  .join('\n')}

  res.sendStatus(200); // em até 100 s; trabalho pesado vai para uma fila
});`;
}

export function phpHandler(body: string): string {
  return `<?php
$payload = file_get_contents('php://input'); // corpo bruto
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
$publicKey = base64_decode(getenv('WOOVI_PUBLIC_KEY_BASE64'));

$ok = openssl_verify($payload, base64_decode($signature), $publicKey, 'sha256WithRSAEncryption');
if ($ok !== 1) { http_response_code(401); exit; }

$data = json_decode($payload, true);
${body}
http_response_code(200);`;
}

export const handlerTabs = (node: string, php: string) => [
  { label: 'Node.js', language: 'js', code: nodeHandler(node) },
  { label: 'PHP', language: 'php', code: phpHandler(php) },
];
