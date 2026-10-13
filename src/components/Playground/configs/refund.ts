import type { PlaygroundConfig, Resource } from '../types';
import { api, brl, hex, hook, json, now } from '../utils';

import RefundFinder from '../widgets/RefundFinder';

import { A, handlerTabs } from './shared';

const e2eOriginal = 'E31680000202610011130xYz8kP2qR1m';

export const refund: PlaygroundConfig = {
  id: 'refund',
  title: 'Reembolso',
  lede: 'Devolva um Pix recebido, total ou parcialmente, e encontre o reembolso de uma transação a partir do identificador que você tem em mãos.',
  docs: [
    {
      label: 'Reembolsar cobrança',
      href: '/docs/refund/charge-refund-create-api',
    },
    {
      label: 'Listar reembolsos',
      href: '/docs/refund/charge-refund-get-all-api',
    },
    {
      label: 'Webhook de reembolso enviado',
      href: '/docs/webhook/examples/webhook-refund-sent-confirmed',
    },
  ],
  widget: RefundFinder,
  widgetTitle: 'Como achar o reembolso de uma transação?',
  widgetLede:
    'Escolha o identificador que você tem. O caminho mostra a chamada certa e como ligar o reembolso à transação original.',
  actors: [
    A.you,
    A.woovi,
    { id: 'psp', title: 'Banco do pagador', sub: 'recebe a devolução' },
  ],
  scenarios: [
    {
      id: 'confirmed',
      label: 'Confirmado',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/charge/{id}/refund',
          kind: 'req',
          title: 'Peça o reembolso da cobrança',
          text: '{id} é o correlationID da cobrança. O correlationID do corpo é um ID novo, do reembolso.',
          code: json({
            correlationID: 'refund-1042-1',
            value: 2000,
            comment: 'Item fora de estoque',
          }),
          callout: {
            tone: 'warn',
            text: 'Não reuse o correlationID da cobrança no corpo. Ele é a chave de idempotência do reembolso.',
          },
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · refund IN_PROCESSING',
          kind: 'res',
          title: 'Reembolso em processamento',
          code: json({
            refund: {
              status: 'IN_PROCESSING',
              value: 2000,
              correlationID: 'refund-1042-1',
              endToEndId: 'D23114447202610011826HJNwY577YDX',
              time: '2026-10-01T17:28:51.882Z',
            },
          }),
        },
        {
          from: 'woovi',
          to: 'psp',
          label: 'Pix de devolução (endToEndId D…)',
          title: 'A devolução é um Pix novo',
          text: 'Nos exemplos, o endToEndId da devolução começa com D e o da transação original com E.',
        },
        {
          from: 'psp',
          to: 'woovi',
          label: 'aceito',
          title: 'O banco do pagador aceita',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook PIX_TRANSACTION_REFUND_SENT_CONFIRMED',
          kind: 'evt',
          title: 'Confirmado',
          text: 'O payload liga as duas pontas: refundTransaction e originalTransaction.',
          code: json({
            event: 'PIX_TRANSACTION_REFUND_SENT_CONFIRMED',
            refundTransaction: {
              type: 'REFUND',
              endToEndId: 'D23114447202610011826HJNwY577YDX',
              value: 2000,
              partial: true,
            },
            originalTransaction: {
              type: 'PAYMENT',
              endToEndId: e2eOriginal,
              value: 5000,
            },
          }),
        },
      ],
    },
    {
      id: 'rejected',
      label: 'Rejeitado',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/charge/{id}/refund',
          kind: 'req',
          title: 'Peça o reembolso',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · IN_PROCESSING',
          kind: 'res',
          title: 'Em processamento',
        },
        {
          from: 'woovi',
          to: 'psp',
          label: 'Pix de devolução',
          title: 'A devolução sai',
        },
        {
          from: 'psp',
          to: 'woovi',
          label: 'recusado',
          bad: true,
          title: 'O banco recusa',
          text: 'Por exemplo, conta do pagador bloqueada.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook PIX_TRANSACTION_REFUND_SENT_REJECTED',
          kind: 'evt',
          bad: true,
          title: 'Rejeitado',
          code: json({
            event: 'PIX_TRANSACTION_REFUND_SENT_REJECTED',
            refundTransaction: {
              endToEndId: 'D23114447202610011826HJNwY577YDX',
              value: 2000,
            },
            originalTransaction: { endToEndId: e2eOriginal },
            error: 'AC06 - Conta bloqueada do Pix',
          }),
        },
      ],
    },
  ],
  statesTitle: 'Um reembolso de cobrança tem três estados',
  statesLede:
    'Estes são os status de POST /api/v1/charge/{id}/refund. O recurso /api/v1/refund usa outro enum: IN_PROCESSING, REFUNDED e NOT_ACCOMPLISHED.',
  states: [
    { id: 'IN_PROCESSING', sub: 'devolução enviada', x: 150, y: 96 },
    { id: 'CONFIRMED', sub: 'devolvido · final', x: 470, y: 0, terminal: true },
    {
      id: 'REJECTED',
      sub: 'recusado · final',
      x: 470,
      y: 196,
      terminal: true,
      tone: 'bad',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'IN_PROCESSING', label: 'POST /refund' },
    {
      id: 'confirm',
      from: 'IN_PROCESSING',
      to: 'CONFIRMED',
      label: 'REFUND_SENT_CONFIRMED',
    },
    {
      id: 'reject',
      from: 'IN_PROCESSING',
      to: 'REJECTED',
      label: 'REFUND_SENT_REJECTED',
      sourceHandle: 'b',
    },
  ],
  lab: {
    title: 'Reembolso',
    method: 'POST',
    path: '/api/v1/charge/{id}/refund',
    pathOf: (v) => `/api/v1/charge/${v.charge}/refund`,
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'charge',
        label: 'Cobrança',
        api: '{id} na URL',
        type: 'text',
        default: 'pedido-1042',
        hint: 'correlationID da cobrança paga (R$ 50,00 neste exemplo)',
      },
      {
        id: 'value',
        label: 'Valor a devolver',
        api: 'value',
        type: 'cents',
        default: 2000,
        hint: 'vazio devolve o total ou o que resta',
      },
      {
        id: 'correlationID',
        label: 'ID do reembolso',
        api: 'correlationID',
        type: 'id',
        default: 'uuid',
        hint: 'um ID novo, diferente do da cobrança',
      },
      {
        id: 'comment',
        label: 'Comentário',
        api: 'comment',
        type: 'text',
        default: 'Item fora de estoque',
        hint: 'até 140 caracteres',
        wide: true,
      },
    ],
    body: (v) => ({
      correlationID: v.correlationID,
      value: v.value,
      ...(v.comment ? { comment: v.comment } : {}),
    }),
    createTransition: 'create',
    create: (v) => {
      if (v.correlationID === v.charge)
        return {
          log: [
            api(
              `POST /api/v1/charge/${v.charge}/refund`,
              { refund: { correlationID: v.correlationID } },
              {
                code: 0,
                note: 'não envie: este correlationID é o da cobrança. O do corpo precisa ser um ID novo, só do reembolso.',
              },
            ),
          ],
        };
      const r: Resource = {
        status: 'IN_PROCESSING',
        value: v.value,
        chargeValue: 5000,
        charge: v.charge,
        correlationID: v.correlationID,
        endToEndId: 'D' + hex(31).toUpperCase(),
        time: now(),
        comment: v.comment,
      };
      return {
        resource: r,
        log: [
          api(`POST /api/v1/charge/${v.charge}/refund`, {
            refund: {
              status: r.status,
              value: r.value,
              correlationID: r.correlationID,
              endToEndId: r.endToEndId,
              time: r.time,
              comment: r.comment,
            },
          }),
        ],
      };
    },
    actions: [
      {
        id: 'confirm',
        label: 'Banco aceita',
        primary: true,
        from: ['IN_PROCESSING'],
        to: 'CONFIRMED',
        transition: 'confirm',
        log: (r) => [
          hook('PIX_TRANSACTION_REFUND_SENT_CONFIRMED', {
            refundTransaction: {
              type: 'REFUND',
              endToEndId: r.endToEndId,
              value: r.value,
              partial: r.value < r.chargeValue,
              time: now(),
            },
            originalTransaction: {
              type: 'PAYMENT',
              endToEndId: e2eOriginal,
              value: r.chargeValue,
            },
          }),
        ],
      },
      {
        id: 'reject',
        label: 'Banco recusa',
        from: ['IN_PROCESSING'],
        to: 'REJECTED',
        transition: 'reject',
        log: (r) => [
          hook('PIX_TRANSACTION_REFUND_SENT_REJECTED', {
            refundTransaction: {
              type: 'REFUND',
              endToEndId: r.endToEndId,
              value: r.value,
            },
            originalTransaction: { type: 'PAYMENT', endToEndId: e2eOriginal },
            error: 'AC06 - Conta bloqueada do Pix',
          }),
        ],
      },
      {
        id: 'list',
        label: 'Listar reembolsos da cobrança',
        from: ['IN_PROCESSING', 'CONFIRMED', 'REJECTED'],
        to: '',
        transition: '',
        log: (r) => [
          api(`GET /api/v1/charge/${r.charge}/refund`, {
            refunds: [
              {
                status: r.status,
                value: r.value,
                correlationID: r.correlationID,
                endToEndId: r.endToEndId,
                time: r.time,
              },
            ],
          }),
        ],
      },
    ],
    summary: (r) => [
      [
        'valor',
        `${brl(r.value)} de ${brl(r.chargeValue)}${r.value < r.chargeValue ? ' · parcial' : ' · total'}`,
      ],
      ['cobrança', r.charge],
      ['correlationID', r.correlationID],
      ['endToEndId', r.endToEndId],
    ],
    explain: {
      NONE: 'Envie a requisição. Copie o ID da cobrança para o ID do reembolso e veja o alerta.',
      IN_PROCESSING: 'A devolução está a caminho do banco do pagador.',
      CONFIRMED: 'Um reembolso concluído não pode ser desfeito.',
      REJECTED:
        'O dinheiro não saiu. Verifique o erro antes de tentar de novo.',
    },
    handler: handlerTabs(
      `if (data.event === 'PIX_TRANSACTION_REFUND_SENT_CONFIRMED') {
  // ligue a devolução à transação original
  await db.refunds.upsert({
    refundEndToEndId: data.refundTransaction.endToEndId,
    originalEndToEndId: data.originalTransaction.endToEndId,
    value: data.refundTransaction.value,
    partial: data.refundTransaction.partial,
    status: 'CONFIRMED',
  });
}

if (data.event === 'PIX_TRANSACTION_REFUND_SENT_REJECTED') {
  await db.refunds.markRejected(data.refundTransaction.endToEndId, data.error);
}`,
      `if ($data['event'] === 'PIX_TRANSACTION_REFUND_SENT_CONFIRMED') {
  $refund = $data['refundTransaction']['endToEndId'];
  $original = $data['originalTransaction']['endToEndId'];
  // salve o par refund → original
}`,
    ),
  },
};
