import type { PlaygroundConfig, Resource, Step } from '../types';
import {
  addSeconds,
  api,
  chargeBrCode,
  endToEndId,
  hex,
  hook,
  json,
  now,
  uuid,
  brl,
} from '../utils';

import ChargeRecipe from '../widgets/ChargeRecipe';

import { A, company, handlerTabs } from './shared';

const sample = {
  value: 5000,
  correlationID: '51b3e0ea-abfc-4a7b-999c-847f27c35add',
};

const start: Step[] = [
  {
    from: 'cli',
    to: 'you',
    label: 'Finaliza o pedido',
    title: 'O cliente fecha o pedido',
    text: 'Seu sistema já tem o ID do pedido. Use esse ID (ou um UUID guardado junto do pedido) como correlationID.',
  },
  {
    from: 'you',
    to: 'woovi',
    label: 'POST /api/v1/charge',
    kind: 'req',
    title: 'Seu backend cria a cobrança',
    text: 'A chamada sai do seu backend, nunca do navegador: o AppID é um segredo.',
    code: json(sample),
    callout: {
      text: 'O correlationID é a chave de idempotência. Se a requisição falhar por rede e você reenviar com o mesmo correlationID, não nasce uma segunda cobrança.',
    },
  },
  {
    from: 'woovi',
    to: 'you',
    label: '200 · status ACTIVE, brCode',
    kind: 'res',
    title: 'A Woovi devolve a cobrança ativa',
    text: 'A cobrança nasce no estado ACTIVE e vale até expiresDate.',
    code: json({
      charge: {
        status: 'ACTIVE',
        value: 5000,
        correlationID: sample.correlationID,
        brCode: '000201010212269000…6304 6A80',
        qrCodeImage: 'https://api.woovi.com/…/brcode/image/….png',
        paymentLinkUrl: 'https://woovi.com/pay/b982c71a-…',
        expiresIn: 86400,
      },
    }),
  },
  {
    from: 'you',
    to: 'cli',
    label: 'Mostra QR Code + copia e cola',
    title: 'O cliente vê o QR Code',
    text: 'Renderize qrCodeImage e um botão que copia brCode. No celular, o copia e cola é o caminho mais usado.',
  },
];

const completedPayload = json({
  event: 'OPENPIX:CHARGE_COMPLETED',
  charge: {
    status: 'COMPLETED',
    value: 5000,
    correlationID: sample.correlationID,
    paidAt: '2026-10-01T11:30:39.933Z',
  },
  pix: {
    endToEndId: 'E39f22d047934468f89c8347ed4cd80d0',
    value: 5000,
    time: '2026-10-01T11:30:39.933Z',
  },
});

