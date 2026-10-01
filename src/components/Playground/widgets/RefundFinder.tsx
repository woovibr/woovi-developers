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
import { Code } from '../Code';
import styles from '../Playground.module.css';

const Q: Record<string, Question> = {
  have: {
    id: 'have',
    q: 'O que você tem em mãos?',
    opts: [
      {
        id: 'charge',
        label: 'O correlationID da cobrança',
        hint: 'a cobrança que foi paga e depois reembolsada',
        next: null,
      },
      {
        id: 'refund',
        label: 'O ID do reembolso',
        hint: 'refundId ou o correlationID que você mandou no reembolso',
        next: null,
      },
      {
        id: 'e2e',
        label: 'O endToEndId do Pix original',
        hint: 'E… do pagamento recebido',
        next: 'when',
      },
      {
        id: 'nothing',
        label: 'Nada, quero ver todos',
        hint: 'conciliação do período',
        next: null,
      },
    ],
  },
  when: {
    id: 'when',
    q: 'Você recebe webhooks de reembolso?',
    next: null,
    opts: [
      { id: 'yes', label: 'Sim', hint: 'PIX_TRANSACTION_REFUND_*' },
      { id: 'no', label: 'Não, só consulto a API' },
    ],
  },
};

type Answer = {
  title: string;
  text: string;
  call: string;
  code: string;
  links: [string, string][];
};

function answerFor(a: Answers): Answer | null {
  if (!isDone(Q, 'have', a)) return null;
  if (a.have === 'charge')
    return {
      title: 'Liste os reembolsos da cobrança',
      text: 'Uma cobrança pode ter vários reembolsos parciais. A lista traz o status e o endToEndId de cada um.',
      call: 'GET /api/v1/charge/{id}/refund',
      code: '{\n  "refunds": [\n    { "status": "IN_PROCESSING", "value": 100, "correlationID": "a273e72c-…", "endToEndId": "E2311444720230418…" },\n    { "status": "CONFIRMED", "value": 40, "correlationID": "…", "endToEndId": "…" }\n  ]\n}',
      links: [['Listar reembolsos', '/docs/refund/charge-refund-get-all-api']],
    };
  if (a.have === 'refund')
    return {
      title: 'Busque o reembolso direto',
      text: 'Aceita o refundId ou o correlationID do reembolso. returnIdentification é o identificador da devolução no Pix.',
      call: 'GET /api/v1/refund/{id}',
      code: '{\n  "pixTransactionRefund": {\n    "value": 100,\n    "correlationID": "7777-6f71-…",\n    "refundId": "11bf5b37e0b842e08dcfdc8c4aefc000",\n    "returnIdentification": "D09089356202108032000a543e325902"\n  }\n}',
      links: [['API de reembolso', '/api#tag/refund']],
    };
  if (a.have === 'nothing')
    return {
      title: 'Filtre as transações por tipo',
      text: 'Liste as transações do período com type=REFUND. Cada uma traz o endToEndId da devolução.',
      call: 'GET /api/v1/transaction?type=REFUND&start=…&end=…',
      code: 'curl "https://api.woovi.com/api/v1/transaction?type=REFUND" \\\n  -H "Authorization: <SEU_APP_ID>"',
      links: [['API de transações', '/api#tag/transactions']],
    };
  if (a.when === 'yes')
    return {
      title: 'Guarde o par original → reembolso no webhook',
      text: 'Os eventos PIX_TRANSACTION_REFUND_* trazem as duas pontas. Salve originalTransaction.endToEndId junto do reembolso e a busca vira uma consulta no seu banco.',
      call: 'webhook PIX_TRANSACTION_REFUND_SENT_CONFIRMED',
      code: '{\n  "event": "PIX_TRANSACTION_REFUND_SENT_CONFIRMED",\n  "refundTransaction": { "type": "REFUND", "endToEndId": "D5481…", "partial": true },\n  "originalTransaction": { "type": "PAYMENT", "endToEndId": "E3168…" }\n}',
      links: [
        [
          'Webhook de reembolso enviado',
          '/docs/webhook/examples/webhook-refund-sent-confirmed',
        ],
      ],
    };
  return {
    title: 'Consulte a transação original e siga para a cobrança',
    text: 'GET /api/v1/transaction/{id} aceita o endToEndId. Se a transação veio de uma cobrança, use o correlationID dela para listar os reembolsos. Não há busca de reembolso pelo endToEndId original documentada.',
    call: 'GET /api/v1/transaction/{endToEndId}',
    code: 'curl "https://api.woovi.com/api/v1/transaction/E3168…" \\\n  -H "Authorization: <SEU_APP_ID>"',
    links: [['API de transações', '/api#tag/transactions']],
  };
}

export default function RefundFinder() {
  const [answers, setAnswers] = useState<Answers>({});
  const ans = answerFor(answers);
  return (
    <div className={styles.splitRev}>
      <div className={styles.col}>
        <QuestionPanel
          questions={Q}
          root='have'
          answers={answers}
          setAnswers={setAnswers}
        />
        {ans ? (
          <div className={clsx(styles.panel, styles.pad)}>
            <div className={styles.eyebrow}>Caminho</div>
            <h3>{ans.title}</h3>
            <p className={styles.muted}>{ans.text}</p>
            <div className={styles.row}>
              <span className={clsx(styles.chip, styles.chipPost)}>
                {ans.call}
              </span>
              {ans.links.map(([l, h]) => (
                <Link key={h} to={h}>
                  {l} →
                </Link>
              ))}
            </div>
            <Code
              code={ans.code}
              language={ans.code.startsWith('curl') ? 'bash' : 'json'}
            />
            <div className={styles.callout}>
              Nos exemplos da documentação, o endToEndId da devolução começa com
              D e o do pagamento original com E.
            </div>
          </div>
        ) : null}
      </div>
      <QuestionFlow
        questions={Q}
        root='have'
        answers={answers}
        onAnswer={(q, o) => setAnswers(answerOn(Q, 'have', answers, q, o))}
        resultLabel='Onde está o reembolso'
        resultSub={(d) => (d ? 'caminho ao lado' : 'escolha uma opção')}
      />
    </div>
  );
}
