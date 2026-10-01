import type { PlaygroundConfig, Resource } from '../types';
import { api, brl, endToEndId, hex, hook, json } from '../utils';

export const campaign: PlaygroundConfig = {
  id: 'campanha-chave-pix',
  title: 'Campanha com chave Pix',
  lede: 'Para clientes BaaS: uma conta por campanha, com uma chave Pix própria. Cada conta tem seu saldo, então o total arrecadado é o saldo da conta. No fim, saque e apague a chave.',
  docs: [
    { label: 'Campanha de chave Pix', href: '/docs/apis/api-pix-key-campaign' },
    { label: 'Movimentando saldo', href: '/docs/baas/movimentando-saldo' },
    { label: 'Webhooks por conta', href: '/docs/baas/webhooks-por-conta' },
  ],
  actors: [
    { id: 'you', title: 'Seu sistema', sub: 'AppID Master' },
    { id: 'woovi', title: 'Woovi', sub: 'api.woovi.com' },
    { id: 'donor', title: 'Doadores', sub: 'qualquer banco' },
  ],
  scenarios: [
    {
      id: 'lifecycle',
      label: 'Do início ao fim',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/account (Master)',
          kind: 'req',
          title: 'Uma conta para a campanha',
          text: 'Com a chave API Master. A resposta traz o accountId.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/application',
          kind: 'req',
          title: 'AppID da conta',
          code: json({
            accountId: '6290ccfd42831958a405debc',
            application: { name: 'campanha-natal', type: 'API' },
          }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/pix-keys (AppID da conta)',
          kind: 'req',
          title: 'A chave da campanha',
          code: json({ pixKey: 'campanha@woovi.com', type: 'EMAIL' }),
        },
        {
          from: 'donor',
          to: 'woovi',
          label: 'Pix para campanha@woovi.com',
          title: 'Doações chegam',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook OPENPIX:TRANSACTION_RECEIVED',
          kind: 'evt',
          title: 'Cada doação é um evento',
          text: 'Cadastre o webhook com o AppID da conta da campanha.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/pix-keys',
          kind: 'req',
          title: 'Chaves e saldo',
          text: 'A resposta traz as chaves e o saldo da conta: o total arrecadado.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/pix-keys/withdraw',
          kind: 'req',
          title: 'Chave de saque',
          text: 'Registra e seleciona a chave para onde o saque vai. O titular precisa ser o mesmo da conta.',
          callout: {
            tone: 'warn',
            text: 'Endpoints de chave de saque vêm desligados e respondem 403 até o suporte habilitar.',
          },
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/account/{id}/withdraw',
          kind: 'req',
          title: 'Saque',
          code: json({ value: 7000 }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'DELETE /api/v1/pix-keys/{key}',
          kind: 'req',
          title: 'Encerre a campanha',
          text: 'Sem a chave, não entra mais dinheiro. Resposta 204.',
        },
      ],
    },
  ],
  statesTitle: 'A vida de uma campanha',
  statesLede:
    'A API não tem um objeto campanha. Estes estados são ilustrativos e seguem a chave Pix da conta.',
  states: [
    { id: 'ARRECADANDO', sub: 'chave ativa · recebe Pix', x: 150, y: 80 },
    {
      id: 'ENCERRADA',
      sub: 'chave apagada · final',
      x: 470,
      y: 80,
      terminal: true,
      tone: 'muted',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'ARRECADANDO', label: 'POST /pix-keys' },
    {
      id: 'close',
      from: 'ARRECADANDO',
      to: 'ENCERRADA',
      label: 'DELETE /pix-keys/{key}',
    },
  ],
  lab: {
    title: 'Conta da campanha',
    method: 'POST',
    path: '/api/v1/pix-keys',
    fields: [
      {
        id: 'pixKey',
        label: 'Chave da campanha',
        api: 'pixKey',
        type: 'text',
        default: 'campanha-natal@ong.org.br',
      },
      {
        id: 'type',
        label: 'Tipo',
        api: 'type',
        type: 'select',
        default: 'EMAIL',
        options: [
          { value: 'EMAIL', label: 'EMAIL' },
          { value: 'EVP', label: 'EVP (aleatória)' },
          { value: 'PHONE', label: 'PHONE' },
        ],
      },
      {
        id: 'withdrawKey',
        label: 'Chave de saque',
        api: 'pixKeyWithdraw',
        type: 'text',
        default: 'saque@ong.org.br',
        hint: 'mesmo titular da conta',
        wide: true,
      },
    ],
    body: (v) => ({
      pixKey: v.type === 'EVP' ? undefined : v.pixKey,
      type: v.type,
    }),
    createTransition: 'create',
    create: (v) => {
      const key =
        v.type === 'EVP'
          ? `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`
          : v.pixKey;
      const r: Resource = {
        status: 'ARRECADANDO',
        key,
        type: v.type,
        accountId: hex(24),
        balance: 0,
        donations: 0,
        withdrawKey: v.withdrawKey,
        withdrawn: 0,
        withdrawSet: false,
      };
      return {
        resource: r,
        log: [
          api(
            'POST /api/v1/pix-keys',
            { pixKey: { key: r.key, type: r.type } },
            { code: 201, note: 'chamada com o AppID da conta da campanha' },
          ),
        ],
      };
    },
    actions: [
      {
        id: 'donate',
        label: 'Receber uma doação',
        primary: true,
        from: ['ARRECADANDO'],
        to: 'ARRECADANDO',
        transition: '',
        apply: (r) => {
          const v = [1000, 2500, 5000, 10000][(Math.random() * 4) | 0];
          return {
            ...r,
            last: v,
            balance: r.balance + v,
            donations: r.donations + 1,
          };
        },
        log: (r) => [
          hook(
            'OPENPIX:TRANSACTION_RECEIVED',
            {
              pix: {
                value: r.last,
                pixKey: r.key,
                endToEndId: endToEndId(),
                status: 'CONFIRMED',
              },
              account: { accountId: r.accountId },
            },
            { note: `doação nº ${r.donations}` },
          ),
        ],
      },
      {
        id: 'withdraw-key',
        label: 'Definir chave de saque',
        from: ['ARRECADANDO', 'ENCERRADA'],
        to: '',
        transition: '',
        apply: (r) => ({ ...r, withdrawSet: true }),
        log: (r) => [
          api(
            'POST /api/v1/pix-keys/withdraw',
            {
              account: {
                accountId: r.accountId,
                pixKeyWithdraw: { pixKey: r.withdrawKey, type: 'EMAIL' },
              },
            },
            {
              note: 'a chave é verificada no DICT e precisa ter o mesmo titular da conta',
            },
          ),
        ],
      },
      {
        id: 'withdraw',
        label: 'Sacar o saldo',
        from: ['ARRECADANDO', 'ENCERRADA'],
        to: '',
        transition: '',
        reject: (r) =>
          !r.withdrawSet
            ? [
                api(
                  `GET /api/v1/account/${r.accountId}`,
                  { account: { accountId: r.accountId, pixKeyWithdraw: null } },
                  {
                    note: 'pixKeyWithdraw é null: defina a chave de saque antes de sacar',
                  },
                ),
              ]
            : !r.balance
              ? [
                  api(
                    `GET /api/v1/account/${r.accountId}`,
                    {
                      account: {
                        accountId: r.accountId,
                        balance: { total: 0, available: 0, blocked: 0 },
                      },
                    },
                    { note: 'saldo zerado: nada para sacar' },
                  ),
                ]
              : null,
        apply: (r) => ({
          ...r,
          lastWithdraw: r.balance,
          withdrawn: r.withdrawn + r.balance,
          balance: 0,
        }),
        log: (r) => [
          api(`POST /api/v1/account/${r.accountId}/withdraw`, {
            withdraw: {
              account: {
                accountId: r.accountId,
                balance: { total: 0, available: 0, blocked: 0 },
              },
              transaction: { endToEndId: endToEndId(), value: r.lastWithdraw },
            },
          }),
        ],
      },
      {
        id: 'close',
        label: 'Encerrar campanha',
        from: ['ARRECADANDO'],
        to: 'ENCERRADA',
        transition: 'close',
        log: (r) => [
          api(`DELETE /api/v1/pix-keys/${r.key}`, null, {
            code: 204,
            note: 'sem a chave, não entra mais dinheiro',
          }),
        ],
      },
    ],
    summary: (r) => [
      ['chave', `${r.key} (${r.type})`],
      ['doações', String(r.donations)],
      ['saldo da conta', brl(r.balance)],
      ['já sacado', brl(r.withdrawn)],
    ],
    explain: {
      NONE: 'Envie a requisição com o AppID da conta criada para a campanha.',
      ARRECADANDO:
        'Receba doações, defina a chave de saque e saque quando quiser.',
      ENCERRADA: 'A chave foi apagada. O saldo restante ainda pode ser sacado.',
    },
  },
};
