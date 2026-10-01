import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';

import QuestionFlow, {
  QuestionPanel,
  answerOn,
  type Answers,
  type Question,
} from './QuestionFlow';
import { docPath, groups, playgrounds } from './configs';
import styles from './Playground.module.css';

const blurb = (id: string) => playgrounds[id].lede.split(/(?<=\.)\s/)[0];

function useQuestions(): Record<string, Question> {
  return useMemo(() => {
    const q: Record<string, Question> = {
      root: {
        id: 'root',
        q: 'O que você quer fazer?',
        opts: groups.map((g) => ({
          id: g.id,
          label: g.label,
          hint: g.hint,
          next: 'g-' + g.id,
        })),
      },
    };
    groups.forEach((g) => {
      q['g-' + g.id] = {
        id: 'g-' + g.id,
        q: g.label + ': qual destes?',
        next: null,
        opts: g.items.map((id) => ({
          id,
          label: playgrounds[id].title,
          hint: blurb(id),
        })),
      };
    });
    return q;
  }, []);
}

function HubView() {
  const Q = useQuestions();
  const [answers, setAnswers] = useState<Answers>({ root: 'receive' });
  const picked = answers.root ? answers['g-' + answers.root] : undefined;
  const pg = picked ? playgrounds[picked] : undefined;
  return (
    <div className={styles.pg}>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.eyebrow}>01 · Por onde começar</div>
          <h2>Duas perguntas até o playground certo</h2>
          <p className={styles.lede}>
            Clique nas opções da lista ou direto nos nós do mapa.
          </p>
        </div>
        <div className={styles.splitRev}>
          <div className={styles.col}>
            <QuestionPanel
              questions={Q}
              root='root'
              answers={answers}
              setAnswers={setAnswers}
            />
            {pg ? (
              <div className={clsx(styles.panel, styles.pad)}>
                <div className={styles.eyebrow}>Seu playground</div>
                <h3>{pg.title}</h3>
                <p className={styles.muted}>{pg.lede}</p>
                <div className={styles.actions}>
                  <Link
                    className={clsx(styles.btn, styles.primary)}
                    to={docPath(pg.id)}
                  >
                    Abrir o playground de {pg.title}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
          <QuestionFlow
            questions={Q}
            root='root'
            answers={answers}
            onAnswer={(q, o) => setAnswers(answerOn(Q, 'root', answers, q, o))}
            resultLabel={pg ? pg.title : 'Seu playground'}
            resultSub={(d) => (d ? 'link ao lado' : 'responda as perguntas')}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.eyebrow}>02 · Todos os playgrounds</div>
          <h2>Cada produto, do request ao webhook</h2>
          <p className={styles.lede}>
            Todos têm diagrama de sequência passo a passo. Os que têm estado
            mostram a máquina de estados reagindo às suas ações. Nada sai do
            navegador: as respostas são simuladas a partir dos exemplos da
            documentação.
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.id} className={styles.col}>
            <h3>{g.label}</h3>
            <div className={styles.cards}>
              {g.items.map((id) => (
                <Link key={id} to={docPath(id)} className={styles.card}>
                  <strong>{playgrounds[id].title}</strong>
                  <span>{blurb(id)}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function PlaygroundHub() {
  return (
    <BrowserOnly fallback={<div style={{ minHeight: 600 }}>Carregando…</div>}>
      {() => <HubView />}
    </BrowserOnly>
  );
}