export const charge: PlaygroundConfig = {
  id: 'cobranca-pix',
  title: 'Cobrança Pix dinâmica',
  lede: 'Do POST /api/v1/charge ao webhook OPENPIX:CHARGE_COMPLETED. Responda as perguntas para montar o roteiro da sua integração, veja cada mensagem trocada e teste a cobrança.',
  docs: [
    {
      label: 'Criar cobrança via API',
      href: '/docs/charge/how-to-create-charge-using-api',
    },
    {
      label: 'Webhook de cobrança paga',
      href: '/docs/charge/webhook/charge-webhook-example-charge-completed',
    },
    {
      label: 'Validar assinatura',
      href: '/docs/webhook/seguranca/webhook-signature-validation',
    },
  ],
  widget: ChargeRecipe,
  widgetTitle: 'O que você precisa integrar?',
  widgetLede:
    'Cada resposta acende um caminho no mapa. Clique nas opções da lista ou direto nos nós.',
  actors: [A.cli, A.you, A.woovi, A.bank],
  scenarios: [
    {
      id: 'paid',
      label: 'Pago',
      steps: [
        ...start,
        {
          from: 'cli',
          to: 'bank',
          label: 'Lê o QR e confirma o Pix',
          title: 'O cliente paga no app do banco',
          text: 'Isso acontece fora do seu sistema e da Woovi. Seu backend não precisa fazer nada aqui.',
        },
        {
          from: 'bank',
          to: 'woovi',
          label: 'Pix liquidado · endToEndId',
          title: 'O Pix chega na Woovi',
          text: 'A liquidação leva segundos. A Woovi casa o Pix com a cobrança e muda o status para COMPLETED.',
          callout: { text: 'Uma cobrança aceita um único pagamento.' },
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'POST webhook OPENPIX:CHARGE_COMPLETED',
          kind: 'evt',
          title: 'A Woovi avisa seu backend',
          text: 'Um POST para a URL cadastrada, com o payload completo e a assinatura no header x-webhook-signature.',
          code: completedPayload,
        },
        {
          from: 'you',
          to: 'you',
          label: 'Valida assinatura, baixa o pedido',
          title: 'Seu backend valida e dá baixa',
          text: 'Verifique x-webhook-signature sobre o corpo bruto antes de confiar no conteúdo. Depois localize o pedido pelo correlationID e marque como pago, sem efeito se já estiver pago.',
          callout: {
            tone: 'warn',
            text: 'Valide sobre o corpo exatamente como chegou. Fazer JSON.parse e stringify de novo altera os bytes e a assinatura não confere.',
          },
        },
        {
          from: 'you',
          to: 'woovi',
          label: '200 OK',
          kind: 'res',
          title: 'Responda 200 rápido',
          text: 'O timeout é de 100 segundos. Trabalho pesado (e-mail, nota fiscal) vai para uma fila depois do 200.',
        },
        {
          from: 'you',
          to: 'cli',
          label: 'Pedido confirmado',
          title: 'O cliente vê a confirmação',
          text: 'Sua tela pode escutar seu próprio backend para trocar o QR Code pela confirmação.',
        },
      ],
    },
    {
      id: 'retry',
      label: 'Webhook falha',
      steps: [
        ...start,
        {
          from: 'cli',
          to: 'bank',
          label: 'Lê o QR e confirma o Pix',
          title: 'O cliente paga',
          text: 'Igual ao caminho feliz.',
        },
        {
          from: 'bank',
          to: 'woovi',
          label: 'Pix liquidado',
          title: 'O Pix chega na Woovi',
          text: 'A cobrança vira COMPLETED independentemente do seu webhook responder.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'POST webhook OPENPIX:CHARGE_COMPLETED',
          kind: 'evt',
          title: 'Primeira entrega',
          text: 'Seu servidor está fora do ar ou devolve erro.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: '500 Internal Server Error',
          kind: 'res',
          bad: true,
          title: 'A entrega falha',
          text: 'Resposta de erro, URL indisponível ou mais de 100 s sem resposta contam como falha.',
          callout: {
            tone: 'bad',
            text: 'A cobrança continua COMPLETED na Woovi. Só a notificação está pendente.',
          },
        },
        {
          note: 'woovi',
          label: 'retentativas: 10s · 20s · 40s … 1280s',
          title: 'A Woovi tenta de novo',
          text: 'São até 8 tentativas com intervalo exponencial: 10 × 2^tentativa segundos. Se todas falharem, você ainda pode reenviar pela plataforma.',
          code: 'tentativa  intervalo\n1          10 s\n2          20 s\n3          40 s\n4          80 s\n5          160 s\n6          320 s\n7          640 s\n8          1280 s',
          lang: 'text',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'POST webhook (retentativa)',
          kind: 'evt',
          title: 'Nova entrega, mesmo evento',
          text: 'O payload é o mesmo. Por isso a baixa do pedido precisa ser idempotente.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: '200 OK',
          kind: 'res',
          title: 'Entregue',
          text: 'A Woovi para de tentar.',
        },
      ],
    },
    {
      id: 'expired',
      label: 'Expirou',
      steps: [
        ...start,
        {
          note: 'woovi',
          label: 'expiresIn esgota sem pagamento',
          title: 'O prazo acaba',
          text: 'Ninguém pagou até expiresDate. A cobrança vai para EXPIRED e o QR Code deixa de aceitar pagamento.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: 'POST webhook OPENPIX:CHARGE_EXPIRED',
          kind: 'evt',
          title: 'A Woovi avisa a expiração',
          text: 'Chega se você cadastrou um webhook para OPENPIX:CHARGE_EXPIRED.',
          code: json({
            event: 'OPENPIX:CHARGE_EXPIRED',
            charge: { status: 'EXPIRED', correlationID: sample.correlationID },
          }),
        },
        {
          from: 'you',
          to: 'woovi',
          label: '200 OK',
          kind: 'res',
          title: 'Confirme o recebimento',
          text: 'Mesma regra: responda rápido.',
        },
        {
          from: 'you',
          to: 'cli',
          label: 'Oferece gerar novo Pix',
          title: 'Recupere a venda',
          text: 'Crie uma nova cobrança com um novo correlationID. A cobrança expirada não volta a ficar ativa.',
        },
      ],
    },
    {
      id: 'poll',
      label: 'Consultando a API',
      steps: [
        ...start,
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/charge/{id}',
          kind: 'req',
          title: 'Você consulta',
          text: 'Use o correlationID ou o ID da cobrança.',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · status ACTIVE',
          kind: 'res',
          title: 'Ainda não pago',
          text: 'Espere e consulte de novo, aumentando o intervalo com o tempo.',
        },
        {
          from: 'cli',
          to: 'bank',
          label: 'Lê o QR e confirma o Pix',
          title: 'O cliente paga',
        },
        {
          from: 'bank',
          to: 'woovi',
          label: 'Pix liquidado',
          title: 'A cobrança vira COMPLETED',
          text: 'Você ainda não sabe disso.',
        },
        {
          from: 'you',
          to: 'woovi',
          label: 'GET /api/v1/charge/{id}',
          kind: 'req',
          title: 'Próxima consulta',
        },
        {
          from: 'woovi',
          to: 'you',
          label: '200 · status COMPLETED',
          kind: 'res',
          title: 'Agora você sabe',
          text: 'O atraso entre o pagamento e a sua baixa é o intervalo de consulta. Por isso o webhook é o recomendado.',
          callout: {
            tone: 'warn',
            text: 'Polling serve como reforço. Combine com webhook para não perder pagamento.',
          },
        },
      ],
    },
  ],
  statesTitle: 'Uma cobrança tem três estados',
  statesLede:
    'ACTIVE ao nascer, depois COMPLETED quando o Pix chega ou EXPIRED quando o prazo acaba. Os dois últimos são finais.',
  states: [
    { id: 'ACTIVE', sub: 'aguardando Pix', x: 150, y: 96 },
    { id: 'COMPLETED', sub: 'paga · final', x: 470, y: 0, terminal: true },
    {
      id: 'EXPIRED',
      sub: 'prazo esgotado · final',
      x: 470,
      y: 196,
      terminal: true,
      tone: 'muted',
    },
  ],
  transitions: [
    { id: 'create', from: 'start', to: 'ACTIVE', label: 'POST /charge' },
    {
      id: 'pay',
      from: 'ACTIVE',
      to: 'COMPLETED',
      label: 'Pix recebido → CHARGE_COMPLETED',
    },
    {
      id: 'expire',
      from: 'ACTIVE',
      to: 'EXPIRED',
      label: 'expiresIn esgota → CHARGE_EXPIRED',
      sourceHandle: 'b',
    },
  ],
  lab: {
    title: 'Cobrança',
    method: 'POST',
    path: '/api/v1/charge',
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
        id: 'expiresIn',
        label: 'Expira em',
        api: 'expiresIn',
        type: 'select',
        default: '3600',
        hint: 'em segundos',
        options: [
          { value: '900', label: '15 minutos (900 s)' },
          { value: '3600', label: '1 hora (3600 s)' },
          { value: '86400', label: '24 horas (86400 s)' },
        ],
      },
      {
        id: 'correlationID',
        label: 'Identificador',
        api: 'correlationID',
        type: 'id',
        default: 'uuid',
        hint: 'Único por cobrança. Envie de novo o mesmo valor para ver a idempotência.',
      },
      {
        id: 'comment',
        label: 'Comentário',
        api: 'comment',
        type: 'text',
        default: 'Pedido #1042',
        wide: true,
      },
    ],
    body: (v) => ({
      correlationID: v.correlationID,
      value: v.value,
      ...(v.comment ? { comment: v.comment } : {}),
      expiresIn: Number(v.expiresIn),
    }),
    createTransition: 'create',
    create: (v) => {
      const identifier = hex(32);
      const r: Resource = {
        status: 'ACTIVE',
        value: v.value,
        comment: v.comment,
        identifier,
        correlationID: v.correlationID,
        transactionID: identifier,
        type: 'DYNAMIC',
        expiresIn: Number(v.expiresIn),
        expiresDate: addSeconds(Number(v.expiresIn)),
        createdAt: now(),
        paymentLinkUrl: 'https://woovi.com/pay/' + uuid(),
        qrCodeImage: `https://api.woovi.com/openpix/charge/brcode/image/${identifier}.png`,
        brCode: chargeBrCode(v.value, identifier),
      };
      return {
        resource: r,
        log: [
          api('POST /api/v1/charge', {
            charge: r,
            correlationID: r.correlationID,
            brCode: r.brCode,
          }),
          hook(
            'OPENPIX:CHARGE_CREATED',
            {
              charge: {
                status: 'ACTIVE',
                correlationID: r.correlationID,
                value: r.value,
              },
            },
            { note: 'só chega se houver webhook para este evento', delay: 400 },
          ),
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
        apply: (r) => ({ ...r, paidAt: now() }),
        log: (r) => [
          hook('OPENPIX:CHARGE_COMPLETED', {
            charge: {
              status: r.status,
              value: r.value,
              correlationID: r.correlationID,
              transactionID: r.transactionID,
              paidAt: r.paidAt,
            },
            pix: {
              value: r.value,
              time: r.paidAt,
              endToEndId: endToEndId(),
              transactionID: r.transactionID,
              type: 'PAYMENT',
            },
            company,
          }),
        ],
      },
      {
        id: 'pay-fail',
        label: 'Pagar com webhook falhando',
        from: ['ACTIVE'],
        to: 'COMPLETED',
        transition: 'pay',
        apply: (r) => ({ ...r, paidAt: now() }),
        log: (r) => {
          const p = {
            charge: {
              status: r.status,
              value: r.value,
              correlationID: r.correlationID,
              paidAt: r.paidAt,
            },
          };
          return [
            hook('OPENPIX:CHARGE_COMPLETED', p, {
              code: 500,
              note: 'tentativa 1 falhou; a próxima sai em 10 s',
            }),
            hook('OPENPIX:CHARGE_COMPLETED', p, {
              note: 'tentativa 2 entregue (simulação acelerada)',
              delay: 1800,
            }),
          ];
        },
      },
      {
        id: 'expire',
        label: 'Simular expiração',
        from: ['ACTIVE'],
        to: 'EXPIRED',
        transition: 'expire',
        log: (r) => [
          hook('OPENPIX:CHARGE_EXPIRED', {
            charge: {
              status: 'EXPIRED',
              correlationID: r.correlationID,
              expiresDate: r.expiresDate,
            },
          }),
        ],
      },
    ],
    summary: (r) => [
      ['valor', brl(r.value)],
      ['correlationID', r.correlationID],
      ['expiresDate', new Date(r.expiresDate).toLocaleString('pt-BR')],
      ...(r.paidAt
        ? ([['paidAt', new Date(r.paidAt).toLocaleString('pt-BR')]] as [
            string,
            string,
          ][])
        : []),
    ],
    qr: (r) => r.brCode,
    explain: {
      NONE: 'Envie a requisição para criar a cobrança.',
      ACTIVE: 'Escolha o que acontece com a cobrança.',
      COMPLETED:
        'Uma cobrança aceita um único pagamento. Para cobrar de novo, crie outra.',
      EXPIRED: 'Cobrança expirada não volta a ficar ativa. Crie uma nova.',
    },
    handler: handlerTabs(
      `if (data.event === 'OPENPIX:CHARGE_COMPLETED') {
  // idempotente: o mesmo evento pode chegar mais de uma vez
  await db.orders.updateOne(
    { correlationID: data.charge.correlationID, status: { $ne: 'PAID' } },
    { $set: { status: 'PAID', paidAt: data.charge.paidAt } },
  );
}

if (data.event === 'OPENPIX:CHARGE_EXPIRED') {
  await db.orders.updateOne(
    { correlationID: data.charge.correlationID, status: 'PENDING' },
    { $set: { status: 'EXPIRED' } },
  );
}`,
      `if ($data['event'] === 'OPENPIX:CHARGE_COMPLETED') {
  // idempotente: só muda se ainda não estiver pago
  $stmt = $pdo->prepare("UPDATE orders SET status = 'PAID' WHERE correlation_id = ? AND status <> 'PAID'");
  $stmt->execute([$data['charge']['correlationID']]);
}`,
    ),
  },
};
