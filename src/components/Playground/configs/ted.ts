import type { PlaygroundConfig, Resource } from '../types';
import { api, brl, hook, json, now } from '../utils';

import { A, handlerTabs } from './shared';

const party = (
  name: string,
  doc: string,
  ispb: string,
  branch: string,
  account: string,
) => ({
  account: { branch, account, accountType: 'CACC' },
  psp: { id: ispb },
  holder: {
    name,
    taxID: { taxID: doc, type: doc.length > 11 ? 'BR:CNPJ' : 'BR:CPF' },
  },
});

const nuop = () =>
  '12345678' +
  new Date().toISOString().slice(0, 10).replace(/-/g, '') +
  String((Math.random() * 1e6) | 0).padStart(6, '0');

export const ted: PlaygroundConfig = {
  id: 'ted',
  title: 'TED',
  lede: 'Envie uma TED com POST /api/v1/ted e acompanhe a confirmação pelo STR. O correlationID é a chave de idempotência e tem no máximo 20 caracteres.',
  docs: [
    { label: 'Primeiros passos', href: '/docs/ted/ted-api-getting-started' },
    { label: 'Enviar TED', href: '/docs/ted/ted-send-api' },
    { label: 'Ciclo de vida', href: '/docs/ted/ted-lifecycle' },
    { label: 'Webhooks', href: '/docs/ted/ted-webhooks' },
  ],
  actors: [
    A.you,
    A.woovi,
    { id: 'str', title: 'STR', sub: 'Banco Central' },
    { id: 'dest', title: 'Banco destino', sub: 'favorecido' },
  ],
  scenarios: [
    {
      id: 'ok',
      label: 'Confirmada',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/ted',
          kind: 'req',
          title: 'Peça a TED',
          text: 'O receiver leva name, document (só dígitos), ispb (8 dígitos), agency, account e accountType.',
          code: json({
            correlationID: 'payout-20261001-1',
            value: 150050,
            receiver: {
              name: 'Joao da Silva',
              document: '12345678901',
              ispb: '87654321',
              agency: 4321,
              account: 98765,
              accountType: 'CACC',
            },
          }),
          callout: {
            tone: 'warn',
            text: 'correlationID com mais de 20 caracteres, ou um UUID, é recusado com 400.',
          },
        },
        {
          note: 'woovi',
          label: 'PENDING → PROCESSING: debita e envia ao STR',
          title: 'A Woovi debita o saldo',
          text: 'Esta transição não gera webhook. O POST normalmente já responde em PROCESSING.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · status PROCESSING · nuop',
          kind: 'res',
          title: 'TED a caminho',
          code: json({
            ted: {
              correlationID: 'payout-20261001-1',
              nuop: '1234567820261001000001',
              status: 'PROCESSING',
              type: 'TED_OUT',
              value: 150050,
            },
          }),
        },
        {
          from: 'woovi',
          to: 'str',
          label: 'mensagem STR',
          title: 'A TED entra no STR',
        },
        {
          from: 'str',
          to: 'dest',
          label: 'crédito ao favorecido',
          title: 'O banco destino credita',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook TED_OUT_CONFIRMED',
          kind: 'evt',
          title: 'Confirmada',
          text: 'O payload traz o mesmo objeto ted do GET, agora COMPLETED.',
          code: json({
            event: 'TED_OUT_CONFIRMED',
            ted: {
              correlationID: 'payout-20261001-1',
              status: 'COMPLETED',
              type: 'TED_OUT',
              value: 150050,
            },
          }),
        },
      ],
    },
    {
      id: 'rejected',
      label: 'Rejeitada',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/ted',
          kind: 'req',
          title: 'Peça a TED',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · PROCESSING',
          kind: 'res',
          title: 'TED a caminho',
        },
        {
          from: 'woovi',
          to: 'str',
          label: 'mensagem STR',
          title: 'A TED entra no STR',
        },
        {
          from: 'str',
          to: 'woovi',
          label: 'rejeitada',
          bad: true,
          title: 'O destino recusa',
          text: 'Por exemplo RECEIVER_ACCOUNT_NOT_FOUND, RECEIVER_ACCOUNT_CLOSED ou STR_REJECTED. Compare o errorCode, nunca o texto.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook TED_OUT_REJECTED',
          kind: 'evt',
          title: 'Rejeitada e estornada',
          text: 'O débito é revertido. errorCode e reason explicam o motivo.',
          code: json({
            event: 'TED_OUT_REJECTED',
            ted: {
              correlationID: 'payout-20261001-1',
              status: 'FAILED',
              errorCode: 'INSUFFICIENT_BALANCE',
              reason: 'Saldo insuficiente',
            },
          }),
          callout: {
            text: 'Uma TED FAILED não é reenviada com o mesmo correlationID: a API devolve a TED existente. Use um ID novo.',
          },
        },
      ],
    },
    {
      id: 'outside',
      label: 'Fora da janela do STR',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/ted',
          kind: 'req',
          title: 'Pedido fora do horário',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '422 OUTSIDE_STR_SESSION',
          kind: 'res',
          bad: true,
          title: 'O STR está fechado',
          text: 'A TED liquida no mesmo dia (horário de Brasília) e não pode ser agendada. Nada foi criado.',
          callout: {
            text: 'Como o erro veio antes de criar a TED, você pode tentar de novo com o mesmo correlationID quando o STR abrir.',
          },
        },
      ],
    },
    {
      id: 'refund',
      label: 'Devolvida',
      steps: [
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook TED_OUT_CONFIRMED',
          kind: 'evt',
          title: 'A TED foi confirmada',
          text: 'Status COMPLETED.',
        },
        {
          from: 'dest',
          to: 'str',
          label: 'devolução da TED',
          title: 'O banco destino devolve',
          text: 'Sempre pelo valor total.',
        },
        {
          from: 'str',
          to: 'woovi',
          label: 'TED de devolução',
          title: 'A devolução chega',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook TED_REFUND_RECEIVED_CONFIRMED',
          kind: 'evt',
          title: 'A TED original vira REFUNDED',
          text: 'O payload traz a TED de devolução (type TED_REFUND_RECEIVED). REFUNDED é final.',
        },
      ],
    },
  ],
  statesTitle: 'Os estados de uma TED_OUT',
  statesLede:
    'SCHEDULED existe no enum mas está reservado e não é usado. COMPLETED ainda pode virar REFUNDED se o destino devolver.',
  states: [
    { id: 'PENDING', sub: 'criada', x: 150, y: 100 },
    { id: 'PROCESSING', sub: 'debitada · no STR', x: 400, y: 0 },
    { id: 'COMPLETED', sub: 'confirmada', x: 660, y: 0 },
    {
      id: 'REFUNDED',
      sub: 'devolvida · final',
      x: 900,
      y: 0,
      terminal: true,
      tone: 'muted',
    },
    {
      id: 'FAILED',
      sub: 'rejeitada · estornada · final',
      x: 530,
      y: 200,
      terminal: true,
      tone: 'bad',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'PENDING', label: 'POST /ted' },
    { id: 'send', from: 'PENDING', to: 'PROCESSING', label: 'debita e envia' },
    {
      id: 'early-fail',
      from: 'PENDING',
      to: 'FAILED',
      label: 'TED_OUT_REJECTED',
      sourceHandle: 'b',
    },
    {
      id: 'confirm',
      from: 'PROCESSING',
      to: 'COMPLETED',
      label: 'TED_OUT_CONFIRMED',
    },
    {
      id: 'reject',
      from: 'PROCESSING',
      to: 'FAILED',
      label: 'TED_OUT_REJECTED',
      sourceHandle: 'b',
      targetHandle: 't',
    },
    {
      id: 'refund',
      from: 'COMPLETED',
      to: 'REFUNDED',
      label: 'REFUND_RECEIVED',
    },
  ],
  lab: {
    title: 'TED',
    method: 'POST',
    path: '/api/v1/ted',
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'value',
        label: 'Valor',
        api: 'value',
        type: 'cents',
        default: 150050,
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'text',
        default: 'payout-20261001-1',
        hint: 'até 20 caracteres, sem espaços. Teste um UUID.',
      },
      {
        id: 'name',
        label: 'Favorecido',
        api: 'receiver.name',
        type: 'text',
        default: 'Joao da Silva',
      },
      {
        id: 'document',
        label: 'CPF/CNPJ',
        api: 'receiver.document',
        type: 'text',
        default: '12345678901',
        hint: 'só dígitos',
      },
      {
        id: 'ispb',
        label: 'ISPB do banco',
        api: 'receiver.ispb',
        type: 'text',
        default: '87654321',
        hint: '8 dígitos',
      },
      {
        id: 'accountType',
        label: 'Tipo de conta',
        api: 'receiver.accountType',
        type: 'select',
        default: 'CACC',
        options: [
          { value: 'CACC', label: 'CACC · conta corrente' },
          { value: 'SVGS', label: 'SVGS · poupança' },
          { value: 'SLRY', label: 'SLRY · salário' },
        ],
      },
      {
        id: 'agency',
        label: 'Agência',
        api: 'receiver.agency',
        type: 'number',
        default: 4321,
        hint: 'sem dígito',
      },
      {
        id: 'account',
        label: 'Conta',
        api: 'receiver.account',
        type: 'number',
        default: 98765,
      },
    ],
    body: (v) => ({
      correlationID: v.correlationID,
      value: v.value,
      receiver: {
        name: v.name,
        document: v.document,
        ispb: v.ispb,
        agency: v.agency,
        account: v.account,
        accountType: v.accountType,
      },
      clientFinality: 10,
    }),
    createTransition: 'send',
    create: (v) => {
      const cid = String(v.correlationID);
      if (cid.length > 20 || /\s/.test(cid))
        return {
          log: [
            api(
              'POST /api/v1/ted',
              {
                error: 'correlationID inválido',
                errorCode: 'INVALID_REQUEST_BODY',
              },
              {
                code: 400,
                note: 'até 20 caracteres, sem espaços. Erro antes de criar: corrija e reenvie com o mesmo ID.',
              },
            ),
          ],
        };
      if (!/^\d{8}$/.test(String(v.ispb)))
        return {
          log: [
            api(
              'POST /api/v1/ted',
              {
                error: 'receiver.ispb deve ter 8 dígitos',
                errorCode: 'INVALID_REQUEST_BODY',
              },
              { code: 400 },
            ),
          ],
        };
      const r: Resource = {
        status: 'PROCESSING',
        correlationID: cid,
        nuop: nuop(),
        type: 'TED_OUT',
        value: v.value,
        moveDate: now().slice(0, 10),
        creditParty: party(
          v.name,
          v.document,
          v.ispb,
          String(v.agency),
          String(v.account),
        ),
      };
      return {
        resource: r,
        log: [
          api(
            'POST /api/v1/ted',
            {
              ted: {
                ...r,
                debitParty: party(
                  'Empresa LTDA',
                  '12345678000199',
                  '12345678',
                  '1234',
                  '567890',
                ),
                errorCode: null,
                reason: null,
                createdAt: now(),
              },
            },
            {
              note: 'PENDING → PROCESSING acontece antes da resposta e não gera webhook',
            },
          ),
        ],
      };
    },
    actions: [
      {
        id: 'confirm',
        label: 'STR confirma',
        primary: true,
        from: ['PROCESSING'],
        to: 'COMPLETED',
        transition: 'confirm',
        log: (r) => [
          hook('TED_OUT_CONFIRMED', {
            ted: {
              correlationID: r.correlationID,
              nuop: r.nuop,
              status: 'COMPLETED',
              type: 'TED_OUT',
              value: r.value,
            },
          }),
        ],
      },
      {
        id: 'reject',
        label: 'Destino rejeita',
        from: ['PROCESSING'],
        to: 'FAILED',
        transition: 'reject',
        log: (r) => [
          hook(
            'TED_OUT_REJECTED',
            {
              ted: {
                correlationID: r.correlationID,
                status: 'FAILED',
                type: 'TED_OUT',
                value: r.value,
                errorCode: 'RECEIVER_ACCOUNT_NOT_FOUND',
                reason: 'Conta recebedora não encontrada',
              },
            },
            { note: 'o débito é revertido' },
          ),
        ],
      },
      {
        id: 'refund',
        label: 'Destino devolve',
        from: ['COMPLETED'],
        to: 'REFUNDED',
        transition: 'refund',
        log: (r) => [
          hook(
            'TED_REFUND_RECEIVED_CONFIRMED',
            {
              ted: {
                correlationID: 'RFD' + r.nuop.slice(8, 22),
                type: 'TED_REFUND_RECEIVED',
                status: 'COMPLETED',
                value: r.value,
              },
            },
            { note: `a TED ${r.correlationID} passa a REFUNDED` },
          ),
        ],
      },
    ],
    summary: (r) => [
      ['valor', brl(r.value)],
      ['correlationID', r.correlationID],
      ['nuop', r.nuop],
      [
        'favorecido',
        `${r.creditParty.holder.name} · ISPB ${r.creditParty.psp.id}`,
      ],
    ],
    explain: {
      NONE: 'Envie a requisição. Troque o correlationID por um UUID para ver a validação.',
      PROCESSING: 'A TED está no STR. Escolha o desfecho.',
      COMPLETED: 'Confirmada. Ela ainda pode ser devolvida pelo banco destino.',
      FAILED:
        'Reenviar com o mesmo correlationID devolve esta TED FAILED. Para tentar de novo, use um ID novo.',
      REFUNDED: 'Final. O valor voltou para a sua conta.',
    },
    handler: handlerTabs(
      `// entrega at-least-once e fora de ordem: deduplique por event + correlationID
const key = \`\${data.event}:\${data.ted.correlationID}\`;
if (await db.processed.exists(key)) return res.sendStatus(200);

if (data.event === 'TED_OUT_CONFIRMED') await db.payouts.markPaid(data.ted.correlationID);
if (data.event === 'TED_OUT_REJECTED') await db.payouts.markFailed(data.ted.correlationID, data.ted.errorCode);

await db.processed.add(key);`,
      `$key = $data['event'] . ':' . $data['ted']['correlationID'];
// guarde $key para ignorar entregas repetidas`,
    ),
  },
};
