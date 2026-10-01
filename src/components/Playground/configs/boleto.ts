import type { PlaygroundConfig, Resource } from '../types';
import {
  api,
  brl,
  chargeBrCode,
  hex,
  hook,
  json,
  now,
  addDays,
} from '../utils';

import { A, company, handlerTabs } from './shared';

const digitable = () =>
  '34191' + Array.from({ length: 42 }, () => (Math.random() * 10) | 0).join('');

export const boleto: PlaygroundConfig = {
  id: 'boleto',
  title: 'Boleto',
  lede: 'Um boleto da Woovi é uma cobrança com type BOLETO: o mesmo POST /api/v1/charge, com endereço completo do cliente, que também gera um Pix. Pagamento e liquidação são eventos diferentes.',
  docs: [
    { label: 'Boleto via API', href: '/docs/boleto/boleto' },
    { label: 'Webhooks do boleto', href: '/docs/boleto/boleto-webhook' },
    { label: 'Conciliação', href: '/docs/boleto/boleto-reconciliation' },
    {
      label: 'Prazo de confirmação',
      href: '/docs/boleto/boleto-prazo-confirmacao',
    },
  ],
  actors: [
    A.cli,
    A.you,
    A.woovi,
    { id: 'bank', title: 'Banco / lotérica', sub: 'compensação' },
  ],
  scenarios: [
    {
      id: 'settled',
      label: 'Pago e liquidado',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/charge · type BOLETO',
          kind: 'req',
          title: 'Crie a cobrança do tipo boleto',
          text: 'O customer precisa de name, taxID e endereço completo: street, number, zipcode, neighborhood, city e state.',
          code: json({
            correlationID: 'pedido-1042',
            value: 35000,
            type: 'BOLETO',
            customer: {
              name: 'Dan',
              taxID: '31324227036',
              address: {
                street: 'Av. Paulista',
                number: '1000',
                zipcode: '01310100',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
              },
            },
          }),
          callout: {
            tone: 'warn',
            text: 'Faltou um campo do endereço? A criação falha, por exemplo com "O código do estado do cliente é obrigatório".',
          },
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · boleto CREATED + Pix ACTIVE',
          kind: 'res',
          title: 'Boleto e Pix na mesma cobrança',
          text: 'paymentMethods.boleto traz a linha digitável e o código de barras. paymentMethods.pix traz o brCode.',
          code: json({
            charge: {
              status: 'ACTIVE',
              type: 'BOLETO',
              paymentMethods: {
                boleto: {
                  status: 'CREATED',
                  boletoDigitable:
                    '34191099098962746051539842030007610260000000350',
                  fee: 299,
                },
                pix: { status: 'ACTIVE', brCode: '000201…' },
              },
            },
          }),
        },
        {
          from: 'you',
          to: 'cli',
          label: 'Envia linha digitável + PDF',
          title: 'O cliente recebe o boleto',
        },
        {
          from: 'cli',
          to: 'bank',
          label: 'Paga o boleto',
          title: 'O cliente paga',
          text: 'No app do banco ou na lotérica.',
        },
        {
          note: 'bank',
          label: 'confirmação: 1 a 3 dias úteis',
          title: 'A compensação leva dias',
          text: 'Normalmente 1 a 2 dias úteis. Na lotérica, no mínimo 1 dia útil.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook OPENPIX:CHARGE_COMPLETED',
          kind: 'evt',
          title: 'Pagamento confirmado',
          text: 'O payload traz o objeto boleto (e não pix). charge.paidAt é preenchido.',
          code: json({
            event: 'OPENPIX:CHARGE_COMPLETED',
            charge: {
              correlationID: 'pedido-1042',
              status: 'COMPLETED',
              value: 35000,
            },
            boleto: { value: 35000, status: 'COMPLETED', fee: 299 },
          }),
        },
        {
          note: 'woovi',
          label: 'liquidação: até 3 dias úteis (≈ D+3)',
          title: 'O dinheiro ainda não chegou',
          text: 'Pago não é liquidado. O saldo entra na conta na liquidação.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook BOLETO_SETTLED',
          kind: 'evt',
          title: 'Boleto liquidado',
          text: 'boleto.value é o que o pagador pagou: charge.value + finesValue + interestsValue.',
          code: json({
            event: 'BOLETO_SETTLED',
            charge: {
              correlationID: 'pedido-1042',
              value: 35000,
              status: 'COMPLETED',
            },
            boleto: {
              boletoTransactionID: 'btx_019fa55beec9775faf8a069d64dcde54',
              value: 35000,
              status: 'SETTLED',
              settledAt: '2026-10-06T10:00:00.000Z',
              fee: 299,
            },
          }),
          callout: {
            text: 'Libere mercadoria de alto valor em SETTLED, não em COMPLETED.',
          },
        },
      ],
    },
    {
      id: 'late',
      label: 'Pago com juros e multa',
      steps: [
        {
          from: 'you',
          to: 'woovi',
          label: 'POST /api/v1/charge · interests + fines',
          kind: 'req',
          title: 'Juros e multa em basis points',
          text: '100 = 1%. daysAfterDueDate define quantos dias o boleto ainda aceita pagamento depois do vencimento.',
          code: json({
            correlationID: 'pedido-1043',
            value: 242898,
            type: 'BOLETO',
            interests: { value: 100 },
            fines: { value: 200 },
            daysAfterDueDate: 10,
            customer: {
              name: 'Dan',
              taxID: '31324227036',
              address: { '…': 'endereço completo' },
            },
          }),
        },
        {
          from: 'cli',
          to: 'bank',
          label: 'Paga depois do vencimento',
          title: 'O cliente atrasa',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'webhook BOLETO_SETTLED',
          kind: 'evt',
          title: 'Valor pago maior que o original',
          text: 'finesValue e interestsValue só aparecem quando são maiores que zero.',
          code: json({
            event: 'BOLETO_SETTLED',
            charge: { correlationID: 'pedido-1043', value: 242898 },
            boleto: {
              value: 245000,
              status: 'SETTLED',
              finesValue: 1902,
              interestsValue: 200,
            },
          }),
        },
      ],
    },
  ],
  statesTitle: 'O boleto passa por pagamento e liquidação',
  statesLede:
    'Os estados abaixo são de paymentMethods.boleto.status. O charge.status vai de ACTIVE para COMPLETED no pagamento.',
  states: [
    { id: 'CREATED', sub: 'aguardando pagamento', x: 150, y: 90 },
    { id: 'COMPLETED', sub: 'pago · aguardando liquidação', x: 430, y: 0 },
    {
      id: 'SETTLED',
      sub: 'dinheiro na conta · final',
      x: 700,
      y: 0,
      terminal: true,
    },
    {
      id: 'CANCELED',
      sub: 'vencido ou cancelado · final',
      x: 430,
      y: 190,
      terminal: true,
      tone: 'muted',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'CREATED', label: 'POST /charge' },
    {
      id: 'pay',
      from: 'CREATED',
      to: 'COMPLETED',
      label: 'pago → CHARGE_COMPLETED',
    },
    {
      id: 'settle',
      from: 'COMPLETED',
      to: 'SETTLED',
      label: 'D+3 → BOLETO_SETTLED',
    },
    {
      id: 'cancel',
      from: 'CREATED',
      to: 'CANCELED',
      label: 'expirou / cancelado',
      sourceHandle: 'b',
    },
  ],
  lab: {
    title: 'Boleto',
    method: 'POST',
    path: '/api/v1/charge',
    idempotencyField: 'correlationID',
    fields: [
      {
        id: 'value',
        label: 'Valor',
        api: 'value',
        type: 'cents',
        default: 35000,
      },
      {
        id: 'state',
        label: 'UF do cliente',
        api: 'customer.address.state',
        type: 'text',
        default: 'SP',
        hint: 'apague para ver o erro de endereço',
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'id',
        default: 'uuid',
      },
      {
        id: 'name',
        label: 'Nome do cliente',
        api: 'customer.name',
        type: 'text',
        default: 'Dan',
      },
      {
        id: 'taxID',
        label: 'CPF/CNPJ',
        api: 'customer.taxID',
        type: 'text',
        default: '31324227036',
      },
    ],
    body: (v) => ({
      correlationID: v.correlationID,
      value: v.value,
      type: 'BOLETO',
      customer: {
        name: v.name,
        taxID: v.taxID,
        address: {
          street: 'Av. Paulista',
          number: '1000',
          zipcode: '01310100',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: v.state,
        },
      },
    }),
    createTransition: 'create',
    create: (v) => {
      if (!String(v.state).trim())
        return {
          log: [
            api(
              'POST /api/v1/charge',
              { error: 'O código do estado do cliente é obrigatório' },
              { code: 400, note: 'endereço incompleto: nada foi criado' },
            ),
          ],
        };
      const identifier = hex(32);
      const r: Resource = {
        status: 'CREATED',
        chargeStatus: 'ACTIVE',
        correlationID: v.correlationID,
        value: v.value,
        boletoDigitable: digitable(),
        fee: 299,
        expiresDate: addDays(30),
        brCode: chargeBrCode(v.value, identifier),
      };
      return {
        resource: r,
        log: [
          api('POST /api/v1/charge', {
            charge: {
              value: r.value,
              status: 'ACTIVE',
              type: 'BOLETO',
              correlationID: r.correlationID,
              expiresDate: r.expiresDate,
              paymentMethods: {
                boleto: {
                  method: 'BOLETO',
                  status: 'CREATED',
                  value: r.value,
                  fee: r.fee,
                  boletoDigitable: r.boletoDigitable,
                },
                pix: {
                  method: 'PIX_COB',
                  status: 'ACTIVE',
                  value: r.value,
                  brCode: r.brCode,
                },
              },
            },
          }),
        ],
      };
    },
    actions: [
      {
        id: 'pay',
        label: 'Simular pagamento do boleto',
        primary: true,
        from: ['CREATED'],
        to: 'COMPLETED',
        transition: 'pay',
        apply: (r) => ({ ...r, chargeStatus: 'COMPLETED', paidAt: now() }),
        log: (r) => [
          hook(
            'OPENPIX:CHARGE_COMPLETED',
            {
              charge: {
                correlationID: r.correlationID,
                status: 'COMPLETED',
                value: r.value,
                paidAt: r.paidAt,
              },
              boleto: {
                value: r.value,
                status: 'COMPLETED',
                correlationID: r.correlationID,
                boletoDigitable: r.boletoDigitable,
                fee: r.fee,
              },
              company,
            },
            { note: 'na vida real, 1 a 3 dias úteis depois do pagamento' },
          ),
        ],
      },
      {
        id: 'settle',
        label: 'Simular liquidação',
        from: ['COMPLETED'],
        to: 'SETTLED',
        transition: 'settle',
        apply: (r) => ({ ...r, settledAt: now() }),
        log: (r) => [
          hook(
            'BOLETO_SETTLED',
            {
              charge: {
                correlationID: r.correlationID,
                value: r.value,
                status: 'COMPLETED',
              },
              boleto: {
                boletoTransactionID: 'btx_' + hex(32),
                value: r.value,
                status: 'SETTLED',
                fee: r.fee,
                settledAt: r.settledAt,
              },
            },
            { note: 'até 3 dias úteis depois do pagamento' },
          ),
        ],
      },
      {
        id: 'cancel',
        label: 'Simular vencimento',
        from: ['CREATED'],
        to: 'CANCELED',
        transition: 'cancel',
        log: (r) => [
          api(
            `GET /api/v1/charge/${r.correlationID}`,
            {
              charge: {
                correlationID: r.correlationID,
                paymentMethods: { boleto: { status: 'CANCELED' } },
              },
            },
            {
              note: 'os docs não listam um webhook de boleto cancelado: confira pela API',
            },
          ),
        ],
      },
    ],
    summary: (r) => [
      ['valor', brl(r.value)],
      ['charge.status', r.chargeStatus],
      ['linha digitável', r.boletoDigitable],
      ['tarifa', brl(r.fee)],
      ...(r.settledAt
        ? ([['settledAt', new Date(r.settledAt).toLocaleString('pt-BR')]] as [
            string,
            string,
          ][])
        : []),
    ],
    qr: (r) => (r.status === 'CREATED' ? r.brCode : undefined),
    explain: {
      NONE: 'Envie a requisição. Apague a UF para ver a validação de endereço.',
      CREATED:
        'O QR Code ao lado é o Pix da mesma cobrança: o cliente pode pagar por qualquer um dos dois.',
      COMPLETED: 'Pago, mas o dinheiro ainda não entrou. Simule a liquidação.',
      SETTLED: 'Liquidado. Este é o momento seguro para liberar a mercadoria.',
      CANCELED: 'Boleto vencido ou cancelado não volta a aceitar pagamento.',
    },
    handler: handlerTabs(
      `if (data.event === 'OPENPIX:CHARGE_COMPLETED' && data.boleto) {
  // pago, ainda não liquidado
  await db.orders.updateOne(
    { correlationID: data.charge.correlationID, status: 'PENDING' },
    { $set: { status: 'PAID' } },
  );
}

if (data.event === 'BOLETO_SETTLED') {
  // dinheiro na conta: libere a mercadoria
  await db.orders.updateOne(
    { correlationID: data.charge.correlationID, status: { $ne: 'SETTLED' } },
    { $set: { status: 'SETTLED', paidValue: data.boleto.value, settledAt: data.boleto.settledAt } },
  );
}`,
      `if ($data['event'] === 'BOLETO_SETTLED') {
  $stmt = $pdo->prepare("UPDATE orders SET status = 'SETTLED' WHERE correlation_id = ? AND status <> 'SETTLED'");
  $stmt->execute([$data['charge']['correlationID']]);
}`,
    ),
  },
};
