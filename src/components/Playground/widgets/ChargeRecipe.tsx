import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';

import QuestionFlow, {
  QuestionPanel,
  answerOn,
  isDone,
  type Answers,
  type Question,
} from '../QuestionFlow';
import styles from '../Playground.module.css';

const Q: Record<string, Question> = {
  goal: {
    id: 'goal',
    q: 'O que você quer fazer?',
    next: 'where',
    opts: [
      {
        id: 'charge',
        label: 'Cobrar um pagamento único',
        hint: 'Pedido, serviço, fatura avulsa',
      },
      {
        id: 'recurring',
        label: 'Cobrar todo mês',
        hint: 'Assinatura, mensalidade',
        leaf: true,
      },
      {
        id: 'store',
        label: 'Vender numa loja pronta',
        hint: 'WooCommerce, VTEX, Nuvemshop, Magento',
        leaf: true,
      },
      {
        id: 'payout',
        label: 'Enviar Pix',
        hint: 'Pagar fornecedor, saque, reembolso',
        leaf: true,
      },
    ],
  },
  where: {
    id: 'where',
    q: 'Onde o cliente vai pagar?',
    next: 'confirm',
    opts: [
      {
        id: 'own',
        label: 'Na minha tela',
        hint: 'Eu mostro o QR Code e o copia e cola',
      },
      {
        id: 'link',
        label: 'Na página da Woovi',
        hint: 'Eu redireciono para o paymentLinkUrl',
      },
    ],
  },
  confirm: {
    id: 'confirm',
    q: 'Como seu sistema fica sabendo do pagamento?',
    next: 'split',
    opts: [
      {
        id: 'webhook',
        label: 'A Woovi me avisa',
        hint: 'Webhook OPENPIX:CHARGE_COMPLETED (recomendado)',
      },
      {
        id: 'poll',
        label: 'Eu consulto a API',
        hint: 'GET /api/v1/charge/{id} de tempos em tempos',
      },
    ],
  },
  split: {
    id: 'split',
    q: 'O valor vai para mais de uma conta?',
    next: null,
    opts: [
      { id: 'no', label: 'Não, fica tudo comigo' },
      {
        id: 'yes',
        label: 'Sim, quero dividir',
        hint: 'Split para subconta ou parceiro',
      },
    ],
  },
};

type RStep = {
  b: string;
  p: string;
  chips?: [string, string?][];
  links?: [string, string][];
};

