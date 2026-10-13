import type { PlaygroundConfig, Resource } from '../types';
import { api, brl, buildBrCode, endToEndId, hook, json, uuid } from '../utils';

import { A, company, handlerTabs } from './shared';

export const qrcodeStatic: PlaygroundConfig = {
  id: 'qrcode-estatico',
  title: 'QR Code estático',
  lede: 'Um QR Code estático recebe quantos pagamentos vierem, para sempre, com ou sem valor fixo. Não tem status nem expiração: cada pagamento chega como uma transação, e o identifier diz de qual QR veio.',
  docs: [
    { label: 'QR Code estático', href: '/docs/qrcode-static/qrcode-static' },
    {
      label: 'Criar via API',
      href: '/docs/qrcode-static/how-to-create-qrcode-static-using-api',
    },
    {
      label: 'Webhook de transação recebida',
      href: '/docs/webhook/examples/webhook-transaction-received',
    },
  ],
  actors: [A.cli, A.you, A.woovi, A.bank],
  scenarios: [
    {
      id: 'counter',
      label: 'QR no balcão',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/qrcode-static',
          kind: 'req',
          title: 'Crie o QR uma vez',
          text: 'name e identifier são obrigatórios. identifier tem até 25 caracteres, só letras e números.',
          code: json({
            name: 'Caixa 01',
            identifier: 'caixa01loja12',
            value: 1000,
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · brCode, qrCodeImage',
          kind: 'res',
          title: 'Imprima e cole no balcão',
          text: 'O identifier vai dentro do brCode, no campo 62, subcampo 05.',
        },
        {
          from: 'cli',
          to: 'bank',
          label: 'Lê o QR e paga',
          title: 'Primeiro cliente paga',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook OPENPIX:TRANSACTION_RECEIVED',
          kind: 'evt',
          title: 'Uma transação por pagamento',
          text: 'pixQrCode identifica o QR; charge vem null porque não há cobrança.',
          code: json({
            event: 'OPENPIX:TRANSACTION_RECEIVED',
            charge: null,
            pixQrCode: { name: 'Caixa 01', identifier: 'caixa01loja12' },
            pix: {
              value: 1000,
              endToEndId: 'E18236120202610011436s0123456789',
              status: 'CONFIRMED',
            },
          }),
        },
        {
          from: 'cli',
          to: 'bank',
          label: 'Outro cliente paga o mesmo QR',
          title: 'O QR continua valendo',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook OPENPIX:TRANSACTION_RECEIVED',
          kind: 'evt',
          title: 'Mais uma transação',
          text: 'Mesmo identifier, endToEndId diferente. Concilie pelo endToEndId.',
        },
      ],
    },
    {
      id: 'lookup',
      label: 'Consultar o que entrou',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/transaction?pixQrCode=caixa01loja12',
          kind: 'req',
          title: 'Liste as transações do QR',
          text: 'O filtro aceita o ID, o correlationID ou o identifier do QR.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · transactions[]',
          kind: 'res',
          title: 'Tudo que o QR recebeu',
        },
      ],
    },
  ],
  lab: {
    title: 'QR Code estático',
    method: 'POST',
    path: '/api/v1/qrcode-static',
    fields: [
      {
        id: 'name',
        label: 'Nome',
        api: 'name',
        type: 'text',
        default: 'Caixa 01',
      },
      {
        id: 'identifier',
        label: 'Identificador no QR',
        api: 'identifier',
        type: 'text',
        default: 'caixa01loja12',
        hint: 'até 25 letras e números',
      },
      {
        id: 'value',
        label: 'Valor fixo',
        api: 'value',
        type: 'cents',
        default: 1000,
        hint: '0 deixa o pagador escolher',
      },
      {
        id: 'comment',
        label: 'Comentário',
        api: 'comment',
        type: 'text',
        default: 'Balcão da loja 12',
      },
    ],
    body: (v) => ({
      name: v.name,
      identifier: v.identifier,
      ...(v.value ? { value: v.value } : {}),
      ...(v.comment ? { comment: v.comment } : {}),
    }),
    createTransition: '',
    create: (v) => {
      if (!/^[A-Za-z0-9]{1,25}$/.test(String(v.identifier)))
        return {
          log: [
            api(
              'POST /api/v1/qrcode-static',
              { error: 'identifier inválido' },
              {
                code: 400,
                note: 'até 25 caracteres, só letras e números, sem espaços',
              },
            ),
          ],
        };
      const r: Resource = {
        status: 'criado',
        name: v.name,
        identifier: v.identifier,
        correlationID: uuid(),
        value: v.value,
        received: 0,
        count: 0,
        brCode: buildBrCode({
          key: 'd94d2ebc-0b3e-4b48-8b96-2eddac9e4f0e',
          value: v.value || undefined,
          name: 'LOJA EXEMPLO',
          city: 'SAO PAULO',
          txid: v.identifier,
        }),
      };
      return {
        resource: r,
        log: [
          api('POST /api/v1/qrcode-static', {
            pixQrCode: {
              name: r.name,
              identifier: r.identifier,
              correlationID: r.correlationID,
              paymentLinkUrl: 'https://woovi.com/pay/' + uuid(),
              brCode: r.brCode,
            },
          }),
        ],
      };
    },
    actions: [
      {
        id: 'pay',
        label: 'Simular um pagamento',
        primary: true,
        from: ['criado'],
        to: 'criado',
        transition: '',
        apply: (r) => ({
          ...r,
          count: r.count + 1,
          received: r.received + (r.value || 2500),
        }),
        log: (r) => [
          hook(
            'OPENPIX:TRANSACTION_RECEIVED',
            {
              charge: null,
              pixQrCode: {
                name: r.name,
                identifier: r.identifier,
                correlationID: r.correlationID,
              },
              pix: {
                value: r.value || 2500,
                endToEndId: endToEndId(),
                status: 'CONFIRMED',
                type: 'STATIC',
                transactionID: r.identifier,
                infoPagador: r.value
                  ? undefined
                  : 'valor escolhido pelo pagador',
              },
              company,
            },
            { note: `pagamento nº ${r.count} neste QR` },
          ),
        ],
      },
      {
        id: 'list',
        label: 'Listar transações do QR',
        from: ['criado'],
        to: 'criado',
        transition: '',
        log: (r) => [
          api(`GET /api/v1/transaction?pixQrCode=${r.identifier}`, {
            transactions: Array.from({ length: r.count }, () => ({
              value: r.value || 2500,
              type: 'STATIC',
            })),
            pageInfo: { skip: 0, limit: 100, totalCount: r.count },
          }),
        ],
      },
      {
        id: 'delete',
        label: 'Excluir QR',
        from: ['criado'],
        to: 'excluído',
        transition: '',
        log: (r) => [
          api(`DELETE /api/v1/qrcode-static/${r.correlationID}`, {
            status: 'OK',
            id: r.correlationID,
          }),
        ],
      },
    ],
    summary: (r) => [
      ['identifier', r.identifier],
      ['valor', r.value ? brl(r.value) : 'livre'],
      ['pagamentos', `${r.count} · ${brl(r.received)}`],
    ],
    qr: (r) => (r.status === 'criado' ? r.brCode : undefined),
    explain: {
      NONE: 'A API não tem campo status para QR estático; "criado" e "excluído" aqui são só rótulos da página.',
      criado:
        'Pague várias vezes: cada pagamento é uma transação nova, no mesmo QR.',
      excluído: 'Excluído, o QR para de aceitar pagamentos.',
    },
    handler: handlerTabs(
      `if (data.event === 'OPENPIX:TRANSACTION_RECEIVED' && data.pixQrCode) {
  // concilie pelo endToEndId: cada pagamento no QR é único
  await db.sales.insertIfMissing({
    endToEndId: data.pix.endToEndId,
    qr: data.pixQrCode.identifier,
    value: data.pix.value,
  });
}`,
      `if ($data['event'] === 'OPENPIX:TRANSACTION_RECEIVED' && $data['pixQrCode']) {
  $qr = $data['pixQrCode']['identifier'];
  $e2e = $data['pix']['endToEndId']; // chave única da venda
}`,
    ),
  },
};
