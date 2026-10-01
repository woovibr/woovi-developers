import type { PlaygroundConfig, Resource } from '../types';
import { api, brl, hex, hook, json, addSeconds } from '../utils';

import { A, handlerTabs } from './shared';

const NETWORKS: Record<string, string[]> = {
  USDT: ['POLYGON', 'ETHEREUM', 'CELO', 'TRON'],
  USDC: ['POLYGON', 'ETHEREUM', 'BASE', 'CELO'],
};
const RATE: Record<string, number> = { USDT: 5.42, USDC: 5.41 };

export const stablecoin: PlaygroundConfig = {
  id: 'stablecoin',
  title: 'Stablecoin',
  lede: 'Converta saldo em reais para USDT ou USDC e entregue on-chain. O depósito nasce PENDING e só debita o saldo quando você aprova. A cotação e as taxas desta página são simuladas.',
  docs: [
    { label: 'O que é', href: '/docs/stablecoin/stablecoin-what-is-it' },
    { label: 'Endpoints', href: '/docs/stablecoin/stablecoin-endpoints' },
    { label: 'Fluxo de depósito', href: '/docs/stablecoin/stablecoin-flow' },
    {
      label: 'Fluxo de saque',
      href: '/docs/stablecoin/stablecoin-payout-flow',
    },
    { label: 'Webhooks', href: '/docs/stablecoin/stablecoin-webhooks' },
  ],
  actors: [
    A.you,
    A.woovi,
    { id: 'prov', title: 'Provedor', sub: 'conversão' },
    { id: 'chain', title: 'Blockchain', sub: 'carteira destino' },
  ],
  scenarios: [
    {
      id: 'deposit',
      label: 'Depósito',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /quote?value=10000&currency=USDT',
          kind: 'req',
          title: 'Consulte a cotação',
          text: 'A cotação fica em cache por 60 segundos.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · rate, outputAmount',
          kind: 'res',
          title: 'Quanto chega',
          text: 'outputAmount já vem líquido de taxas, em unidades da moeda (não em centavos).',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /deposit',
          kind: 'req',
          title: 'Crie o depósito',
          code: json({
            value: 10000,
            currency: 'USDT',
            network: 'POLYGON',
            correlationId: 'my-unique-id',
          }),
          callout: {
            tone: 'warn',
            text: 'Aqui o campo é correlationId, com d minúsculo. value está em centavos de real.',
          },
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · PENDING · quote',
          kind: 'res',
          title: 'Depósito pendente',
          code: json({
            status: 'PENDING',
            depositId: '6650abc1234def567890aaaa',
            correlationId: 'my-unique-id',
            quote: {
              inputAmount: 10000,
              inputCurrency: 'BRL',
              outputAmount: 18.45,
              outputCurrency: 'USDT',
              rate: 5.42,
              fee: 50,
            },
          }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /deposit/approve',
          kind: 'req',
          title: 'Aprove',
          text: 'É aqui que o saldo em reais é debitado.',
          code: json({ correlationId: 'my-unique-id' }),
        },
        {
          from: 'woovi',
          to: 'prov',
          label: 'converte BRL → USDT',
          title: 'Conversão',
        },
        {
          from: 'prov',
          to: 'chain',
          label: 'transferência on-chain',
          title: 'Envio para a carteira',
          callout: {
            tone: 'bad',
            text: 'Transferências on-chain são irreversíveis. Confira rede e endereço.',
          },
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook STABLECOIN_DEPOSIT_COMPLETED',
          kind: 'evt',
          title: 'Entregue',
          code: json({
            event: 'STABLECOIN_DEPOSIT_COMPLETED',
            stableDeposit: {
              status: 'COMPLETED',
              inputAmount: 10000,
              outputAmount: 18.45,
              txHash: '0x9f2c…',
              correlationID: 'my-unique-id',
            },
          }),
        },
      ],
    },
    {
      id: 'payout',
      label: 'Saque para Pix',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /payout',
          kind: 'req',
          title: 'Peça o saque',
          text: 'value é o valor do Pix em centavos de real. O saque usa só o saldo INTERNAL.',
          code: json({
            value: 10000,
            currency: 'USDT',
            pixKey: 'thiago@entria.com.br',
            correlationId: 'payout-001',
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · PENDING · pixKeyOwner',
          kind: 'res',
          title: 'Confira o destinatário',
          code: json({
            status: 'PENDING',
            payoutId: '6a721b1e3c785acfaebfa01c',
            pixKeyOwner: {
              name: 'Marshall Bilderback',
              taxId: '***.751.185-**',
              bankName: 'SICOOB',
            },
            quote: {
              inputAmount: 19.68,
              inputCurrency: 'USDT',
              outputAmount: 100,
              outputCurrency: 'BRL',
              rate: 5.12,
            },
          }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /payout/approve',
          kind: 'req',
          title: 'Aprove',
          text: 'Abre o ticket no provedor, debita o saldo e envia o Pix.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook STABLECOIN_PAYOUT_COMPLETED',
          kind: 'evt',
          title: 'Pix enviado',
          text: 'O payload traz o endToEndId do Pix.',
        },
      ],
    },
    {
      id: 'failed',
      label: 'Falhou',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /deposit/approve',
          kind: 'req',
          title: 'Aprove',
        },
        {
          from: 'prov',
          to: 'woovi',
          label: 'falha na conversão',
          bad: true,
          title: 'O provedor falha',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook STABLECOIN_DEPOSIT_FAILED',
          kind: 'evt',
          bad: true,
          title: 'Depósito falhou',
          code: json({
            event: 'STABLECOIN_DEPOSIT_FAILED',
            stableDeposit: { status: 'FAILED', correlationID: 'my-unique-id' },
            reason: '…',
            errorCode: 'DEPOSIT-FAILED',
          }),
        },
      ],
    },
  ],
  statesTitle: 'O depósito só debita quando você aprova',
  statesLede: 'Não há rota para consultar depósitos: acompanhe pelos webhooks.',
  states: [
    { id: 'PENDING', sub: 'cotado · sem débito', x: 150, y: 90 },
    { id: 'PROCESSING', sub: 'BRL debitado', x: 420, y: 0 },
    {
      id: 'COMPLETED',
      sub: 'on-chain · txHash · final',
      x: 690,
      y: 0,
      terminal: true,
    },
    { id: 'FAILED', sub: 'final', x: 560, y: 190, terminal: true, tone: 'bad' },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'PENDING', label: 'POST /deposit' },
    {
      id: 'approve',
      from: 'PENDING',
      to: 'PROCESSING',
      label: 'POST /deposit/approve',
    },
    {
      id: 'complete',
      from: 'PROCESSING',
      to: 'COMPLETED',
      label: 'DEPOSIT_COMPLETED',
    },
    {
      id: 'fail',
      from: 'PROCESSING',
      to: 'FAILED',
      label: 'DEPOSIT_FAILED',
      sourceHandle: 'b',
      targetHandle: 't',
    },
    {
      id: 'fail-early',
      from: 'PENDING',
      to: 'FAILED',
      label: 'DEPOSIT_FAILED',
      sourceHandle: 'b',
    },
  ],
  lab: {
    title: 'Depósito',
    method: 'POST',
    path: '/api/v1/stablecoin/deposit',
    idempotencyField: 'correlationId',
    fields: [
      {
        id: 'value',
        label: 'Valor em reais',
        api: 'value',
        type: 'cents',
        default: 10000,
      },
      {
        id: 'currency',
        label: 'Moeda',
        api: 'currency',
        type: 'select',
        default: 'USDT',
        options: [
          { value: 'USDT', label: 'USDT' },
          { value: 'USDC', label: 'USDC' },
        ],
      },
      {
        id: 'network',
        label: 'Rede',
        api: 'network',
        type: 'select',
        default: 'POLYGON',
        hint: 'TRON só com USDT; BASE só com USDC',
        options: ['POLYGON', 'ETHEREUM', 'BASE', 'CELO', 'TRON'].map((n) => ({
          value: n,
          label: n + (n === 'POLYGON' ? ' (padrão)' : ''),
        })),
      },
      {
        id: 'correlationId',
        label: 'Identificador',
        api: 'correlationId',
        type: 'id',
        default: 'uuid',
      },
    ],
    body: (v) => ({
      value: v.value,
      currency: v.currency,
      network: v.network,
      correlationId: v.correlationId,
    }),
    createTransition: 'create',
    create: (v) => {
      if (!NETWORKS[v.currency].includes(v.network))
        return {
          log: [
            api(
              'POST /api/v1/stablecoin/deposit',
              { error: `${v.currency} não é suportado na rede ${v.network}` },
              {
                code: 400,
                note: `${v.currency} roda em ${NETWORKS[v.currency].join(', ')}; o texto do erro é ilustrativo`,
              },
            ),
          ],
        };
      const fee = Math.round(v.value * 0.02);
      const outputAmount =
        Math.round(((v.value - fee) / 100 / RATE[v.currency]) * 100) / 100;
      const r: Resource = {
        status: 'PENDING',
        depositId: hex(24),
        correlationId: v.correlationId,
        expiration: addSeconds(3600),
        network: v.network,
        quote: {
          inputAmount: v.value,
          inputCurrency: 'BRL',
          outputAmount,
          outputCurrency: v.currency,
          rate: RATE[v.currency],
          fee,
        },
      };
      return {
        resource: r,
        log: [
          api('POST /api/v1/stablecoin/deposit', r, {
            note: 'cotação simulada com taxa de 2%; nada foi debitado ainda',
          }),
        ],
      };
    },
    actions: [
      {
        id: 'approve',
        label: 'Aprovar depósito',
        primary: true,
        from: ['PENDING'],
        to: 'PROCESSING',
        transition: 'approve',
        log: (r) => [
          api(
            'POST /api/v1/stablecoin/deposit/approve',
            {
              status: 'PROCESSING',
              depositId: r.depositId,
              correlationId: r.correlationId,
            },
            { note: `${brl(r.quote.inputAmount)} debitados do saldo` },
          ),
        ],
      },
      {
        id: 'complete',
        label: 'Confirmar on-chain',
        from: ['PROCESSING'],
        to: 'COMPLETED',
        transition: 'complete',
        apply: (r) => ({ ...r, txHash: '0x' + hex(64) }),
        log: (r) => [
          hook('STABLECOIN_DEPOSIT_COMPLETED', {
            stableDeposit: {
              id: r.depositId,
              status: 'COMPLETED',
              inputAmount: r.quote.inputAmount,
              outputAmount: r.quote.outputAmount,
              txHash: r.txHash,
              correlationID: r.correlationId,
            },
          }),
        ],
      },
      {
        id: 'fail',
        label: 'Simular falha',
        from: ['PENDING', 'PROCESSING'],
        to: 'FAILED',
        transition: 'fail',
        log: (r) => [
          hook('STABLECOIN_DEPOSIT_FAILED', {
            stableDeposit: {
              id: r.depositId,
              status: 'FAILED',
              correlationID: r.correlationId,
            },
            reason: 'Falha no provedor de conversão',
            errorCode: 'DEPOSIT-FAILED',
          }),
        ],
      },
    ],
    summary: (r) => [
      ['você paga', brl(r.quote.inputAmount)],
      [
        'chega',
        `${r.quote.outputAmount} ${r.quote.outputCurrency} · ${r.network}`,
      ],
      ['cotação', `1 ${r.quote.outputCurrency} = R$ ${r.quote.rate}`],
      ...(r.txHash ? ([['txHash', r.txHash]] as [string, string][]) : []),
    ],
    explain: {
      NONE: 'Envie a requisição. Teste USDC na rede TRON para ver a validação.',
      PENDING: 'Nada foi debitado. Aprove para seguir.',
      PROCESSING: 'Saldo debitado, conversão em andamento.',
      COMPLETED: 'Na carteira. Transferências on-chain não voltam.',
      FAILED: 'Final. Crie um novo depósito.',
    },
    handler: handlerTabs(
      `if (data.event === 'STABLECOIN_DEPOSIT_COMPLETED') {
  await db.deposits.updateOne(
    { correlationId: data.stableDeposit.correlationID, status: { $ne: 'COMPLETED' } },
    { $set: { status: 'COMPLETED', txHash: data.stableDeposit.txHash } },
  );
}

if (data.event === 'STABLECOIN_PAYOUT_REFUND_CONFIRMED') {
  // entrega at-least-once: deduplique pelo ticket do provedor
  await db.refunds.insertIfMissing({ ticket: data.refund.providerTicketId, ...data.refund });
}`,
      `if ($data['event'] === 'STABLECOIN_DEPOSIT_COMPLETED') {
  $txHash = $data['stableDeposit']['txHash'];
}`,
    ),
  },
};