function recipeFor(a: Answers): { title: string; steps: RStep[] } | null {
  if (a.goal === 'recurring')
    return {
      title: 'Cobrança recorrente com Pix Automático',
      steps: [
        {
          b: 'Escolha a jornada do Pix Automático',
          p: 'Cada jornada define como o cliente autoriza a recorrência.',
          links: [
            [
              'Como escolher a jornada',
              '/docs/pix-automatic/pix-automatic-how-to-choose-journey',
            ],
          ],
        },
        {
          b: 'Crie a assinatura pela API',
          p: 'POST /api/v1/subscriptions com type PIX_RECURRING. A Woovi gera a cobrança de cada ciclo.',
          links: [
            ['Como criar', '/docs/pix-automatic/pix-automatic-how-to-create'],
          ],
        },
        {
          b: 'Acompanhe os eventos de cada ciclo',
          p: 'PIX_AUTOMATIC_APPROVED quando o cliente autoriza, PIX_AUTOMATIC_COBR_COMPLETED a cada pagamento.',
          links: [
            ['Webhooks', '/docs/pix-automatic/webhooks/pix-automatic-webhooks'],
          ],
        },
      ],
    };
  if (a.goal === 'store')
    return {
      title: 'Plugin para a sua plataforma',
      steps: [
        {
          b: 'Instale o plugin Woovi da sua plataforma',
          p: 'Há plugins para WooCommerce, VTEX, Nuvemshop, Magento, OpenCart, PrestaShop e outras. Não precisa escrever código.',
        },
        {
          b: 'Cole o AppID da sua conta no plugin',
          p: 'Você gera o AppID em API/Plugins, na plataforma Woovi.',
        },
        {
          b: 'Confira se o webhook foi criado',
          p: 'O plugin cadastra o webhook que atualiza o pedido quando o Pix é pago.',
        },
      ],
    };
  if (a.goal === 'payout')
    return {
      title: 'Enviar Pix com a API de pagamentos',
      steps: [
        {
          b: 'Entenda o fluxo de um pagamento',
          p: 'Um pagamento é criado e depois aprovado, manualmente ou por aprovação automática.',
          links: [['Como funciona', '/docs/payment/payment-how-it-works']],
        },
        {
          b: 'Use o mesmo correlationID nas retentativas',
          p: 'O correlationID é a chave de idempotência: um ID novo para o mesmo pagamento cria um pagamento duplicado.',
          links: [['Correlation ID', '/docs/concepts/correlation-id']],
        },
      ],
    };
  if (!isDone(Q, 'goal', a)) return null;
  const steps: RStep[] = [
    {
      b: 'Gere um AppID',
      p: 'Em API/Plugins na plataforma. Ele vai no header Authorization de toda chamada, sem o prefixo Bearer.',
      chips: [['Authorization: <AppID>']],
    },
  ];
  if (a.confirm === 'webhook')
    steps.push({
      b: 'Cadastre um webhook',
      p: 'Aponte para uma URL do seu backend. Ao salvar, a Woovi envia um evento de teste: responda 200.',
      chips: [
        ['OPENPIX:CHARGE_COMPLETED', 'evt'],
        ['OPENPIX:CHARGE_EXPIRED', 'evt'],
      ],
      links: [['Playground de webhook', '/docs/playground/playground-webhook']],
    });
  steps.push({
    b: 'Crie a cobrança',
    p:
      'value em centavos e um correlationID único seu. Reenviar com o mesmo correlationID não cria outra cobrança.' +
      (a.split === 'yes'
        ? ' Inclua o array splits com a parte de cada conta.'
        : ''),
    chips: [['POST /api/v1/charge', 'post']],
    links:
      a.split === 'yes'
        ? [['Playground de split', '/docs/playground/playground-split']]
        : [
            [
              'Criar cobrança via API',
              '/docs/charge/how-to-create-charge-using-api',
            ],
          ],
  });
  steps.push(
    a.where === 'own'
      ? {
          b: 'Mostre o QR Code e o copia e cola',
          p: 'Use qrCodeImage para a imagem e brCode para o botão de copiar.',
          chips: [['charge.brCode'], ['charge.qrCodeImage']],
        }
      : {
          b: 'Redirecione para o link de pagamento',
          p: 'A página da Woovi mostra o QR Code e acompanha o pagamento por você.',
          chips: [['charge.paymentLinkUrl']],
        },
  );
  if (a.confirm === 'webhook')
    steps.push({
      b: 'Receba o webhook e valide a assinatura',
      p: 'Verifique x-webhook-signature com a chave pública da Woovi sobre o corpo bruto. Responda 200 em até 100 s; um erro dispara até 8 tentativas.',
      chips: [['x-webhook-signature']],
      links: [
        [
          'Validar assinatura',
          '/docs/webhook/seguranca/webhook-signature-validation',
        ],
        ['Retentativas', '/docs/webhook/webhook-retry'],
      ],
    });
  else
    steps.push({
      b: 'Consulte a cobrança até ela mudar de estado',
      p: 'Pare de consultar quando o status for COMPLETED ou EXPIRED.',
      chips: [['GET /api/v1/charge/{id}', 'post']],
    });
  steps.push({
    b: 'Dê baixa no pedido de forma idempotente',
    p: 'Localize o pedido pelo correlationID. O mesmo evento pode chegar mais de uma vez; marcar como pago duas vezes não pode ter efeito colateral.',
  });
  return {
    title:
      'Cobrança Pix ' +
      (a.where === 'own'
        ? 'com QR Code na sua tela'
        : 'com link de pagamento') +
      (a.split === 'yes' ? ' e split' : ''),
    steps,
  };
}

export default function ChargeRecipe() {
  const [answers, setAnswers] = useState<Answers>({
    goal: 'charge',
    where: 'own',
  });
  const recipe = recipeFor(answers);
  return (
    <div className={styles.splitRev}>
      <div className={styles.col}>
        <QuestionPanel
          questions={Q}
          root='goal'
          answers={answers}
          setAnswers={setAnswers}
        />
        {recipe ? (
          <div className={clsx(styles.panel, styles.pad)}>
            <div className={styles.eyebrow}>Sua receita</div>
            <h3>{recipe.title}</h3>
            <ol className={styles.recipe}>
              {recipe.steps.map((s) => (
                <li key={s.b}>
                  <div>
                    <b>{s.b}</b>
                    <p>{s.p}</p>
                    {s.chips || s.links ? (
                      <div className={styles.row}>
                        {(s.chips ?? []).map(([c, k]) => (
                          <span
                            key={c}
                            className={clsx(
                              styles.chip,
                              k === 'post' && styles.chipPost,
                              k === 'evt' && styles.chipEvt,
                            )}
                          >
                            {c}
                          </span>
                        ))}
                        {(s.links ?? []).map(([l, h]) => (
                          <Link key={h} to={h}>
                            {l} →
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
      <QuestionFlow
        questions={Q}
        root='goal'
        answers={answers}
        onAnswer={(q, o) => setAnswers(answerOn(Q, 'goal', answers, q, o))}
        resultLabel='Sua integração'
        resultSub={(done) =>
          done ? 'receita pronta ao lado' : 'responda as perguntas'
        }
      />
    </div>
  );
}
