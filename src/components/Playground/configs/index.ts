import type { PlaygroundConfig } from '../types';

import { charge } from './charge';
import { boleto } from './boleto';
import { ted } from './ted';
import { pixAuth } from './pixAuth';
import { refund } from './refund';
import { stablecoin } from './stablecoin';
import { baas } from './baas';
import { invoice } from './invoice';
import { qrcodeStatic } from './qrcodeStatic';
import { transfer } from './transfer';
import { campaign } from './campaign';
import { loan } from './loan';
import { embedBaas, qrcodePix, split, webhook } from './more';

export type PlaygroundGroup = {
  id: string;
  label: string;
  hint: string;
  items: string[];
};

export const playgrounds: Record<string, PlaygroundConfig> = Object.fromEntries(
  [
    charge,
    qrcodePix,
    qrcodeStatic,
    boleto,
    split,
    ted,
    transfer,
    stablecoin,
    baas,
    embedBaas,
    pixAuth,
    campaign,
    refund,
    webhook,
    invoice,
    loan,
  ].map((c) => [c.id, c]),
);

/** how the hub groups the playgrounds (also the question flow) */
export const groups: PlaygroundGroup[] = [
  {
    id: 'receive',
    label: 'Receber pagamentos',
    hint: 'Pix, boleto, divisão de valores',
    items: ['cobranca-pix', 'qrcode-estatico', 'boleto', 'split'],
  },
  {
    id: 'send',
    label: 'Enviar e mover dinheiro',
    hint: 'TED, entre contas, cripto',
    items: ['ted', 'transferencia-interna', 'stablecoin'],
  },
  {
    id: 'accounts',
    label: 'Contas e identidade',
    hint: 'BaaS, KYC, validar documento',
    items: ['baas', 'embed-baas', 'pix-auth', 'campanha-chave-pix'],
  },
  {
    id: 'operate',
    label: 'Operar e conciliar',
    hint: 'webhooks, reembolsos, QR, notas',
    items: ['webhook', 'refund', 'qrcode-pix', 'invoice'],
  },
  {
    id: 'credit',
    label: 'Crédito',
    hint: 'empréstimo para os seus clientes',
    items: ['emprestimo'],
  },
];

export const docPath = (id: string) => `/docs/playground/playground-${id}`;
