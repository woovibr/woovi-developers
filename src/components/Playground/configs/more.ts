import type { PlaygroundConfig, Resource } from '../types';
import {
  api,
  brl,
  chargeBrCode,
  endToEndId,
  hex,
  hook,
  json,
  now,
  parseEmv,
} from '../utils';
import { events } from '../../WebhookEventExplorer/events';

import SplitCalculator from '../widgets/SplitCalculator';
import WebhookVerifier from '../widgets/WebhookVerifier';
import EmvInspector from '../widgets/EmvInspector';
import EmbedPreview from '../widgets/EmbedPreview';

import { accountStates, accountTransitions } from './baas';
import { A, company, handlerTabs } from './shared';

/* ---------------- split ---------------- */

export const split: PlaygroundConfig = {
  id: 'split',
  title: 'Split',
  lede: 'Divida uma cobrança entre contas com o array splits do POST /api/v1/charge. Cada parte tem pixKey, value em centavos e splitType. O que sobra fica com quem criou a cobrança.',
  docs: [
    { label: 'Introdução ao split', href: '/docs/splits/split-introduction' },
    {
      label: 'Split com percentual',
      href: '/docs/splits/how-to-calculate-split-with-percentage',
    },
    {
      label: 'Cobrança com split',
      href: '/docs/charge/how-to-create-charge-with-split-using-api',
    },
    {
      label: 'Split por transferência interna',
      href: '/docs/splits/split-internal-transfer',
    },
  ],
  widget: SplitCalculator,
  widgetTitle: 'Calcule as partes',
  widgetLede:
    'A API não aceita percentuais: você converte para centavos antes. Ajuste as partes e copie o corpo da requisição.',
  actors: [
    A.cli,
    A.you,
    A.woovi,
    { id: 'sub', title: 'Subconta', sub: 'saldo virtual' },
  ],
  scenarios: [
    {
      id: 'subaccount',
      label: 'Para subconta',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/charge · splits[]',
          kind: 'req',
          title: 'Cobrança com as partes',
          code: json({
            value: 10000,
            correlationID: 'pedido-1042',
            splits: [
              {
                pixKey: 'loja-parceira@exemplo.com',
                value: 2000,
                splitType: 'SPLIT_SUB_ACCOUNT',
              },
            ],
          }),
          callout: {
            tone: 'warn',
            text: 'O recurso de split precisa ser habilitado pelo suporte. A soma das partes não pode passar do valor da cobrança.',
          },
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · charge com splits',
          kind: 'res',
          title: 'A cobrança guarda as partes',
        },
        {
          from: 'cli',
          to: 'woovi',
          label: 'Paga o Pix',
          title: 'O cliente paga o valor cheio',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook OPENPIX:CHARGE_COMPLETED',
          kind: 'evt',
          title: 'Paga',
          text: 'Não há eventos de webhook específicos de split. A confirmação é a da cobrança.',
        },
        {
          from: 'woovi',
          to: 'sub',
          label: 'credita R$ 20,00 (virtual)',
          title: 'Saldo virtual',
          text: 'Nada é debitado da conta principal agora.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/subaccount/{id}/withdraw',
          kind: 'req',
          title: 'A subconta saca',
          text: 'Só no saque o saldo inteiro da subconta sai da conta principal.',
        },
      ],
    },
    {
      id: 'partner',
      label: 'Para parceiro',
      steps: [
        {
          note: 'woovi',
          label: 'taxa do parceiro configurada na plataforma',
          title: 'Markup fixo ou percentual',
          text: 'Em Minhas Empresas → Ajustes. Exemplo dos docs: cobrança de R$ 100, taxa de R$ 5 e tarifa Woovi de R$ 0,50: o parceiro recebe R$ 4,50.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/charge',
          kind: 'req',
          title: 'A empresa afiliada cobra',
        },
        { from: 'cli', to: 'woovi', label: 'Paga', title: 'O cliente paga' },
        {
          from: 'woovi',
          to: 'sub',
          label: 'repassa a taxa ao parceiro',
          title: 'O parceiro recebe a parte dele',
        },
      ],
    },
  ],
  statesTitle: 'A cobrança com split segue a mesma máquina de estados',
  states: [
    { id: 'ACTIVE', sub: 'aguardando Pix', x: 150, y: 96 },
    {
      id: 'COMPLETED',
      sub: 'paga · partes creditadas',
      x: 470,
      y: 0,
      terminal: true,
    },
    {
      id: 'EXPIRED',
      sub: 'final',
      x: 470,
      y: 196,
      terminal: true,
      tone: 'muted',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'ACTIVE', label: 'POST /charge' },
    { id: 'pay', from: 'ACTIVE', to: 'COMPLETED', label: 'CHARGE_COMPLETED' },
    {
      id: 'expire',
      from: 'ACTIVE',
      to: 'EXPIRED',
      label: 'CHARGE_EXPIRED',
      sourceHandle: 'b',
    },
  ],
  lab: {
    title: 'Cobrança com split',
    method: 'POST',
    path: '/api/v1/charge',
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'value',
        label: 'Valor total',
        api: 'value',
        type: 'cents',
        default: 10000,
      },
      {
        id: 'splitType',
        label: 'Tipo',
        api: 'splitType',
        type: 'select',
        default: 'SPLIT_SUB_ACCOUNT',
        options: [
          { value: 'SPLIT_SUB_ACCOUNT', label: 'SPLIT_SUB_ACCOUNT' },
          {
            value: 'SPLIT_INTERNAL_TRANSFER',
            label: 'SPLIT_INTERNAL_TRANSFER',
          },
          { value: 'SPLIT_PARTNER', label: 'SPLIT_PARTNER' },
        ],
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'id',
        default: 'uuid',
      },
      {
        id: 'key1',
        label: 'Parte 1 · chave',
        api: 'splits[0].pixKey',
        type: 'text',
        default: 'loja-parceira@exemplo.com',
      },
      {
        id: 'v1',
        label: 'Parte 1 · valor',
        api: 'splits[0].value',
        type: 'cents',
        default: 2000,
      },
      {
        id: 'key2',
        label: 'Parte 2 · chave',
        api: 'splits[1].pixKey',
        type: 'text',
        default: 'entregador@exemplo.com',
      },
      {
        id: 'v2',
        label: 'Parte 2 · valor',
        api: 'splits[1].value',
        type: 'cents',
        default: 1500,
        hint: 'some mais que o total para ver a recusa',
      },
    ],
    body: (v) => ({
      correlationID: v.correlationID,
      value: v.value,
      splits: [
        { pixKey: v.key1, value: v.v1, splitType: v.splitType },
        { pixKey: v.key2, value: v.v2, splitType: v.splitType },
      ],
    }),
    createTransition: 'create',
    create: (v) => {
      if (v.v1 + v.v2 > v.value)
        return {
          log: [
            api(
              'POST /api/v1/charge',
              { error: 'A soma dos splits excede o valor da cobrança' },
              {
                code: 400,
                note: 'regra documentada; o texto exato do erro é ilustrativo',
              },
            ),
          ],
        };
      const identifier = hex(32);
      const r: Resource = {
        status: 'ACTIVE',
        value: v.value,
        correlationID: v.correlationID,
        splits: [
          { pixKey: v.key1, value: v.v1, splitType: v.splitType },
          { pixKey: v.key2, value: v.v2, splitType: v.splitType },
        ],
        brCode: chargeBrCode(v.value, identifier),
      };
      return {
        resource: r,
        log: [
          api('POST /api/v1/charge', {
            charge: {
              status: 'ACTIVE',
              value: r.value,
              correlationID: r.correlationID,
              splits: r.splits,
            },
            brCode: r.brCode,
          }),
        ],
      };
    },
    actions: [
      {
        id: 'pay',
        label: 'Simular pagamento',
        primary: true,
        from: ['ACTIVE'],
        to: 'COMPLETED',
        transition: 'pay',
        log: (r) => [
          hook(
            'OPENPIX:CHARGE_COMPLETED',
            {
              charge: {
                status: 'COMPLETED',
                value: r.value,
                correlationID: r.correlationID,
                splits: r.splits,
              },
              pix: { value: r.value, endToEndId: endToEndId() },
              company,
            },
            {
              note: `${brl(r.value - r.splits[0].value - r.splits[1].value)} ficam com você; sem webhook específico de split`,
            },
          ),
        ],
      },
      {
        id: 'expire',
        label: 'Simular expiração',
        from: ['ACTIVE'],
        to: 'EXPIRED',
        transition: 'expire',
        log: (r) => [
          hook(
            'OPENPIX:CHARGE_EXPIRED',
            { charge: { status: 'EXPIRED', correlationID: r.correlationID } },
            { note: 'nenhuma parte é creditada' },
          ),
        ],
      },
    ],
    summary: (r) => [
      ['total', brl(r.value)],
      ...r.splits.map(
        (s: { value: number; pixKey: string }, i: number) =>
          [`parte ${i + 1}`, `${brl(s.value)} → ${s.pixKey}`] as [
            string,
            string,
          ],
      ),
      ['fica com você', brl(r.value - r.splits[0].value - r.splits[1].value)],
    ],
    qr: (r) => (r.status === 'ACTIVE' ? r.brCode : undefined),
    explain: {
      NONE: 'Envie a requisição. Some as partes acima do total para ver a recusa.',
      ACTIVE: 'O cliente paga o valor cheio; a divisão acontece na Woovi.',
      COMPLETED: 'Partes creditadas conforme o splitType de cada uma.',
    },
  },
};

