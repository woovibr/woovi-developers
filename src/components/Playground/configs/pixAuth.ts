import type { PlaygroundConfig, Resource } from '../types';
import { addSeconds, api, buildBrCode, hex, hook, json, now } from '../utils';

import { A, handlerTabs } from './shared';

const digits = (s: string) => String(s).replace(/\D/g, '');

export const pixAuth: PlaygroundConfig = {
  id: 'pix-auth',
  title: 'Pix Auth',
  lede: 'Confirme que uma pessoa é dona do CPF ou CNPJ informado: ela paga um Pix de R$ 0,01 de uma conta no próprio documento, a Woovi compara e devolve o centavo. Decida pelo campo result, não pelo status.',
  docs: [
    {
      label: 'Primeiros passos',
      href: '/docs/pix-auth/pix-auth-getting-started',
    },
    { label: 'Webhooks', href: '/docs/pix-auth/pix-auth-webhooks' },
  ],
  actors: [
    { id: 'cli', title: 'Usuário', sub: 'no cadastro' },
    A.you,
    A.woovi,
    A.bank,
  ],
  scenarios: [
    {
      id: 'matched',
      label: 'Documento confere',
      steps: [
        {
          from: 'cli',
          to: 'you',
          label: 'Informa CPF no cadastro',
          title: 'O usuário diz quem é',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/pix-auth',
          kind: 'req',
          title: 'Peça a verificação',
          code: json({
            correlationID: 'signup-8f2c1',
            taxID: '529.982.247-25',
            name: 'Maria Silva',
            expiresIn: 900,
            returnUrl: 'https://example.com/signup/done',
          }),
          callout: {
            text: 'Cada Pix Auth novo cobra a tarifa PIX_AUTH_FEE de R$ 1,00 da sua conta.',
          },
        },
        {
          from: 'woovi',
          to: 'you',
          label: '201 · ACTIVE · UNVERIFIED · brCode',
          kind: 'res',
          title: 'brCode e hostedUrl',
          code: json({
            pixAuth: {
              id: '6abd253902a0cbc48013f01e',
              correlationID: 'signup-8f2c1',
              status: 'ACTIVE',
              result: 'UNVERIFIED',
              amount: 1,
            },
            brCode: '00020101021226870014br.gov.bcb.pix…',
            hostedUrl: 'https://pix-auth.woovi.com/B-hDJDdV…',
          }),
        },
        {
          from: 'you',
          to: 'cli',
          label: 'Mostra QR ou abre hostedUrl',
          title: 'O usuário vê o Pix de R$ 0,01',
          text: 'Mostre o brCode ou redirecione (ou abra num iframe) o hostedUrl, com ?lang=en ou ?lang=pt-BR.',
        },
        {
          from: 'cli',
          to: 'bank',
          label: 'Paga R$ 0,01',
          title: 'O usuário paga do próprio banco',
        },
        {
          from: 'bank',
          to: 'woovi',
          label: 'Pix com o documento do pagador',
          title: 'O banco informa quem pagou',
          text: 'A Woovi compara o documento do pagador com o declarado.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook PIX_AUTH_COMPLETED · MATCHED',
          kind: 'evt',
          title: 'Confere',
          code: json({
            event: 'PIX_AUTH_COMPLETED',
            pixAuth: {
              id: '6abd253902a0cbc48013f01e',
              correlationID: 'signup-8f2c1',
              status: 'COMPLETED',
              result: 'MATCHED',
              taxID: { taxID: '52998224725', type: 'BR:CPF' },
            },
          }),
        },
        {
          from: 'woovi',
          to: 'cli',
          label: 'Devolve R$ 0,01',
          title: 'O centavo volta',
          text: 'A devolução acontece seja qual for o resultado.',
        },
      ],
    },
    {
      id: 'mismatch',
      label: 'Outra pessoa paga',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/pix-auth',
          kind: 'req',
          title: 'Peça a verificação',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '201 · brCode',
          kind: 'res',
          title: 'brCode e hostedUrl',
        },
        {
          from: 'cli',
          to: 'bank',
          label: 'Paga de uma conta de terceiro',
          title: 'O documento não bate',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook PIX_AUTH_COMPLETED · MISMATCH',
          kind: 'evt',
          bad: true,
          title: 'Não confere',
          text: 'status é COMPLETED, mas result é MISMATCH. Por isso a decisão é pelo result.',
          callout: {
            tone: 'warn',
            text: 'A Woovi nunca devolve o nome ou documento de quem pagou. taxID é sempre o que você declarou.',
          },
        },
      ],
    },
    {
      id: 'expired',
      label: 'Expirou',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/pix-auth',
          kind: 'req',
          title: 'Peça a verificação',
        },
        {
          note: 'woovi',
          label: 'expiresIn esgota (60 a 3600 s)',
          title: 'Ninguém pagou',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook PIX_AUTH_EXPIRED',
          kind: 'evt',
          title: 'Expirado',
          code: json({
            event: 'PIX_AUTH_EXPIRED',
            pixAuth: {
              correlationID: 'signup-8f2c1',
              status: 'EXPIRED',
              result: 'UNVERIFIED',
            },
          }),
          callout: {
            text: 'Para tentar de novo, crie outro Pix Auth com outro correlationID. O antigo devolve 409.',
          },
        },
      ],
    },
  ],
  statesTitle: 'status e result andam juntos',
  statesLede:
    'COMPLETED tem dois desfechos: MATCHED e MISMATCH. Os nós do mapa mostram o result; o status fica no subtítulo.',
  states: [
    { id: 'ACTIVE', sub: 'result UNVERIFIED', x: 150, y: 140 },
    {
      id: 'MATCHED',
      sub: 'status COMPLETED · final',
      x: 450,
      y: 0,
      terminal: true,
    },
    {
      id: 'MISMATCH',
      sub: 'status COMPLETED · final',
      x: 450,
      y: 95,
      terminal: true,
      tone: 'bad',
    },
    {
      id: 'EXPIRED',
      sub: 'UNVERIFIED · final',
      x: 450,
      y: 190,
      terminal: true,
      tone: 'muted',
    },
    {
      id: 'FAILED',
      sub: 'UNVERIFIED · final',
      x: 450,
      y: 285,
      terminal: true,
      tone: 'muted',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'ACTIVE', label: 'POST /pix-auth' },
    { id: 'match', from: 'ACTIVE', to: 'MATCHED', label: 'PIX_AUTH_COMPLETED' },
    {
      id: 'mismatch',
      from: 'ACTIVE',
      to: 'MISMATCH',
      label: 'PIX_AUTH_COMPLETED',
    },
    { id: 'expire', from: 'ACTIVE', to: 'EXPIRED', label: 'PIX_AUTH_EXPIRED' },
    {
      id: 'fail',
      from: 'ACTIVE',
      to: 'FAILED',
      label: 'sem webhook documentado',
    },
  ],
  lab: {
    title: 'Pix Auth',
    method: 'POST',
    path: '/api/v1/pix-auth',
    idempotencyField: 'correlationID',
    stateOf: (r) => (r.status === 'COMPLETED' ? r.result : r.status),
    fields: [
      {
        id: 'taxID',
        label: 'CPF ou CNPJ',
        api: 'taxID',
        type: 'text',
        default: '529.982.247-25',
        hint: 'com ou sem pontuação',
      },
      {
        id: 'name',
        label: 'Nome',
        api: 'name',
        type: 'text',
        default: 'Maria Silva',
        hint: 'aparece como devedor do Pix',
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'id',
        default: 'uuid',
      },
      {
        id: 'expiresIn',
        label: 'Expira em',
        api: 'expiresIn',
        type: 'select',
        default: '900',
        options: [
          { value: '60', label: '1 minuto (60 s)' },
          { value: '900', label: '15 minutos (900 s)' },
          { value: '3600', label: '1 hora (3600 s)' },
        ],
      },
      {
        id: 'returnUrl',
        label: 'URL de retorno',
        api: 'returnUrl',
        type: 'text',
        default: 'https://example.com/signup/done',
        hint: 'precisa ser https',
        wide: true,
      },
    ],
    body: (v) => ({
      correlationID: v.correlationID,
      taxID: v.taxID,
      name: v.name,
      expiresIn: Number(v.expiresIn),
      ...(v.returnUrl ? { returnUrl: v.returnUrl } : {}),
    }),
    createTransition: 'create',
    replay: (r, v) =>
      r.status === 'ACTIVE' && digits(v.taxID) === r.taxID.taxID
        ? [
            api(
              'POST /api/v1/pix-auth',
              {
                pixAuth: { id: r.id, status: 'ACTIVE' },
                brCode: r.brCode,
                hostedUrl: r.hostedUrl,
              },
              {
                note: 'mesmo correlationID e taxID enquanto ACTIVE: mesmo brCode, sem nova tarifa',
              },
            ),
          ]
        : [
            api(
              'POST /api/v1/pix-auth',
              {
                error:
                  'correlationID already used by another Pix authentication',
                code: 'CORRELATION_ID_ALREADY_USED',
              },
              {
                code: 409,
                note: 'correlationID já usado por outro documento ou num estado final',
              },
            ),
          ],
    create: (v) => {
      const doc = digits(v.taxID);
      if (doc.length !== 11 && doc.length !== 14)
        return {
          log: [
            api(
              'POST /api/v1/pix-auth',
              { error: 'taxID inválido' },
              {
                code: 400,
                note: 'CPF/CNPJ inválido não é cobrado; o texto do erro é ilustrativo',
              },
            ),
          ],
        };
      if (v.returnUrl && !String(v.returnUrl).startsWith('https://'))
        return {
          log: [
            api(
              'POST /api/v1/pix-auth',
              { error: 'returnUrl must be https' },
              { code: 400, note: 'o texto do erro é ilustrativo' },
            ),
          ],
        };
      const id = hex(24);
      const token = hex(32);
      const r: Resource = {
        id,
        status: 'ACTIVE',
        result: 'UNVERIFIED',
        correlationID: v.correlationID,
        taxID: { taxID: doc, type: doc.length === 11 ? 'BR:CPF' : 'BR:CNPJ' },
        amount: 1,
        dueDate: addSeconds(Number(v.expiresIn)),
        createdAt: now(),
        brCode: buildBrCode({
          url: 'qr.woovi.com/qr/v2/cob/' + token.slice(0, 20),
          value: 1,
          name: (v.name || 'Pix Auth').toUpperCase(),
          city: 'SAO PAULO',
          txid: token,
        }),
        hostedUrl: 'https://pix-auth.woovi.com/' + token,
      };
      const { brCode, hostedUrl, ...pixAuth } = r;
      return {
        resource: r,
        log: [
          api(
            'POST /api/v1/pix-auth',
            { pixAuth, brCode, hostedUrl },
            {
              code: 201,
              note: 'tarifa PIX_AUTH_FEE (R$ 1,00) cobrada uma vez',
            },
          ),
        ],
      };
    },
    actions: [
      {
        id: 'match',
        label: 'Titular paga',
        primary: true,
        from: ['ACTIVE'],
        to: 'COMPLETED',
        transition: 'match',
        apply: (r) => ({ ...r, result: 'MATCHED', completedAt: now() }),
        log: (r) => [
          hook(
            'PIX_AUTH_COMPLETED',
            {
              pixAuth: {
                id: r.id,
                correlationID: r.correlationID,
                status: 'COMPLETED',
                result: 'MATCHED',
                taxID: r.taxID,
                completedAt: r.completedAt,
              },
            },
            { note: 'R$ 0,01 devolvido ao pagador' },
          ),
        ],
      },
      {
        id: 'mismatch',
        label: 'Outra pessoa paga',
        from: ['ACTIVE'],
        to: 'COMPLETED',
        transition: 'mismatch',
        apply: (r) => ({ ...r, result: 'MISMATCH', completedAt: now() }),
        log: (r) => [
          hook(
            'PIX_AUTH_COMPLETED',
            {
              pixAuth: {
                id: r.id,
                correlationID: r.correlationID,
                status: 'COMPLETED',
                result: 'MISMATCH',
                taxID: r.taxID,
                completedAt: r.completedAt,
              },
            },
            { note: 'R$ 0,01 devolvido ao pagador' },
          ),
        ],
      },
      {
        id: 'expire',
        label: 'Deixar expirar',
        from: ['ACTIVE'],
        to: 'EXPIRED',
        transition: 'expire',
        log: (r) => [
          hook('PIX_AUTH_EXPIRED', {
            pixAuth: {
              id: r.id,
              correlationID: r.correlationID,
              status: 'EXPIRED',
              result: 'UNVERIFIED',
              taxID: r.taxID,
              expiredAt: now(),
            },
          }),
        ],
      },
    ],
    summary: (r) => [
      ['status · result', `${r.status} · ${r.result}`],
      ['taxID', `${r.taxID.taxID} (${r.taxID.type})`],
      ['correlationID', r.correlationID],
      ['hostedUrl', r.hostedUrl],
    ],
    qr: (r) => (r.status === 'ACTIVE' ? r.brCode : undefined),
    explain: {
      NONE: 'Envie a requisição. Teste um CPF com menos dígitos ou uma returnUrl http.',
      ACTIVE:
        'Reenvie o mesmo correlationID para ver a idempotência. Mude o CPF e reenvie para ver o 409.',
      COMPLETED:
        'Aprove o cadastro só com result MATCHED, lido do webhook ou do GET. O postMessage da página hospedada pode ser forjado.',
      EXPIRED: 'Crie um novo Pix Auth com outro correlationID.',
    },
    handler: handlerTabs(
      `if (data.event === 'PIX_AUTH_COMPLETED') {
  // decida pelo result, nunca só pelo status
  const verified = data.pixAuth.result === 'MATCHED';
  await db.signups.updateOne(
    { correlationID: data.pixAuth.correlationID },
    { $set: { identityVerified: verified, pixAuthId: data.pixAuth.id } },
  );
}

if (data.event === 'PIX_AUTH_EXPIRED') {
  await db.signups.updateOne({ correlationID: data.pixAuth.correlationID }, { $set: { identityVerified: false } });
}`,
      `if ($data['event'] === 'PIX_AUTH_COMPLETED') {
  $verified = $data['pixAuth']['result'] === 'MATCHED';
  // atualize o cadastro pelo correlationID
}`,
    ),
  },
};
