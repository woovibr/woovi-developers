import type { PlaygroundConfig, Resource, State, Transition } from '../types';
import { api, hex, hook, json, now } from '../utils';

import { handlerTabs } from './shared';

const STEPS = [
  'COMPANY_DATA',
  'ADDRESS',
  'SOCIAL_CONTRACT',
  'PARTNERS',
  'TERMS',
];

export const accountStates: State[] = [
  { id: 'PENDING', sub: 'preenchendo etapas', x: 150, y: 100 },
  { id: 'IN_REVIEW', sub: 'em análise · até 72h', x: 430, y: 100 },
  { id: 'APPROVED', sub: 'conta aberta · final', x: 720, y: 0, terminal: true },
  { id: 'REJECTED', sub: 'final', x: 720, y: 200, terminal: true, tone: 'bad' },
];

export const accountTransitions: Transition[] = [
  { id: 'create', from: 'start', to: 'PENDING', label: 'POST /kyc/onboarding' },
  {
    id: 'submit',
    from: 'PENDING',
    to: 'IN_REVIEW',
    label: 'submit → IN_REVIEW',
    sourceHandle: 't',
    targetHandle: 't',
  },
  {
    id: 'back',
    from: 'IN_REVIEW',
    to: 'PENDING',
    label: 'devolvido → PENDING',
    sourceHandle: 'b',
    targetHandle: 'b',
  },
  { id: 'approve', from: 'IN_REVIEW', to: 'APPROVED', label: 'APPROVED' },
  { id: 'reject', from: 'IN_REVIEW', to: 'REJECTED', label: 'REJECTED' },
];