/* ---------------- webhook ---------------- */

const EVENT_OPTIONS = events
  .filter((e) => e.payload && e.event)
  .map((e) => ({ value: e.event, label: `${e.event} · ${e.category}` }));

export const webhook: PlaygroundConfig = {
  id: 'webhook',
  title: 'Webhook',
  lede: 'Cadastre um webhook por evento, receba o POST de teste, valide a assinatura e entenda as retentativas. A validação de assinatura desta página é real.',
  docs: [
    { label: 'Webhook via API', href: '/docs/webhook/webhook-api' },
    { label: 'Tipos de evento', href: '/docs/webhook/webhook-events-type' },
    {
      label: 'Validar assinatura',
      href: '/docs/webhook/seguranca/webhook-signature-validation',
    },
    { label: 'Retentativas', href: '/docs/webhook/webhook-retry' },
    {
      label: 'Explorador de eventos',
      href: '/docs/webhook/webhook-events-explorer',
    },
  ],
  widget: WebhookVerifier,
  widgetTitle: 'Assinatura e retentativas',
  actors: [
    A.you,
    A.woovi,
    { id: 'hook', title: 'Seu endpoint', sub: 'POST /webhooks/woovi' },
  ],
  scenarios: [
    {
      id: 'register',
      label: 'Cadastro',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/webhook',
          kind: 'req',
          title: 'Cadastre o webhook',
          text: 'Um evento por webhook. A mesma URL com o mesmo evento não pode repetir, e o limite é de 50 webhooks por empresa.',
          code: json({
            webhook: {
              name: 'pagamentos',
              event: 'OPENPIX:CHARGE_COMPLETED',
              url: 'https://seusite.com.br/webhooks/woovi',
              authorization: 'meu-token-de-verificacao',
              isActive: true,
            },
          }),
        },
        {
          from: 'woovi',
          to: 'hook',
          label: 'POST de teste',
          kind: 'evt',
          title: 'A Woovi testa a sua URL',
          text: 'Responda 200, ou o cadastro falha. ?validate=false pula esse teste.',
          code: json({
            data_criacao: '2026-10-01T20:32:14.429Z',
            event: 'OPENPIX:CHARGE_COMPLETED',
          }),
        },
        {
          from: 'hook',
          to: 'woovi',
          label: '200',
          kind: 'res',
          title: 'URL validada',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · webhook + hmacSecretKey',
          kind: 'res',
          title: 'Webhook criado',
        },
      ],
    },
    {
      id: 'deliver',
      label: 'Entrega',
      steps: [
        {
          note: 'woovi',
          label: 'evento acontece',
          title: 'Algo aconteceu na conta',
        },
        {
          from: 'woovi',
          to: 'hook',
          label: 'POST + x-webhook-signature',
          kind: 'evt',
          title: 'Entrega assinada',
          text: 'x-webhook-signature é RSA-SHA256 em base64 sobre o corpo bruto. Seu authorization volta nos headers Authorization e x-openpix-authorization.',
        },
        {
          from: 'hook',
          to: 'hook',
          label: 'valida assinatura sobre o corpo bruto',
          title: 'Valide antes de confiar',
          text: 'Use a chave de GET /api/v1/webhook/public-keys (cache de 1 hora) e aceite qualquer chave da lista, não só a is_current.',
        },
        {
          from: 'hook',
          to: 'woovi',
          label: '200 em até 100 s',
          kind: 'res',
          title: 'Responda rápido',
          text: 'Erro ou timeout disparam até 8 retentativas: 10 s, 20 s, 40 s … 1280 s.',
        },
      ],
    },
  ],
  lab: {
    title: 'Webhook',
    method: 'POST',
    path: '/api/v1/webhook',
    fields: [
      {
        id: 'event',
        label: 'Evento',
        api: 'webhook.event',
        type: 'select',
        default: 'OPENPIX:CHARGE_COMPLETED',
        options: EVENT_OPTIONS,
        wide: true,
      },
      {
        id: 'url',
        label: 'URL',
        api: 'webhook.url',
        type: 'text',
        default: 'https://seusite.com.br/webhooks/woovi',
        hint: 'teste uma URL http',
        wide: true,
      },
      {
        id: 'name',
        label: 'Nome',
        api: 'webhook.name',
        type: 'text',
        default: 'pagamentos',
      },
      {
        id: 'authorization',
        label: 'Token seu',
        api: 'webhook.authorization',
        type: 'text',
        default: 'meu-token-de-verificacao',
      },
    ],
    body: (v) => ({
      webhook: {
        name: v.name,
        event: v.event,
        url: v.url,
        authorization: v.authorization,
        isActive: true,
      },
    }),
    createTransition: '',
    create: (v) => {
      if (!String(v.url).startsWith('https://'))
        return {
          log: [
            api(
              'POST /api/v1/webhook',
              { error: 'URL inválida' },
              {
                code: 400,
                note: 'use uma URL https pública; o texto exato do erro é ilustrativo',
              },
            ),
          ],
        };
      const r: Resource = {
        status: 'ativo',
        id: 'V2ViaG9vazo' + hex(16),
        event: v.event,
        url: v.url,
        deliveries: 0,
      };
      return {
        resource: r,
        log: [
          hook(v.event, { data_criacao: now() }, {
            note: 'POST de teste do cadastro: responda 200',
          }),
          api(
            'POST /api/v1/webhook',
            {
              webhook: {
                id: r.id,
                name: v.name,
                event: v.event,
                url: v.url,
                authorization: v.authorization,
                isActive: true,
                createdAt: now(),
              },
              hmacSecretKey: 'openpix_' + hex(32),
            },
            { delay: 500 },
          ),
        ],
      };
    },
    actions: [
      {
        id: 'fire',
        label: 'Disparar o evento',
        primary: true,
        from: ['ativo'],
        to: '',
        transition: '',
        apply: (r) => ({ ...r, deliveries: r.deliveries + 1 }),
        log: (r) => {
          const e = events.find((x) => x.event === r.event);
          const { event: _e, ...payload } = (e?.payload ?? {}) as Record<
            string,
            unknown
          >;
          return [
            hook(r.event, payload, {
              note: 'payload de exemplo do explorador de eventos',
            }),
          ];
        },
      },
      {
        id: 'list',
        label: 'Listar webhooks',
        from: ['ativo', 'excluído'],
        to: '',
        transition: '',
        log: (r) => [
          api(`GET /api/v1/webhook?url=${encodeURIComponent(r.url)}`, {
            webhooks:
              r.status === 'ativo'
                ? [{ id: r.id, event: r.event, url: r.url, isActive: true }]
                : [],
            pageInfo: { skip: 0, limit: 20 },
          }),
        ],
      },
      {
        id: 'delete',
        label: 'Excluir',
        from: ['ativo'],
        to: 'excluído',
        transition: '',
        log: (r) => [api(`DELETE /api/v1/webhook/${r.id}`, { status: 'OK' })],
      },
    ],
    summary: (r) => [
      ['id', r.id],
      ['evento', r.event],
      ['url', r.url],
      ['entregas', String(r.deliveries)],
    ],
    explain: {
      NONE: 'Escolha um evento e envie. Cada evento precisa de um webhook próprio.',
      ativo: 'Dispare o evento para ver o payload que chega no seu endpoint.',
      excluído: 'Nada mais é entregue para esta URL e este evento.',
    },
    handler: handlerTabs(
      `switch (data.event) {
  case 'OPENPIX:CHARGE_COMPLETED':
    await onChargePaid(data.charge);
    break;
  default:
    // eventos que você não trata também recebem 200, para não gerar retentativas
    break;
}`,
      `switch ($data['event'] ?? '') {
  case 'OPENPIX:CHARGE_COMPLETED':
    onChargePaid($data['charge']);
    break;
}`,
    ),
  },
};

