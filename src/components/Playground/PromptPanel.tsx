import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import type { PlaygroundConfig } from './types';
import { Code } from './Code';
import { buildPrompt, stacks, type Selection } from './prompt';
import styles from './Playground.module.css';

export default function PromptPanel({
  config,
  scenario,
  selection,
}: {
  config: PlaygroundConfig;
  scenario: string;
  selection: Selection | null;
}) {
  const [stack, setStack] = useState(stacks[0].id);
  const [copied, setCopied] = useState(false);
  const st = stacks.find((s) => s.id === stack) ?? stacks[0];
  const prompt = useMemo(
    () => buildPrompt(config, scenario, st, selection),
    [config, scenario, st, selection],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={clsx(styles.panel, styles.pad)}>
      <div className={styles.headRow}>
        <div className={styles.seg} role='group' aria-label='Linguagem'>
          {stacks.map((s) => (
            <button
              key={s.id}
              type='button'
              aria-pressed={s.id === stack}
              className={clsx(s.id === stack && styles.on)}
              onClick={() => setStack(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type='button'
          className={clsx(styles.btn, styles.primary)}
          onClick={copy}
        >
          {copied ? 'Copiado ✓' : 'Copiar prompt'}
        </button>
      </div>
      <p className={styles.muted}>
        Atualiza sozinho com o cenário e os campos que você escolheu acima. Cole
        no Claude Code, Cursor, Copilot ou no agente que você usa.
      </p>
      <div className={styles.prompt}>
        <Code code={prompt} language='markdown' />
      </div>
    </div>
  );
}
