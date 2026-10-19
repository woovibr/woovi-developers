import type { PlaygroundConfig, Resource } from '../types';
import { api, json } from '../utils';

import LivenessPreview from '../widgets/LivenessPreview';

const LINK =
  'https://kyc.woovi.com/new/onboarding/wFy5rjmZ4jUJ3cbLZ8qYyOWzOSXRJEHFI5RJFqrPGVs/liveness?embed=true';

const onboardingBody = {
  linkOnboarding:
    'https://kyc.woovi.com/new/onboarding/wFy5rjmZ4jUJ3cbLZ8qYyOWzOSXRJEHFI5RJFqrPGVs',
  linkLiveness: LINK,
  accountRegister: {
    status: 'PENDING',
    correlationID: 'merchant-77',
  },
};

export const embedLiveness: PlaygroundConfig = {
  id: 'embed-liveness',
  title: 'Embed Liveness',
  lede: 'A API devolve o link da selfie. O cliente tira a foto nessa página, por redirect, nova aba ou iframe, sem passar pelo wizard do cadastro.',
  docs: [
    {
      label: 'Link de liveness',
      href: '/docs/baas/kyc/kyc-api-onboarding-liveness',
    },
    {
      label: 'Criar onboarding',
      href: '/docs/baas/kyc/kyc-api-onboarding-create',
    },
    {
      label: 'Onboarding pela API e RFI',
      href: '/docs/baas/kyc/kyc-api-onboarding-full-api',
    },
    {
      label: 'Embed do cadastro',
      href: '/docs/playground/playground-embed-baas',
    },
  ],
  widget: LivenessPreview,
  widgetTitle: 'Escolha como embutir a selfie',
  actors: [
    { id: 'front', title: 'Seu front', sub: 'página HTTPS' },
    { id: 'you', title: 'Seu backend', sub: 'AppID Master' },
    { id: 'woovi', title: 'Woovi', sub: 'api.woovi.com' },
    { id: 'kyc', title: 'kyc.woovi.com', sub: 'selfie' },
  ],
  scenarios: [
    {
      id: 'iframe',
      label: 'Pelo onboarding',
      steps: [
        {
          from: 'front',
          to: 'you',
          label: 'Quero fazer a prova de vida',
          title: 'O cliente pede a selfie',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/kyc/onboarding',
          kind: 'req',
          title: 'Seu backend cria ou reaproveita o cadastro',
          text: 'Idempotente por correlationID. A resposta de parceiro não traz linkLiveness.',
          code: json({
            taxID: '12.345.678/0001-90',
            correlationID: 'merchant-77',
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '201 · linkLiveness',
          kind: 'res',
          title: 'O link da selfie já vem com ?embed=true',
          code: json(onboardingBody),
        },
        {
          from: 'you',
          to: 'front',
          label: 'só o linkLiveness',
          title: 'O front não vê o AppID',
        },
        {
          from: 'front',
          to: 'kyc',
          label: '<iframe allow="camera">',
          title: 'A selfie abre dentro da sua página',
          text: 'Largura até cerca de 640px e altura de 720px ou mais. Sem o wizard.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/kyc/rfi',
          kind: 'req',
          title: 'Não há postMessage',
          text: 'linkLiveness fica null quando nenhum representante ativo tem PICTURE pendente.',
        },
      ],
    },
    {
      id: 'rfi',
      label: 'Pela RFI',
      steps: [
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook ACCOUNT_REGISTER_DOCUMENTS_REQUESTED',
          kind: 'evt',
          title: 'A análise pediu uma selfie',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/kyc/rfi?correlationID',
          kind: 'req',
          title: 'Leia o que está pendente',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · link + linkLiveness',
          kind: 'res',
          title: 'Dois links',
          text: 'link abre os documentos. linkLiveness só existe enquanto PICTURE está pendente. Na RFI, ?embed=true entra com EMBED_RFI ou link PLATFORM_EMBED.',
          code: json({
            representatives: [
              {
                name: 'MARIA DE SOUZA',
                pending: [{ type: 'PICTURE', answeredBy: 'FILE' }],
              },
            ],
            link: 'https://kyc.woovi.com/onboarding/QWNjb3VudFJlZ2lzdGVyOjY5…/documents',
            linkLiveness: LINK,
          }),
        },
        {
          from: 'front',
          to: 'kyc',
          label: 'abre linkLiveness',
          title: 'O cliente tira outra foto',
        },
      ],
    },
  ],
  statesTitle: 'O que a página da selfie mostra',
  statesLede:
    'Isto é a página, não o status do accountRegister. Uma foto recusada continua no mesmo link.',
  states: [
    { id: 'OPEN', sub: 'aguardando a selfie', x: 180, y: 90 },
    {
      id: 'SENT',
      sub: 'selfie aceita',
      x: 560,
      y: 0,
      terminal: true,
      tone: 'ok',
    },
    {
      id: 'RETRY',
      sub: 'não confirmou que é ao vivo',
      x: 560,
      y: 190,
      tone: 'warn',
    },
  ],
  transitions: [
    { id: 'open', from: 'start', to: 'OPEN', label: 'abre linkLiveness' },
    { id: 'accept', from: 'OPEN', to: 'SENT', label: 'selfie aceita' },
    { id: 'spoof', from: 'OPEN', to: 'RETRY', label: 'checagem recusou' },
    {
      id: 'again',
      from: 'RETRY',
      to: 'OPEN',
      label: 'tira outra foto',
      sourceHandle: 'l',
      targetHandle: 'b',
    },
  ],
  lab: {
    title: 'POST /api/v1/kyc/onboarding',
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
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'text',
        default: 'merchant-77',
        hint: 'repetir devolve o mesmo link',
      },
    ],
    body: (values) => ({
      taxID: values.taxID,
      correlationID: values.correlationID,
    }),
    createTransition: 'open',
    create: (values) => {
      const resource: Resource = {
        status: 'OPEN',
        correlationID: values.correlationID,
        linkLiveness: LINK,
      };
      return {
        resource,
        log: [
          api(
            'POST /api/v1/kyc/onboarding',
            {
              ...onboardingBody,
              accountRegister: {
                status: 'PENDING',
                correlationID: values.correlationID,
              },
            },
            { code: 201, note: 'BaaS. partner: true omite linkLiveness' },
          ),
        ],
      };
    },
    actions: [
      {
        id: 'accept',
        label: 'Selfie aceita',
        from: ['OPEN'],
        to: 'SENT',
        transition: 'accept',
        primary: true,
        log: (resource) => [
          api(
            `GET /api/v1/kyc/rfi?correlationID=${resource.correlationID}`,
            {
              representatives: [],
              link: 'https://kyc.woovi.com/onboarding/QWNjb3VudFJlZ2lzdGVyOjY5…/documents',
              linkLiveness: null,
            },
            { note: 'PICTURE não está mais pendente' },
          ),
        ],
      },
      {
        id: 'spoof',
        label: 'Checagem recusou',
        from: ['OPEN'],
        to: 'RETRY',
        transition: 'spoof',
        log: () => [
          api(
            'GET /api/v1/kyc/rfi?correlationID=merchant-77',
            {
              representatives: [
                {
                  pending: [{ type: 'PICTURE', answeredBy: 'FILE' }],
                },
              ],
              linkLiveness: LINK,
            },
            { note: 'o mesmo link continua válido' },
          ),
        ],
      },
      {
        id: 'again',
        label: 'Abrir de novo',
        from: ['RETRY'],
        to: 'OPEN',
        transition: 'again',
        log: () => [
          api('GET linkLiveness', { url: LINK }, { note: 'mesma URL' }),
        ],
      },
    ],
    summary: (resource) => [
      ['correlationID', String(resource.correlationID)],
      ['linkLiveness', String(resource.linkLiveness)],
    ],
    explain: {
      OPEN: 'Mande o cliente para linkLiveness. A API não tira a foto.',
      SENT: 'Consulte a RFI: linkLiveness voltou null.',
      RETRY:
        'A foto não foi confirmada como ao vivo. O cliente usa o mesmo link.',
    },
  },
};