/* ---------------- QR Code Pix (EMV) ---------------- */

export const qrcodePix: PlaygroundConfig = {
  id: 'qrcode-pix',
  title: 'QR Code Pix',
  lede: 'Todo Pix copia e cola é um BR Code: uma sequência de campos EMV (ID, tamanho, valor) fechada por um CRC16. Decodifique, monte um QR e veja o que a API de decode devolve.',
  docs: [
    { label: 'Decodificar QR Code Pix', href: '/docs/payment/decode-emv' },
    { label: 'Consultar chave Pix', href: '/docs/payment/check-pix-key' },
  ],
  widget: EmvInspector,
  widgetTitle: 'Decodificador e gerador de BR Code',
  actors: [
    A.you,
    A.woovi,
    { id: 'psp', title: 'PSP emissor', sub: 'URL de location' },
  ],
  scenarios: [
    {
      id: 'static',
      label: 'QR estático',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/decode/emv',
          kind: 'req',
          title: 'Mande o copia e cola',
          code: json({
            emv: '00020126780014br.gov.bcb.pix0136f4c6089a-…6304 4486',
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · emv · cobLocation null',
          kind: 'res',
          title: 'Tudo está no próprio código',
          text: 'Chave, valor e nome saem direto do EMV. cobLocation e recLocation vêm null.',
        },
      ],
    },
    {
      id: 'dynamic',
      label: 'QR dinâmico (COB)',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/decode/emv',
          kind: 'req',
          title: 'Mande o copia e cola',
        },
        {
          from: 'woovi',
          to: 'psp',
          label: 'GET url de location',
          title: 'A Woovi busca a cobrança',
          text: 'O campo 26.25 tem a URL. O PSP devolve um JWS com os dados da cobrança.',
        },
        {
          from: 'psp',
          to: 'woovi',
          label: 'payload da cobrança',
          title: 'Valor, expiração, txid',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · emv + cobLocation',
          kind: 'res',
          title: 'Cobrança resolvida',
          code: json({
            emv: {
              pointOfInitiationMethod: '12',
              merchantAccountInformationPix: {
                gui: 'br.gov.bcb.pix',
                url: 'qr-h.woovi.digital/qr/v2/cob/fb274322-…',
              },
              transactionAmount: '10.00',
            },
            cobLocation: {
              isValid: true,
              locationErrors: [],
              payload: {
                calendar: { expiration: 86400 },
                status: 'ATIVA',
                value: { original: '120.58' },
              },
            },
            recLocation: null,
          }),
          callout: {
            tone: 'warn',
            text: 'A Woovi não valida a assinatura ICP-Brasil nem o domínio do JWS. isValid false quer dizer que o PSP não respondeu.',
          },
        },
      ],
    },
  ],
  lab: {
    title: 'Decode',
    method: 'POST',
    path: '/api/v1/decode/emv',
    fields: [
      {
        id: 'emv',
        label: 'Copia e cola',
        api: 'emv',
        type: 'text',
        default:
          '00020126580014br.gov.bcb.pix0136d94d2ebc-0b3e-4b48-8b96-2eddac9e4f0e520400005303986540519.905802BR5912LOJA EXEMPLO6009SAO PAULO62140510pedido10426304',
        wide: true,
        hint: 'o exemplo está sem CRC: envie para ver o erro, depois cole um código do gerador acima',
      },
    ],
    body: (v) => ({ emv: v.emv }),
    createTransition: '',
    create: (v) => {
      const nodes = parseEmv(String(v.emv).trim());
      const get = (id: string) => nodes.find((n) => n.id === id);
      const crc = get('63');
      if (!crc || crc.length !== 4 || nodes.some((n) => n.error))
        return {
          log: [
            api(
              'POST /api/v1/decode/emv',
              { error: 'Invalid EMV payload' },
              { code: 400 },
            ),
          ],
        };
      const acc = get('26')?.children ?? [];
      const sub = (id: string) => acc.find((n) => n.id === id)?.value;
      const emv = {
        payloadFormatIndicator: get('00')?.value,
        ...(get('01') ? { pointOfInitiationMethod: get('01')!.value } : {}),
        merchantAccountInformationPix: {
          gui: sub('00'),
          ...(sub('01') ? { pixKey: sub('01') } : {}),
          ...(sub('25') ? { url: sub('25') } : {}),
          ...(sub('02') ? { additionalInformation: sub('02') } : {}),
        },
        merchantCategoryCode: get('52')?.value,
        transactionCurrency: get('53')?.value,
        ...(get('54') ? { transactionAmount: get('54')!.value } : {}),
        countryCode: get('58')?.value,
        merchantName: get('59')?.value,
        merchantCity: get('60')?.value,
        additionalDataFieldTemplate: {
          referenceLabel: get('62')?.children?.find((n) => n.id === '05')
            ?.value,
        },
        crc: crc.value,
      };
      const r: Resource = { status: 'decodificado', emv };
      return {
        resource: r,
        log: [
          api('POST /api/v1/decode/emv', {
            emv,
            cobLocation: sub('25')
              ? {
                  isValid: false,
                  locationErrors: [
                    'simulação: a location não é resolvida nesta página',
                  ],
                  payload: null,
                }
              : null,
            recLocation: null,
          }),
        ],
      };
    },
    actions: [],
    summary: (r) => [
      [
        'chave',
        r.emv.merchantAccountInformationPix.pixKey ??
          r.emv.merchantAccountInformationPix.url ??
          '—',
      ],
      [
        'valor',
        r.emv.transactionAmount ? `R$ ${r.emv.transactionAmount}` : 'livre',
      ],
      ['recebedor', `${r.emv.merchantName} · ${r.emv.merchantCity}`],
      [
        'referenceLabel',
        r.emv.additionalDataFieldTemplate.referenceLabel ?? '—',
      ],
    ],
    explain: {
      NONE: 'A decodificação da API também consulta a location de QR dinâmico; aqui ela é só simulada.',
    },
  },
};

