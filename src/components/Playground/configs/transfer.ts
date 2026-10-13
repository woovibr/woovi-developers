import type { PlaygroundConfig, Resource } from '../types';
import { api, brl, json, now } from '../utils';

export const transfer: PlaygroundConfig = {
  id: 'transferencia-interna',
  title: 'Transferência interna',
  lede: 'Mova saldo entre contas Woovi identificadas por chave Pix. A transferência é interna e instantânea: a resposta já é o resultado, sem webhook e sem status intermediário.',
  docs: [
    {
      label: 'Transferir entre contas',
      href: '/docs/transfer/how-to-transfer-values-between-accounts',
    },
    {
      label: 'Transferir entre subcontas',
      href: '/docs/subaccount/how-to-make-a-transfer-between-subaccounts',
    },
    {
      label: 'Movimentando saldo (BaaS)',
      href: '/docs/baas/movimentando-saldo',
    },
  ],
  actors: [
    { id: 'you', title: 'Seu sistema', sub: 'backend' },
    { id: 'woovi', title: 'Woovi', sub: 'api.woovi.com' },
    { id: 'from', title: 'Conta origem', sub: 'fromPixKey' },
    { id: 'to', title: 'Conta destino', sub: 'toPixKey' },
  ],
  scenarios: [
    {
      id: 'accounts',
      label: 'Entre contas',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/transfer',
          kind: 'req',
          title: 'Peça a transferência',
          text: 'As duas pontas são contas Woovi, identificadas pela chave Pix. O recurso precisa ser habilitado.',
          code: json({
            value: 5000,
            fromPixKey: '<CHAVE_PIX_DA_CONTA_ORIGEM>',
            toPixKey: '<CHAVE_PIX_DA_CONTA_DESTINO>',
            correlationID: 'repasse-2026-10-001',
          }),
        },
        { from: 'woovi', to: 'from', label: 'debita', title: 'Sai da origem' },
        {
          from: 'woovi',
          to: 'to',
          label: 'credita',
          title: 'Entra no destino',
          text: 'No mesmo instante, dentro da Woovi.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · transaction',
          kind: 'res',
          title: 'Pronto',
          code: json({
            transaction: {
              value: 5000,
              time: '2026-10-01T15:33:27.165Z',
              correlationID: 'repasse-2026-10-001',
            },
          }),
          callout: {
            text: 'Não há webhook de transferência interna documentado. A resposta 200 é a confirmação.',
          },
        },
      ],
    },
    {
      id: 'subaccounts',
      label: 'Entre subcontas',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/subaccount/transfer',
          kind: 'req',
          title: 'Subcontas da mesma empresa',
          text: 'Aqui o tipo de cada chave também é obrigatório: CPF, CNPJ, EMAIL, PHONE ou RANDOM.',
          code: json({
            value: 65,
            fromPixKey: 'pixKey@pixKey.com',
            fromPixKeyType: 'EMAIL',
            toPixKey: 'mediator@pixKey.com',
            toPixKeyType: 'EMAIL',
          }),
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · saldos das duas subcontas',
          kind: 'res',
          title: 'Saldos atualizados',
          text: 'Subcontas são virtuais: o dinheiro só sai da conta principal num saque.',
        },
      ],
    },
  ],
  lab: {
    title: 'Transferência',
    method: 'POST',
    path: '/api/v1/transfer',
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'value',
        label: 'Valor',
        api: 'value',
        type: 'cents',
        default: 5000,
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'text',
        default: 'repasse-2026-10-001',
        hint: 'opcional, mas evita transferência duplicada',
      },
      {
        id: 'fromPixKey',
        label: 'Chave da origem',
        api: 'fromPixKey',
        type: 'text',
        default: 'financeiro@loja.com.br',
      },
      {
        id: 'toPixKey',
        label: 'Chave do destino',
        api: 'toPixKey',
        type: 'text',
        default: 'filial-sul@loja.com.br',
        hint: 'repita a origem para ver o erro',
      },
    ],
    body: (v) => ({
      value: v.value,
      fromPixKey: v.fromPixKey,
      toPixKey: v.toPixKey,
      ...(v.correlationID ? { correlationID: v.correlationID } : {}),
    }),
    createTransition: '',
    create: (v) => {
      if (v.fromPixKey === v.toPixKey)
        return {
          log: [
            api(
              'POST /api/v1/transfer',
              { error: 'Origem e destino precisam ser contas diferentes' },
              {
                code: 400,
                note: 'erros voltam como 400 { error }; o texto exato não está documentado',
              },
            ),
          ],
        };
      const r: Resource = {
        status: 'concluída',
        value: v.value,
        correlationID: v.correlationID,
        from: v.fromPixKey,
        to: v.toPixKey,
        time: now(),
      };
      return {
        resource: r,
        log: [
          api(
            'POST /api/v1/transfer',
            {
              transaction: {
                value: r.value,
                time: r.time,
                correlationID: r.correlationID,
              },
            },
            { note: 'sem webhook: a resposta é a confirmação' },
          ),
        ],
      };
    },
    replay: (r) => [
      api(
        'POST /api/v1/transfer',
        { error: 'correlationID já utilizado' },
        {
          code: 400,
          note: `a API rejeita duplicatas (${r.correlationID} já foi usado); o texto exato não está documentado`,
        },
      ),
    ],
    actions: [],
    summary: (r) => [
      ['valor', brl(r.value)],
      ['de → para', `${r.from} → ${r.to}`],
      ['correlationID', r.correlationID || '—'],
    ],
    explain: {
      NONE: 'Envie a requisição. Depois reenvie com o mesmo correlationID para ver a proteção contra duplicidade.',
      concluída:
        '"concluída" é um rótulo desta página: a resposta da API não tem campo status.',
    },
  },
};
