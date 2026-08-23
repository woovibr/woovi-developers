import React, { useState } from 'react';
import clsx from 'clsx';

import styles from './Hero.module.css';

type Language = 'bash' | 'json';

type Snippet = {
  id: string;
  label: string;
  language: Language;
  file: string;
  code: string;
};

// Minimal token colorizer, kept local so the hero card stays dark in both
// themes instead of following the site's Prism theme.
const PATTERNS: Record<Language, RegExp> = {
  bash: /(?<comment>#[^\n]*)|(?<string>'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(?<url>https?:\/\/[^\s'"\\]+)|(?<flag>(?:^|\s)--?[A-Za-z][\w-]*)|(?<keyword>\bcurl\b)/gm,
  json: /(?<key>"(?:[^"\\]|\\.)*"(?=\s*:))|(?<string>"(?:[^"\\]|\\.)*")|(?<number>-?\b\d+(?:\.\d+)?\b)|(?<literal>\b(?:true|false|null)\b)/g,
};

const highlight = (code: string, language: Language) => {
  const pattern = new RegExp(PATTERNS[language]);
  const nodes: React.ReactNode[] = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = pattern.exec(code)) !== null) {
    const [text] = match;
    const type = Object.keys(match.groups ?? {}).find(
      (group) => match?.groups?.[group] !== undefined,
    );

    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }

    nodes.push(
      <span key={`${type}-${match.index}`} className={styles[`token-${type}`]}>
        {text}
      </span>,
    );

    lastIndex = match.index + text.length;
  }

  nodes.push(code.slice(lastIndex));

  return nodes;
};

const snippets: Snippet[] = [
  {
    id: 'charge',
    label: 'Criar cobrança',
    language: 'bash',
    file: 'POST /api/v1/charge',
    code: `curl -X POST https://api.woovi.com/api/v1/charge \\
  -H 'Authorization: SEU_APP_ID' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "correlationID": "pedido-4321",
    "value": 1990,
    "comment": "Pedido #4321"
  }'`,
  },
  {
    id: 'response',
    label: 'Resposta',
    language: 'json',
    file: '200 OK',
    code: `{
  "charge": {
    "status": "ACTIVE",
    "correlationID": "pedido-4321",
    "value": 1990,
    "brCode": "00020101021226980014br.gov.bcb.pix...",
    "paymentLinkUrl": "https://woovi.com/pay/9134e286...",
    "qrCodeImage": "https://api.woovi.com/openpix/charge/brcode/image/9134e286....png",
    "expiresIn": 2592000
  }
}`,
  },
  {
    id: 'webhook',
    label: 'Webhook',
    language: 'json',
    file: 'POST /seu-endpoint',
    code: `{
  "event": "OPENPIX:CHARGE_COMPLETED",
  "charge": {
    "correlationID": "pedido-4321",
    "status": "COMPLETED",
    "value": 1990,
    "paidAt": "2025-09-24T15:07:50.891Z"
  },
  "pix": {
    "value": 1990,
    "endToEndId": "E1234567890",
    "time": "2025-09-24T15:07:50.891Z"
  }
}`,
  },
];

const CodeCard = () => {
  const [activeId, setActiveId] = useState(snippets[0].id);
  const [copied, setCopied] = useState(false);

  const active = snippets.find((snippet) => snippet.id === activeId) as Snippet;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles['code-card']}>
      <div className={styles['code-card--tabs']} role='tablist'>
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            type='button'
            role='tab'
            aria-selected={snippet.id === activeId}
            aria-controls='hero-code-panel'
            className={clsx(
              styles['code-card--tab'],
              snippet.id === activeId && styles['code-card--tab-active'],
            )}
            onClick={() => setActiveId(snippet.id)}
          >
            {snippet.label}
          </button>
        ))}
      </div>

      <div className={styles['code-card--bar']}>
        <span className={styles['code-card--file']}>{active.file}</span>
        <button
          type='button'
          className={styles['code-card--copy']}
          onClick={onCopy}
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>

      <pre
        id='hero-code-panel'
        role='tabpanel'
        tabIndex={0}
        aria-label={active.label}
        className={styles['code-card--pre']}
      >
        <code>{highlight(active.code, active.language)}</code>
      </pre>
    </div>
  );
};

export { CodeCard };
