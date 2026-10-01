import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Link from '@docusaurus/Link';

import type { PlaygroundConfig } from './types';
import Sequence from './Sequence';
import StateMachine from './StateMachine';
import Lab from './Lab';
import PromptPanel from './PromptPanel';
import type { Selection } from './prompt';
import { playgrounds } from './configs';
import styles from './Playground.module.css';

function Section({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h2>{title}</h2>
        {lede ? <p className={styles.lede}>{lede}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function PlaygroundView({ config }: { config: PlaygroundConfig }) {
  const c = config;
  const Widget = c.widget;
  const [scenario, setScenario] = useState(c.scenarios[0].id);
  const [selection, setSelection] = useState<Selection | null>(null);
  let n = 0;
  const next = (label: string) => `${String(++n).padStart(2, '0')} · ${label}`;
  return (
    <div className={styles.pg}>
      <div className={styles.hero}>
        <p className={styles.lede}>{c.lede}</p>
        <div className={styles.docLinks}>
          {c.docs.map((d) => (
            <Link key={d.href} to={d.href}>
              {d.label} →
            </Link>
          ))}
        </div>
      </div>

      {Widget ? (
        <Section
          eyebrow={next('Ferramenta')}
          title={c.widgetTitle ?? 'Experimente'}
          lede={c.widgetLede}
        >
          <Widget />
        </Section>
      ) : null}

      <Section
        eyebrow={next('Sequência')}
        title='Quem fala com quem, e quando'
        lede='Avance passo a passo (ou use ← → no teclado com o mouse sobre o diagrama) e troque de cenário para ver o que muda.'
      >
        <Sequence
          actors={c.actors}
          scenarios={c.scenarios}
          scenario={scenario}
          onScenario={setScenario}
        />
      </Section>

      {c.lab ? (
        <Section
          eyebrow={next(c.states ? 'Estados e playground' : 'Playground')}
          title={c.statesTitle ?? 'Faça a requisição e acompanhe os eventos'}
          lede={c.statesLede}
        >
          <Lab
            lab={c.lab}
            states={c.states}
            transitions={c.transitions}
            onSelection={setSelection}
          />
        </Section>
      ) : c.states && c.transitions ? (
        <Section
          eyebrow={next('Estados')}
          title={c.statesTitle ?? 'Máquina de estados'}
          lede={c.statesLede}
        >
          <StateMachine
            states={c.states}
            transitions={c.transitions}
            small={false}
          />
        </Section>
      ) : null}

      <Section
        eyebrow={next('Prompt')}
        title='Leve para o seu agente de IA'
        lede='Um prompt único com o fluxo, os estados, os eventos e os valores que você escolheu aqui, no formato do Woovi Prompts.'
      >
        <PromptPanel config={c} scenario={scenario} selection={selection} />
      </Section>
    </div>
  );
}

export default function Playground({ id }: { id: string }) {
  const config = playgrounds[id];
  if (!config) return <p>Playground não encontrado: {id}</p>;
  return (
    <BrowserOnly
      fallback={<div style={{ minHeight: 600 }}>Carregando playground…</div>}
    >
      {() => <PlaygroundView config={config} />}
    </BrowserOnly>
  );
}