/* ---------------- Embed BaaS ---------------- */

export const embedBaas: PlaygroundConfig = {
  id: 'embed-baas',
  title: 'Embed BaaS',
  lede: 'Coloque o cadastro de conta (KYC) da Woovi dentro do seu produto: por redirect, nova aba ou iframe, com ou sem a marca Woovi. O link vem do POST /api/v1/kyc/onboarding.',
  docs: [
    {
      label: 'Onboarding embutido',
      href: '/docs/baas/kyc/kyc-api-onboarding-embed',
    },
    {
      label: 'White-label',
      href: '/docs/baas/kyc/kyc-api-onboarding-white-label',
    },
    {
      label: 'Ciclo de vida e webhooks',
      href: '/docs/baas/kyc/kyc-webhooks-lifecycle',
    },
    { label: 'Playground de BaaS', href: '/docs/playground/playground-baas' },
  ],
  widget: EmbedPreview,
  widgetTitle: 'Escolha como embutir',
  actors: [
    { id: 'front', title: 'Seu front', sub: 'página HTTPS' },
    { id: 'you', title: 'Seu backend', sub: 'AppID Master' },
    { id: 'woovi', title: 'Woovi', sub: 'api.woovi.com' },
    { id: 'kyc', title: 'kyc.woovi.com', sub: 'cadastro' },
  ],
  scenarios: [
    {
      id: 'iframe',
      label: 'Iframe',
      steps: [
        {
          from: 'front',
          to: 'you',
          label: 'Quero abrir minha conta',
          title: 'O cliente pede a conta',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/kyc/onboarding',
          kind: 'req',
          title: 'Seu backend cria o cadastro',
          text: 'Idempotente por correlationID: reuse o mesmo link se o cliente voltar depois.',
          code: json({
            taxID: '12.345.678/0001-90',
            correlationID: 'merchant-77',
            redirectUrl: 'https://seuapp.com.br/conta/pronta',
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '201 · linkOnboarding',
          kind: 'res',
          title: 'Link do cadastro',
        },
        {
          from: 'you',
          to: 'front',
          label: 'link + ?embed=true',
          title: 'O front recebe só o link',
          text: 'O AppID fica no backend.',
        },
        {
          from: 'front',
          to: 'kyc',
          label: '<iframe allow="camera">',
          title: 'O cadastro abre dentro da sua página',
          text: 'Largura 100% até cerca de 640px e altura de 900px ou mais.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhooks ACCOUNT_REGISTER_*',
          kind: 'evt',
          title: 'Acompanhe pelo backend',
          text: 'A página não envia postMessage. Use os webhooks (cadastrados com a Master) ou consulte GET /api/v1/account-register/:id.',
        },
        {
          from: 'kyc',
          to: 'front',
          label: 'redirectUrl (5 s após estado final)',
          title: 'O cliente volta para você',
          text: 'redirectUrl é definido na criação e não muda depois.',
        },
      ],
    },
  ],
  statesTitle: 'Os estados que a página de cadastro mostra',
  statesLede:
    'São os mesmos do accountRegister. NOT_FOUND aparece para um link inválido.',
  states: accountStates,
  transitions: accountTransitions,
};
