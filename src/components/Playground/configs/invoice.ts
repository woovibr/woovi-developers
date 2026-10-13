import type { PlaygroundConfig, Resource } from '../types';
import { api, brl, hex, json } from '../utils';

import { A } from './shared';

export const invoice: PlaygroundConfig = {
  id: 'invoice',
  title: 'Nota fiscal',
  lede: 'Emita NFS-e pela API depois de configurar a integração fiscal. A emissão é assíncrona: a nota nasce PENDING e os arquivos só existem quando ela está CONFIRMED.',
  docs: [
    {
      label: 'Emitir pela API',
      href: '/docs/invoice/how-to-issue-invoice-by-api',
    },
    {
      label: 'Baixar arquivos',
      href: '/docs/invoice/how-to-get-invoice-files-by-api',
    },
    {
      label: 'Cancelar',
      href: '/docs/invoice/how-to-cancel-issued-invoice-by-api',
    },
    {
      label: 'Configurar a integração',
      href: '/docs/baas/baas-invoice-integration',
    },
  ],
  actors: [
    A.you,
    A.woovi,
    { id: 'prov', title: 'Emissor', sub: 'prefeitura / NFE.io' },
  ],
  scenarios: [
    {
      id: 'setup',
      label: 'Configuração',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/invoice/integration',
          kind: 'req',
          title: 'Crie a integração',
          text: 'Dados fiscais do município. Todos opcionais na criação.',
          code: json({
            cityServiceCode: '2690',
            municipalSubscription: '123456',
            rpsNumber: '1',
            taxRegime: 'LimitedProfit',
            specialTax: 'None',
            isPortalNacional: false,
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · status CONFIGURING',
          kind: 'res',
          title: 'Integração em configuração',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /invoice/integration/certificate',
          kind: 'req',
          title: 'Envie o certificado A1',
          text: 'O arquivo .pfx/.p12 em base64. Repare na grafia do campo: pcks12.',
          code: json({ pcks12: '<base64>', passphrase: '…' }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /invoice/integration/test',
          kind: 'req',
          title: 'Emita uma nota de teste',
          text: 'A integração vai para VALIDATING.',
        },
        {
          from: 'prov',
          to: 'woovi',
          label: 'confirma a nota de teste',
          title: 'O emissor valida',
        },
        {
          note: 'woovi',
          label: 'CONFIGURED · isActive true',
          title: 'Pronta para emitir',
          text: 'Depois de configurada, a integração não emite mais notas de teste.',
        },
      ],
    },
    {
      id: 'issue',
      label: 'Emissão',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/invoice',
          kind: 'req',
          title: 'Peça a nota',
          text: 'correlationID e billingDate são obrigatórios, mais charge ou value, mais customerId ou customer.',
          code: json({
            correlationID: 'nfse-assinatura-pro-2026-10',
            description: 'Assinatura Pro - Outubro/2026',
            billingDate: '2026-10-31T23:59:59.000Z',
            value: 12990,
            customerId: 'cus_123',
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '201 · status PENDING',
          kind: 'res',
          title: 'Na fila',
          code: json({
            invoice: {
              id: '6a5f62d35ab4cd72544b1a48',
              correlationID: 'nfse-assinatura-pro-2026-10',
              value: 12990,
              status: 'PENDING',
            },
          }),
        },
        {
          from: 'woovi',
          to: 'prov',
          label: 'envia para emissão',
          title: 'Emissão assíncrona',
          text: 'A nota passa por PROCESSING.',
        },
        {
          from: 'prov',
          to: 'woovi',
          label: 'nota autorizada',
          title: 'CONFIRMED',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/invoice',
          kind: 'req',
          title: 'Consulte o status',
          text: 'Os docs não listam webhook de nota fiscal para integradores: consulte pela API.',
          callout: {
            tone: 'warn',
            text: 'Não há evento de nota emitida. Agende consultas até a nota ficar CONFIRMED.',
          },
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /invoice/{correlationID}/pdf',
          kind: 'req',
          title: 'Baixe PDF e XML',
          text: 'Só funciona com a nota CONFIRMED.',
        },
      ],
    },
  ],
  statesTitle: 'A nota só tem arquivos quando está CONFIRMED',
  statesLede:
    'O cancelamento devolve { "success": true }. Os docs dizem que os documentos ficam marcados como cancelados, mas não citam o nome do status.',
  states: [
    { id: 'PENDING', sub: 'na fila', x: 150, y: 80 },
    { id: 'PROCESSING', sub: 'no emissor', x: 400, y: 80 },
    { id: 'CONFIRMED', sub: 'autorizada · PDF e XML', x: 650, y: 80 },
    {
      id: 'cancelada',
      sub: 'nome do status não documentado',
      x: 650,
      y: 230,
      terminal: true,
      tone: 'muted',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'PENDING', label: 'POST /invoice' },
    { id: 'process', from: 'PENDING', to: 'PROCESSING', label: 'emissão' },
    { id: 'confirm', from: 'PROCESSING', to: 'CONFIRMED', label: 'autorizada' },
    {
      id: 'cancel',
      from: 'CONFIRMED',
      to: 'cancelada',
      label: 'POST /cancel',
      sourceHandle: 'b',
      targetHandle: 't',
    },
  ],
  lab: {
    title: 'Nota fiscal',
    method: 'POST',
    path: '/api/v1/invoice',
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'value',
        label: 'Valor',
        api: 'value',
        type: 'cents',
        default: 12990,
      },
      {
        id: 'customerId',
        label: 'Cliente',
        api: 'customerId',
        type: 'text',
        default: 'cus_123',
        hint: 'apague para ver o erro de cliente',
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'text',
        default: 'nfse-assinatura-pro-2026-10',
        hint: 'único por conta',
      },
      {
        id: 'billingDate',
        label: 'Data de competência',
        api: 'billingDate',
        type: 'text',
        default: '2026-10-31T23:59:59.000Z',
      },
      {
        id: 'description',
        label: 'Descrição',
        api: 'description',
        type: 'text',
        default: 'Assinatura Pro - Outubro/2026',
        wide: true,
      },
    ],
    body: (v) => ({
      correlationID: v.correlationID,
      description: v.description,
      billingDate: v.billingDate,
      value: v.value,
      ...(v.customerId ? { customerId: v.customerId } : {}),
    }),
    createTransition: 'create',
    create: (v) => {
      if (!String(v.customerId).trim())
        return {
          log: [
            api(
              'POST /api/v1/invoice',
              { error: 'Customer is required' },
              { code: 400 },
            ),
          ],
        };
      const r: Resource = {
        id: hex(24),
        status: 'PENDING',
        correlationID: v.correlationID,
        value: v.value,
        billingDate: v.billingDate,
        customer: v.customerId,
      };
      return {
        resource: r,
        log: [
          api(
            'POST /api/v1/invoice',
            {
              invoice: {
                id: r.id,
                correlationID: r.correlationID,
                value: r.value,
                status: 'PENDING',
                statusRaw: null,
                billingDate: r.billingDate,
                customer: { correlationID: r.customer, name: 'Maria Souza' },
              },
            },
            { code: 201 },
          ),
        ],
      };
    },
    actions: [
      {
        id: 'process',
        label: 'Emissor recebe',
        from: ['PENDING'],
        to: 'PROCESSING',
        transition: 'process',
        log: (r) => [
          api(
            'GET /api/v1/invoice',
            {
              invoices: [
                { correlationID: r.correlationID, status: 'PROCESSING' },
              ],
            },
            { note: 'sem webhook: você descobre consultando' },
          ),
        ],
      },
      {
        id: 'confirm',
        label: 'Nota autorizada',
        primary: true,
        from: ['PROCESSING'],
        to: 'CONFIRMED',
        transition: 'confirm',
        log: (r) => [
          api('GET /api/v1/invoice', {
            invoices: [
              {
                correlationID: r.correlationID,
                status: 'CONFIRMED',
                value: r.value,
              },
            ],
          }),
        ],
      },
      {
        id: 'pdf',
        label: 'Baixar PDF',
        from: ['PENDING', 'PROCESSING', 'CONFIRMED'],
        to: '',
        transition: '',
        reject: (r) =>
          r.status === 'CONFIRMED'
            ? null
            : [
                api(
                  `GET /api/v1/invoice/${r.correlationID}/pdf`,
                  { error: 'Error while getting invoice documents' },
                  {
                    code: 400,
                    note: 'os arquivos só existem com a nota CONFIRMED',
                  },
                ),
              ],
        log: (r) => [
          api(`GET /api/v1/invoice/${r.correlationID}/pdf`, {
            file: `${r.correlationID}.pdf (application/pdf)`,
          }),
        ],
      },
      {
        id: 'cancel',
        label: 'Cancelar nota',
        from: ['PENDING', 'PROCESSING', 'CONFIRMED'],
        to: 'cancelada',
        transition: 'cancel',
        reject: (r) =>
          r.status === 'CONFIRMED'
            ? null
            : [
                api(
                  `POST /api/v1/invoice/${r.correlationID}/cancel`,
                  { error: 'Cannot cancel a not confirmed invoice' },
                  { code: 400 },
                ),
              ],
        log: (r) => [
          api(`POST /api/v1/invoice/${r.correlationID}/cancel`, {
            success: true,
          }),
        ],
      },
    ],
    summary: (r) => [
      ['valor', brl(r.value)],
      ['correlationID', r.correlationID],
      ['billingDate', r.billingDate],
      ['cliente', r.customer],
    ],
    explain: {
      NONE: 'A integração fiscal precisa estar configurada antes. Sem ela, a API responde "You need to configure the invoice integration".',
      PENDING: 'Tente baixar o PDF ou cancelar agora para ver os erros.',
      PROCESSING: 'Ainda no emissor.',
      CONFIRMED:
        'Autorizada: PDF e XML disponíveis, e o cancelamento liberado.',
      cancelada: 'Documentos marcados como cancelados.',
    },
  },
};
