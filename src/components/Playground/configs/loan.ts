import type { LogEntry, PlaygroundConfig, Resource } from '../types';
import { api, brl, chargeBrCode, endToEndId, hex, json, now } from '../utils';

import { A } from './shared';

const MONTHLY_RATE = 0.1;
const MIN = 10000;
const MAX = 250000;

const installmentAmount = (amount: number, n: number) =>
  Math.round((amount * MONTHLY_RATE) / (1 - (1 + MONTHLY_RATE) ** -n));

const dueDate = (seq: number): string => {
  const d = new Date();
  const month = d.getMonth() + seq;
  const last = new Date(d.getFullYear(), month + 1, 0).getDate();
  const due = new Date(d.getFullYear(), month, Math.min(d.getDate(), last));
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
};

const REFUSALS: Record<string, string> = {
  ALREADY_ACTIVE: 'O tomador já tem um empréstimo em aberto.',
  SCREENING_REFUSED: 'A análise do documento recusou.',
  ORIGINATION_CLOSED: 'A originação está fechada no momento.',
};

type Installment = {
  seq: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  payoff: Record<string, unknown> | null;
};

const plan = (r: Resource): Installment[] => r.installments;

const digits = (taxID: string) => taxID.replace(/\D/g, '');

const operationPath = (r: Resource) =>
  `/api/v1/loan/operation/${r.operationId}`;

const view = (r: Resource) => ({
  operation: Object.fromEntries(
    Object.entries(r).filter(([k]) => k !== 'charge'),
  ),
});

const refuse = (
  title: string,
  error: string,
  message: string,
  code = 422,
): LogEntry[] => [api(title, { error, message }, { code })];

const rootPayoff = (r: Resource) =>
  r.outstanding > 0
    ? {
        amount: r.outstanding,
        brCode: chargeBrCode(r.outstanding, r.operationId),
        txid: r.operationId,
        expiresAt: null,
      }
    : null;

const unpaid = (r: Resource): number[] =>
  plan(r)
    .filter((i) => !i.paid)
    .map((i) => i.seq);

const seqsFor = (r: Resource, scope: string) =>
  scope === 'NEXT' ? unpaid(r).slice(0, 1) : unpaid(r);

const payoffTitle = (r: Resource) => `POST ${operationPath(r)}/payoff`;

const payoffBody = (r: Resource) => ({
  payoff: {
    amount: r.charge.amount,
    brCode: r.charge.brCode,
    txid: r.charge.txid,
    expiresAt: r.charge.expiresAt,
    installments: r.charge.seqs,
  },
});

const rejectPayoff = (scope: string) => (r: Resource) => {
  const title = payoffTitle(r);
  if (r.disbursement.status !== 'CONFIRMED')
    return refuse(
      title,
      'DISBURSEMENT_NOT_CONFIRMED',
      'O Pix de desembolso ainda não foi confirmado.',
    );
  const seqs = seqsFor(r, scope);
  if (!r.charge) return null;
  if (r.charge.seqs.join() === seqs.join())
    return [
      api(title, payoffBody(r), {
        note: 'a cobrança das mesmas parcelas ainda está aberta: a API devolve a mesma, com o mesmo txid',
      }),
    ];
  return refuse(
    title,
    'CHARGE_OVERLAPS',
    `A parcela ${r.charge.seqs[0]} já tem uma cobrança em aberto.`,
  );
};

const applyPayoff = (scope: string) => (r: Resource) => {
  const seqs = seqsFor(r, scope);
  const amount = plan(r)
    .filter((i) => seqs.includes(i.seq))
    .reduce((sum, i) => sum + i.amount, 0);
  const txid = hex(32);
  const lastDue = plan(r)[seqs[seqs.length - 1] - 1].dueDate;
  const charge = {
    seqs,
    amount,
    txid,
    brCode: chargeBrCode(amount, txid),
    expiresAt: `${lastDue}T23:59:59.000Z`,
  };
  return {
    ...r,
    charge,
    installments: plan(r).map((i) =>
      seqs.length === 1 && seqs[0] === i.seq
        ? {
            ...i,
            payoff: {
              amount: i.amount,
              brCode: charge.brCode,
              txid,
              expiresAt: charge.expiresAt,
            },
          }
        : i,
    ),
  };
};