export const baas: PlaygroundConfig = {
  id: 'baas',
  title: 'BaaS',
  lede: 'Abra contas para os seus clientes com a chave API Master: crie o cadastro (KYC), acompanhe as etapas por webhook e, com a conta aprovada, gere um AppID só dela.',
  docs: [
    { label: 'Conceitos', href: '/docs/baas/conceitos-baas' },
    {
      label: 'Onboarding via API',
      href: '/docs/baas/kyc/kyc-api-onboarding-create',
    },
    {
      label: 'Ciclo de vida e webhooks',
      href: '/docs/baas/kyc/kyc-webhooks-lifecycle',
    },
    { label: 'API Master', href: '/docs/baas/baas-api-master' },
    { label: 'Webhooks por conta', href: '/docs/baas/webhooks-por-conta' },
  ],
  actors: [
    { id: 'you', title: 'Seu sistema', sub: 'AppID Master' },
    { id: 'woovi', title: 'Woovi', sub: 'api.woovi.com' },
    { id: 'merchant', title: 'Seu cliente', sub: 'kyc.woovi.com' },
    { id: 'ops', title: 'Análise', sub: 'compliance Woovi' },
  ],
  scenarios: [
    {
      id: 'approved',
      label: 'Aprovado',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/kyc/onboarding',
          kind: 'req',
          title: 'Crie o cadastro',
          text: 'Só taxID é obrigatório. businessDescription já completa a etapa COMPANY_DATA.',
          code: json({
            taxID: 'XX.XXX.XXX/0001-XX',
            correlationID: 'my-unique-id',
            website: 'https://loja-do-merchant.com.br',
            businessDescription: 'Loja de roupas e acessórios femininos',
            representatives: [{ taxID: 'XXX.XXX.XXX-XX' }],
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '201 · linkOnboarding · PENDING',
          kind: 'res',
          title: 'Link do cadastro',
          code: json({
            linkOnboarding:
              'https://kyc.woovi.com/onboarding/QWNjb3VudFJlZ2lzdGVyOjY5…',
            accountRegister: {
              status: 'PENDING',
              correlationID: 'my-unique-id',
            },
          }),
        },
        {
          from: 'you',
          to: 'merchant',
          label: 'Envia o link',
          title: 'Seu cliente preenche',
          text: 'Por redirect, nova aba ou iframe. Veja o playground de Embed BaaS.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook ACCOUNT_REGISTER_STEP_UPDATED',
          kind: 'evt',
          title: 'Uma etapa por vez',
          text: 'Cada etapa concluída gera um evento com completedSteps e pendingSteps.',
          code: json({
            event: 'ACCOUNT_REGISTER_STEP_UPDATED',
            accountRegister: {
              status: 'PENDING',
              completedSteps: ['COMPANY_DATA', 'ADDRESS'],
              pendingSteps: ['SOCIAL_CONTRACT', 'PARTNERS', 'TERMS', 'REVIEW'],
              step: 'ADDRESS',
              stepStatus: 'COMPLETED',
              stepScope: 'COMPANY',
            },
          }),
        },
        {
          from: 'merchant',
          to: 'woovi',
          label: 'Envia para análise',
          title: 'Cadastro enviado',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook ACCOUNT_REGISTER_IN_REVIEW',
          kind: 'evt',
          title: 'Em análise',
          text: 'A análise pode levar até 72h.',
        },
        {
          from: 'ops',
          to: 'woovi',
          label: 'aprova',
          title: 'Compliance aprova',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook ACCOUNT_REGISTER_APPROVED',
          kind: 'evt',
          title: 'Conta aberta',
          code: json({
            event: 'ACCOUNT_REGISTER_APPROVED',
            accountRegister: { status: 'APPROVED' },
            account: {
              status: 'OPEN',
              accountId: '68dbe391ee9fce4ba2b0b4ec',
              account: '123456',
              branch: '0001',
            },
          }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/application',
          kind: 'req',
          title: 'AppID só da nova conta',
          text: 'O header Authorization decide em qual conta cada operação roda: a Master administra, o AppID da conta opera.',
          code: json({
            accountId: '68dbe391ee9fce4ba2b0b4ec',
            application: { name: 'conta-001', type: 'API' },
          }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/webhook (AppID da conta)',
          kind: 'req',
          title: 'Webhooks da conta',
          text: 'Eventos de dentro da conta, como OPENPIX:CHARGE_COMPLETED, são cadastrados com o AppID dela.',
        },
      ],
    },
    {
      id: 'rfi',
      label: 'Pedido de documentos',
      steps: [
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook ACCOUNT_REGISTER_IN_REVIEW',
          kind: 'evt',
          title: 'Em análise',
        },
        {
          from: 'ops',
          to: 'woovi',
          label: 'pede documentos',
          title: 'Faltou documento',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook ACCOUNT_REGISTER_PENDING',
          kind: 'evt',
          bad: true,
          title: 'Volta para PENDING',
          text: 'requestDocuments e requestReason dizem o que falta. retryCount conta as devoluções.',
        },
        {
          from: 'merchant',
          to: 'woovi',
          label: 'envia o que faltou',
          title: 'Cliente complementa',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook ACCOUNT_REGISTER_IN_REVIEW',
          kind: 'evt',
          title: 'De volta à análise',
        },
      ],
    },
  ],
  statesTitle: 'O cadastro vai e volta até a decisão',
  statesLede:
    'IN_REVIEW não é final: a análise pode devolver para PENDING. A API também tem DRAFT, FAILED, CREATING e DELETED, fora deste fluxo principal.',
  states: accountStates,
  transitions: accountTransitions,
  lab: {
    title: 'Cadastro (accountRegister)',
    method: 'POST',
    path: '/api/v1/kyc/onboarding',
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'taxID',
        label: 'CNPJ',
        api: 'taxID',
        type: 'text',
        default: '12.345.678/0001-90',
      },
      {
        id: 'website',
        label: 'Site',
        api: 'website',
        type: 'text',
        default: 'https://loja-do-merchant.com.br',
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'id',
        default: 'uuid',
        hint: 'opcional; o padrão é o CNPJ',
      },
      {
        id: 'businessDescription',
        label: 'Descrição do negócio',
        api: 'businessDescription',
        type: 'text',
        default: 'Loja de roupas e acessórios femininos',
        hint: 'preenchida, completa a etapa COMPANY_DATA',
        wide: true,
      },
    ],
    body: (v) => ({
      taxID: v.taxID,
      correlationID: v.correlationID,
      website: v.website,
      ...(v.businessDescription
        ? { businessDescription: v.businessDescription }
        : {}),
      representatives: [{ taxID: 'XXX.XXX.XXX-XX' }],
    }),
    createTransition: 'create',
    create: (v) => {
      const done = v.businessDescription ? ['COMPANY_DATA'] : [];
      const r: Resource = {
        status: 'PENDING',
        accountRegisterId: hex(24),
        correlationID: v.correlationID,
        taxID: String(v.taxID).replace(/\D/g, ''),
        completedSteps: done,
        retryCount: 0,
        linkOnboarding:
          'https://kyc.woovi.com/onboarding/' +
          btoa('AccountRegister:' + hex(24)).replace(/=+$/, ''),
      };
      return {
        resource: r,
        log: [
          api(
            'POST /api/v1/kyc/onboarding',
            {
              linkOnboarding: r.linkOnboarding,
              accountRegister: {
                status: 'PENDING',
                taxID: { taxID: r.taxID, type: 'BR:CNPJ' },
                correlationID: r.correlationID,
              },
            },
            { code: 201 },
          ),
        ],
      };
    },
    actions: [
      {
        id: 'step',
        label: 'Concluir próxima etapa',
        from: ['PENDING'],
        to: '',
        transition: '',
        apply: (r) => {
          const next = STEPS.find((s) => !r.completedSteps.includes(s));
          return next
            ? {
                ...r,
                completedSteps: [...r.completedSteps, next],
                lastStep: next,
              }
            : r;
        },
        reject: (r) =>
          r.completedSteps.length === STEPS.length
            ? [
                api(
                  `GET /api/v1/account-register/${r.correlationID}`,
                  {
                    accountRegister: {
                      status: 'PENDING',
                      completedSteps: r.completedSteps,
                    },
                  },
                  {
                    note: 'todas as etapas da empresa estão completas: envie para análise',
                  },
                ),
              ]
            : null,
        log: (r) => [
          hook('ACCOUNT_REGISTER_STEP_UPDATED', {
            accountRegister: {
              accountRegisterId: r.accountRegisterId,
              correlationID: r.correlationID,
              status: 'PENDING',
              completedSteps: r.completedSteps,
              pendingSteps: [
                ...STEPS.filter((s) => !r.completedSteps.includes(s)),
                'REVIEW',
              ],
              step: r.lastStep,
              stepStatus: 'COMPLETED',
              stepScope: 'COMPANY',
              stepCompletedAt: now(),
              retrying: r.retryCount > 0,
              retryCount: r.retryCount,
            },
          }),
        ],
      },
      {
        id: 'submit',
        label: 'Enviar para análise',
        primary: true,
        from: ['PENDING'],
        to: 'IN_REVIEW',
        transition: 'submit',
        log: (r) => [
          hook('ACCOUNT_REGISTER_IN_REVIEW', {
            accountRegister: {
              accountRegisterId: r.accountRegisterId,
              correlationID: r.correlationID,
              status: 'IN_REVIEW',
            },
          }),
        ],
      },
      {
        id: 'back',
        label: 'Pedir documentos',
        from: ['IN_REVIEW'],
        to: 'PENDING',
        transition: 'back',
        apply: (r) => ({ ...r, retryCount: r.retryCount + 1 }),
        log: (r) => [
          hook('ACCOUNT_REGISTER_PENDING', {
            accountRegister: {
              accountRegisterId: r.accountRegisterId,
              correlationID: r.correlationID,
              status: 'PENDING',
              requestDocuments: ['SOCIAL_CONTRACT'],
              requestReason: 'Contrato social ilegível',
              retryCount: r.retryCount,
            },
          }),
        ],
      },
      {
        id: 'approve',
        label: 'Aprovar',
        from: ['IN_REVIEW'],
        to: 'APPROVED',
        transition: 'approve',
        apply: (r) => ({ ...r, accountId: hex(24) }),
        log: (r) => [
          hook('ACCOUNT_REGISTER_APPROVED', {
            accountRegister: {
              taxID: { taxID: r.taxID, type: 'BR:CNPJ' },
              status: 'APPROVED',
              correlationID: r.correlationID,
            },
            account: {
              status: 'OPEN',
              accountId: r.accountId,
              account: '123456',
              branch: '0001',
            },
          }),
          api(
            'POST /api/v1/application',
            {
              application: {
                name: 'conta-' + r.correlationID.slice(0, 6),
                type: 'API',
                appID: 'Q2xpZW50X0lkXz' + hex(20),
              },
            },
            {
              code: 201,
              note: 'próximo passo: gere o AppID desta conta com a chave Master',
              delay: 900,
            },
          ),
        ],
      },
      {
        id: 'reject',
        label: 'Rejeitar',
        from: ['IN_REVIEW'],
        to: 'REJECTED',
        transition: 'reject',
        log: (r) => [
          hook('ACCOUNT_REGISTER_REJECTED', {
            accountRegister: {
              accountRegisterId: r.accountRegisterId,
              correlationID: r.correlationID,
              status: 'REJECTED',
              rejectedReason: 'Atividade não permitida',
            },
          }),
        ],
      },
    ],
    summary: (r) => [
      ['correlationID', r.correlationID],
      ['etapas concluídas', r.completedSteps.join(', ') || 'nenhuma'],
      ['devoluções', String(r.retryCount)],
      ['linkOnboarding', r.linkOnboarding],
      ...(r.accountId
        ? ([['accountId', r.accountId]] as [string, string][])
        : []),
    ],
    explain: {
      NONE: 'Envie a requisição com a chave API Master.',
      PENDING:
        'Conclua etapas para ver o STEP_UPDATED, ou envie direto para análise.',
      IN_REVIEW:
        'A análise decide: aprova, rejeita ou devolve pedindo documentos.',
      APPROVED:
        'Conta aberta. Agora gere um AppID para ela e cadastre os webhooks da conta com esse AppID.',
      REJECTED: 'Final. rejectedReason explica o motivo.',
    },
    handlerTitle: 'Seu endpoint de webhook (cadastrado com a Master)',
    handler: handlerTabs(
      `// webhooks ACCOUNT_REGISTER_* precisam ser cadastrados com a chave Master;
// com o AppID de uma subconta o cadastro responde 200, mas nada é entregue
const r = data.accountRegister;
const key = [r.accountRegisterId, r.step, r.stepStatus, r.retryCount].join(':');
if (await db.processed.exists(key)) return res.sendStatus(200);

if (data.event === 'ACCOUNT_REGISTER_APPROVED') {
  await db.merchants.updateOne(
    { correlationID: r.correlationID },
    { $set: { status: 'APPROVED', accountId: data.account.accountId } },
  );
}

await db.processed.add(key);`,
      `$r = $data['accountRegister'];
if ($data['event'] === 'ACCOUNT_REGISTER_APPROVED') {
  $accountId = $data['account']['accountId'];
}`,
    ),
  },
};