const payoffLog = (r: Resource) => [
  api(payoffTitle(r), payoffBody(r), {
    note: `uma cobrança Pix de ${brl(r.charge.amount)} cobrindo a parcela ${r.charge.seqs.join(', ')}; o expiresAt real vem da cobrança`,
  }),
];

export const loan: PlaygroundConfig = {
  id: 'emprestimo',
  title: 'Empréstimo',
  lede: 'Simule, origine e receba um empréstimo que a Woovi financia para o seu cliente. O pagamento é sempre uma cobrança Pix pedida pela API, nunca uma baixa manual. Taxa, datas e códigos desta página são simulados.',
  docs: [
    { label: 'Visão geral', href: '/docs/loan/loan-api-overview' },
    { label: 'Simular', href: '/docs/loan/how-to-simulate-a-loan-using-api' },
    { label: 'Originar', href: '/docs/loan/how-to-originate-a-loan-using-api' },
    { label: 'Acompanhar', href: '/docs/loan/how-to-track-a-loan-using-api' },
    { label: 'Pagar', href: '/docs/loan/how-to-pay-a-loan-using-api' },
  ],
  actors: [
    A.you,
    A.woovi,
    { id: 'tom', title: 'Tomador', sub: 'recebe e paga por Pix' },
  ],
  scenarios: [
    {
      id: 'originate',
      label: 'Simular e originar',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/loan/simulation',
          kind: 'req',
          title: 'Simule',
          text: 'A simulação não cria nada para o tomador. period (WEEKLY ou MONTHLY) só existe aqui.',
          code: json({
            taxID: '12345678909',
            amount: 150000,
            installmentNumber: 4,
            period: 'MONTHLY',
            correlationID: 'erp-sim-42',
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · installmentPlan',
          kind: 'res',
          title: 'Parcelas pela tabela Price',
          text: 'A taxa semanal sai por equivalência com a mensal, nunca por divisão.',
          code: json({
            simulation: {
              status: 'ACTIVE',
              amount: 150000,
              installmentNumber: 4,
              monthlyInterestRate: 0.1,
              totalAmount: 189284,
              installmentPlan: [
                { seq: 1, dueDate: '2026-11-07', amount: 47321 },
                { seq: 2, dueDate: '2026-12-07', amount: 47321 },
                { seq: 3, dueDate: '2027-01-07', amount: 47321 },
                { seq: 4, dueDate: '2027-02-07', amount: 47321 },
              ],
            },
          }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/loan/operation',
          kind: 'req',
          title: 'Origine',
          code: json({
            taxID: '12345678909',
            amount: 150000,
            installmentNumber: 4,
            correlationID: 'erp-loan-42',
          }),
          callout: {
            tone: 'warn',
            text: 'correlationID é obrigatório e único por empresa. Repetir devolve a mesma operação, mesmo com outro corpo.',
          },
        },
        {
          from: 'woovi',
          to: 'you',
          label: '201 · ACTIVE · disbursement PENDING',
          kind: 'res',
          title: 'A dívida existe, o dinheiro ainda não saiu',
          code: json({
            operation: {
              operationId: '6abd072eccca077d96ad9e20',
              status: 'ACTIVE',
              principal: 150000,
              outstanding: 189284,
              disbursement: { status: 'PENDING', endToEndId: null },
            },
          }),
        },
        {
          from: 'woovi',
          to: 'tom',
          label: 'Pix de desembolso',
          title: 'O dinheiro sai',
          text: 'Sem pixKey no corpo, o Pix vai para o próprio documento do tomador como chave.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/loan/operation/{id}',
          kind: 'req',
          title: 'Acompanhe',
          text: 'disbursement.status vai de PENDING a SENT e a CONFIRMED, com o endToEndId.',
          callout: {
            tone: 'info',
            text: 'Empréstimo não envia webhook: o estado se lê consultando a operação.',
          },
        },
      ],
    },
    {
      id: 'pay',
      label: 'Pagar uma parcela',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /operation/{id}/payoff',
          kind: 'req',
          title: 'Peça a cobrança',
          text: 'NEXT cobra a próxima parcela, INSTALLMENTS as parcelas em seqs, ALL todo o saldo.',
          code: json({ scope: 'NEXT' }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · brCode · txid',
          kind: 'res',
          title: 'Uma cobrança Pix dinâmica',
          code: json({
            payoff: {
              amount: 47321,
              brCode: '00020126580014br.gov.bcb.pix...6304EF01',
              txid: '199b55fa022346fa8ca3681da3c5d5fc',
              expiresAt: '2026-11-07T23:59:59.000Z',
              installments: [1],
            },
          }),
        },
        {
          from: 'you',
          to: 'tom',
          label: 'envia o copia e cola',
          title: 'Entregue o código',
          text: 'Quem paga pode ser o tomador ou a sua própria empresa.',
        },
        {
          from: 'tom',
          to: 'woovi',
          label: 'paga o Pix',
          title: 'O Pix é pago',
        },
        {
          note: 'woovi',
          label: 'baixa da parcela mais antiga',
          title: 'A baixa é automática',
          text: 'Nenhum endpoint marca parcela como paga. O pagamento entra da parcela mais antiga para a mais nova.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /operation/{id}',
          kind: 'req',
          title: 'Confira',
          text: 'paid vira true, outstanding cai e o pagamento aparece em repayments[].',
        },
      ],
    },
    {
      id: 'refused',
      label: 'Recusas',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/loan/operation',
          kind: 'req',
          title: 'Origine de novo para o mesmo documento',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '422 · ALREADY_ACTIVE',
          kind: 'res',
          bad: true,
          title: 'Um empréstimo ativo por vez',
          code: json({
            error: 'ALREADY_ACTIVE',
            message: 'O tomador já tem um empréstimo em aberto.',
          }),
          callout: {
            tone: 'warn',
            text: 'Trate também SCREENING_REFUSED, ORIGINATION_CLOSED, TAXID_TYPE_NOT_ELIGIBLE, FUND_INACTIVE e FUND_CLOSED.',
          },
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /operation/{id}/payoff · ALL',
          kind: 'req',
          title: 'Peça tudo com uma parcela já cobrada',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '422 · CHARGE_OVERLAPS',
          kind: 'res',
          bad: true,
          title: 'Uma cobrança viva por parcela',
          text: 'Pague a cobrança aberta ou espere ela expirar.',
        },
      ],
    },
    {
      id: 'cancelled',
      label: 'Desembolso falhou',
      steps: [
        {
          from: 'woovi',
          to: 'tom',
          label: 'Pix de desembolso',
          bad: true,
          title: 'O Pix falha',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /operation/{id}',
          kind: 'req',
          title: 'Consulte',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · CANCELLED · outstanding 0',
          kind: 'res',
          bad: true,
          title: 'Nada é devido',
          code: json({
            operation: {
              status: 'CANCELLED',
              outstanding: 0,
              disbursement: { status: 'FAILED', endToEndId: null },
            },
          }),
          callout: {
            tone: 'warn',
            text: 'O correlationID fica consumido: um novo empréstimo precisa de outro.',
          },
        },
      ],
    },
  ],
  statesTitle: 'A operação nasce ACTIVE antes do dinheiro sair',
  statesLede:
    'Os estados são os de status. O desembolso tem o seu próprio, em disbursement.status.',
  states: [
    { id: 'ACTIVE', sub: 'saldo devedor', x: 150, y: 90 },
    { id: 'SETTLED', sub: 'quitado · final', x: 470, y: 0, terminal: true },
    {
      id: 'CANCELLED',
      sub: 'desembolso falhou · final',
      x: 470,
      y: 190,
      terminal: true,
      tone: 'bad',
    },
    {
      id: 'WRITTEN_OFF',
      sub: 'baixado como perda',
      x: 150,
      y: 280,
      tone: 'warn',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'ACTIVE', label: 'POST /operation' },
    { id: 'settle', from: 'ACTIVE', to: 'SETTLED', label: 'último Pix pago' },
    {
      id: 'cancel',
      from: 'ACTIVE',
      to: 'CANCELLED',
      label: 'desembolso falhou',
    },
    {
      id: 'write-off',
      from: 'ACTIVE',
      to: 'WRITTEN_OFF',
      label: 'baixa como perda',
      sourceHandle: 'b',
      targetHandle: 't',
    },
  ],
  lab: {
    title: 'Originação',
    method: 'POST',
    path: '/api/v1/loan/operation',
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'taxID',
        label: 'Documento do tomador',
        api: 'taxID',
        type: 'text',
        default: '123.456.789-09',
        hint: 'CPF ou CNPJ, com ou sem máscara',
      },
      {
        id: 'amount',
        label: 'Valor',
        api: 'amount',
        type: 'cents',
        default: 150000,
        hint: 'de R$ 100,00 a R$ 2.500,00',
      },
      {
        id: 'installmentNumber',
        label: 'Parcelas',
        api: 'installmentNumber',
        type: 'select',
        default: '4',
        options: Array.from({ length: 8 }, (_, i) => ({
          value: String(i + 1),
          label: `${i + 1}x mensal`,
        })),
      },
      {
        id: 'pixKey',
        label: 'Chave Pix de destino',
        api: 'pixKey',
        type: 'text',
        default: '',
        hint: 'vazia: o Pix vai para o documento',
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'id',
        default: 'uuid',
      },
      {
        id: 'outcome',
        label: 'Resposta da Woovi',
        type: 'select',
        default: 'APPROVED',
        hint: 'só no playground, para ver as recusas',
        options: [
          { value: 'APPROVED', label: 'aprovada' },
          { value: 'ALREADY_ACTIVE', label: 'já tem empréstimo ativo' },
          { value: 'SCREENING_REFUSED', label: 'análise recusou' },
          { value: 'ORIGINATION_CLOSED', label: 'originação fechada' },
        ],
      },
    ],
    body: (v) => ({
      taxID: v.taxID,
      amount: v.amount,
      installmentNumber: Number(v.installmentNumber),
      ...(String(v.pixKey).trim() ? { pixKey: v.pixKey } : {}),
      correlationID: v.correlationID,
    }),
    createTransition: 'create',
    create: (v) => {
      const title = 'POST /api/v1/loan/operation';
      const taxID = digits(String(v.taxID));
      if (taxID.length !== 11 && taxID.length !== 14)
        return {
          log: refuse(
            title,
            'INVALID_REQUEST',
            'taxID precisa ser um CPF ou CNPJ.',
            400,
          ),
        };
      if (v.amount < MIN || v.amount > MAX)
        return {
          log: refuse(
            title,
            'INVALID_REQUEST',
            `amount precisa estar entre ${MIN} e ${MAX} centavos.`,
            400,
          ),
        };
      if (v.outcome !== 'APPROVED')
        return {
          log: refuse(title, v.outcome, REFUSALS[v.outcome]),
        };
      const n = Number(v.installmentNumber);
      const each = installmentAmount(v.amount, n);
      const installments = Array.from({ length: n }, (_, i) => ({
        seq: i + 1,
        dueDate: dueDate(i + 1),
        amount: each,
        paid: false,
        payoff: null,
      }));
      const r: Resource = {
        operationId: hex(24),
        correlationID: v.correlationID,
        taxID: { taxID, type: taxID.length === 11 ? 'BR:CPF' : 'BR:CNPJ' },
        status: 'ACTIVE',
        principal: v.amount,
        totalDue: each * n,
        outstanding: each * n,
        installmentNumber: n,
        dueDate: installments[n - 1].dueDate,
        disbursedAt: now(),
        settledAt: null,
        disbursement: { status: 'PENDING', endToEndId: null },
        installments,
        payoff: null,
        repayments: [],
        createdAt: now(),
        charge: null,
      };
      r.payoff = rootPayoff(r);
      return {
        resource: r,
        log: [
          api(title, view(r), {
            code: 201,
            note: `${n}x de ${brl(each)} a ${MONTHLY_RATE * 100}% ao mês; o Pix para ${String(v.pixKey).trim() || 'o documento'} ainda não saiu`,
          }),
        ],
      };
    },
    replay: (r) => [
      api('POST /api/v1/loan/operation', view(r), {
        note: 'mesmo correlationID: a API devolve a mesma operação, sem originar outra',
      }),
    ],
    actions: [
      {
        id: 'confirm',
        label: 'Confirmar desembolso',
        primary: true,
        from: ['ACTIVE'],
        to: '',
        transition: '',
        reject: (r) =>
          r.disbursement.status === 'CONFIRMED'
            ? [
                api(`GET ${operationPath(r)}`, view(r), {
                  note: 'o desembolso já foi confirmado',
                }),
              ]
            : null,
        apply: (r) => ({
          ...r,
          disbursement: { status: 'CONFIRMED', endToEndId: endToEndId() },
        }),
        log: (r) => [
          api(`GET ${operationPath(r)}`, view(r), {
            note: 'PENDING, SENT e CONFIRMED; sem webhook, o Pix confirmado aparece ao consultar a operação',
          }),
        ],
      },
      {
        id: 'fail',
        label: 'Simular falha no desembolso',
        from: ['ACTIVE'],
        to: 'CANCELLED',
        transition: 'cancel',
        reject: (r) =>
          r.disbursement.status === 'CONFIRMED'
            ? [
                api(`GET ${operationPath(r)}`, view(r), {
                  note: 'o Pix já foi confirmado: a operação não volta a CANCELLED',
                }),
              ]
            : null,
        apply: (r) => ({
          ...r,
          outstanding: 0,
          payoff: null,
          disbursement: { status: 'FAILED', endToEndId: null },
        }),
        log: (r) => [
          api(`GET ${operationPath(r)}`, view(r), {
            note: 'nada é devido; o correlationID fica consumido',
          }),
        ],
      },
      {
        id: 'payoff-next',
        label: 'Cobrar a próxima parcela',
        from: ['ACTIVE'],
        to: '',
        transition: '',
        reject: rejectPayoff('NEXT'),
        apply: applyPayoff('NEXT'),
        log: payoffLog,
      },
      {
        id: 'payoff-all',
        label: 'Cobrar tudo',
        from: ['ACTIVE'],
        to: '',
        transition: '',
        reject: rejectPayoff('ALL'),
        apply: applyPayoff('ALL'),
        log: payoffLog,
      },
      {
        id: 'pay',
        label: 'Tomador paga o Pix',
        from: ['ACTIVE'],
        to: '',
        transition: (r) => (r.status === 'SETTLED' ? 'settle' : ''),
        reject: (r) =>
          r.charge
            ? null
            : [
                api(`GET ${operationPath(r)}`, view(r), {
                  note: 'não há cobrança em aberto: peça uma antes',
                }),
              ],
        apply: (r) => {
          const outstanding = r.outstanding - r.charge.amount;
          const settled: Resource = {
            ...r,
            outstanding,
            installments: plan(r).map((i) =>
              r.charge.seqs.includes(i.seq)
                ? { ...i, paid: true, payoff: null }
                : i,
            ),
            repayments: [
              {
                id: hex(24),
                amount: r.charge.amount,
                channel: 'PIX_MANUAL',
                createdAt: now(),
              },
              ...r.repayments,
            ],
            charge: null,
            status: outstanding === 0 ? 'SETTLED' : r.status,
            settledAt: outstanding === 0 ? now() : null,
          };
          return { ...settled, payoff: rootPayoff(settled) };
        },
        log: (r) => [
          api(`GET ${operationPath(r)}`, view(r), {
            note:
              r.status === 'SETTLED'
                ? 'última parcela paga: a operação está quitada'
                : `baixa automática, faltam ${brl(r.outstanding)}`,
          }),
        ],
      },
    ],
    summary: (r) => [
      ['emprestado', brl(r.principal)],
      [
        'parcelas',
        `${plan(r).filter((i) => i.paid).length} de ${r.installmentNumber} pagas`,
      ],
      ['saldo devedor', brl(r.outstanding)],
      ['desembolso', r.disbursement.status],
      ...(r.charge
        ? ([['cobrança viva', brl(r.charge.amount)]] as [string, string][])
        : []),
    ],
    qr: (r) => r.charge?.brCode,
    explain: {
      NONE: 'Origine. Troque a resposta da Woovi para ver as recusas, ou repita o identificador para ver a idempotência.',
      ACTIVE:
        'Confirme o desembolso antes de cobrar. Peça a próxima parcela, pague o Pix e tente cobrar tudo com uma cobrança aberta.',
      SETTLED: 'Quitado. Um novo empréstimo precisa de outro correlationID.',
      CANCELLED:
        'O desembolso falhou e nada é devido. Origine de novo com outro correlationID.',
    },
  },
};
