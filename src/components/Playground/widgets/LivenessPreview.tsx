import React, { useState } from 'react';
import clsx from 'clsx';

import { CodeTabs } from '../Code';
import styles from '../Playground.module.css';

const LINK =
  'https://kyc.woovi.com/onboarding/QWNjb3VudFJlZ2lzdGVyOjY5.../liveness?embed=true';
const PREVIEW = 'https://kyc.woovi.com/onboarding/liveness?embed=true';

type PreviewMode = {
  id: string;
  label: string;
  query: string;
};

const MODES: PreviewMode[] = [
  { id: 'challenge', label: 'Desafio', query: '' },
  { id: 'rejected', label: 'Desafio recusado', query: '&liveness=fail' },
  { id: 'photo', label: 'Foto', query: '&liveness=photo' },
];

type Mode = 'redirect' | 'popup' | 'iframe';

const code = (mode: Mode) => {
  if (mode === 'redirect') {
    return [
      {
        label: 'JavaScript',
        language: 'js',
        code: `// linkLiveness já vem com ?embed=true no onboarding BaaS\nconst { linkLiveness } = await fetch('/api/merchant/onboarding').then((r) => r.json());\nwindow.location.href = linkLiveness;`,
      },
    ];
  }
  if (mode === 'popup') {
    return [
      {
        label: 'JavaScript',
        language: 'js',
        code: `window.open(linkLiveness, 'woovi-liveness', 'width=480,height=720');`,
      },
    ];
  }
  return [
    {
      label: 'HTML',
      language: 'html',
      code: `<iframe\n  src="${LINK}"\n  width="100%"\n  height="720"\n  style="border: 0; max-width: 640px;"\n  title="Prova de vida"\n  allow="camera; clipboard-read; clipboard-write"\n></iframe>`,
    },
    {
      label: 'React',
      language: 'jsx',
      code: `export function LivenessFrame({ link }) {\n  return (\n    <iframe\n      src={link}\n      width="100%"\n      height={720}\n      style={{ border: 0, maxWidth: 640 }}\n      title="Prova de vida"\n      allow="camera; clipboard-read; clipboard-write"\n    />\n  );\n}`,
    },
  ];
};

const LivenessPreview = (): React.ReactElement => {
  const [mode, setMode] = useState<Mode>('iframe');
  const [previewMode, setPreviewMode] = useState('challenge');
  const selected =
    MODES.find((item) => item.id === previewMode) ?? MODES[0];
  const preview = `${PREVIEW}${selected.query}`;
  return (
    <div className={styles.halves}>
      <div className={styles.col}>
        <div className={clsx(styles.panel, styles.pad)}>
          <h3>Como abrir a selfie</h3>
          <div className={styles.seg} role='tablist' aria-label='Modo'>
            {(
              [
                ['redirect', 'Redirect'],
                ['popup', 'Nova aba'],
                ['iframe', 'Iframe'],
              ] as [Mode, string][]
            ).map(([item, label]) => (
              <button
                key={item}
                type='button'
                role='tab'
                aria-selected={mode === item}
                className={clsx(mode === item && styles.on)}
                onClick={() => setMode(item)}
              >
                {label}
              </button>
            ))}
          </div>
          <CodeTabs tabs={code(mode)} groupId='playground-liveness' />
          <div className={styles.callout}>
            O <code>POST /api/v1/kyc/onboarding</code> de BaaS já devolve{' '}
            <code>linkLiveness</code> com <code>?embed=true</code>. Gere o link
            no backend: o AppID não vai para o front. O iframe precisa de{' '}
            <code>allow=&quot;camera&quot;</code>.
          </div>
          <div className={clsx(styles.callout, styles.calloutWarn)}>
            A página não envia postMessage. Para saber que a selfie saiu da
            pendência, consulte <code>GET /api/v1/kyc/rfi</code>:{' '}
            <code>linkLiveness</code> volta <code>null</code>.
          </div>
        </div>
      </div>
      <div className={clsx(styles.panel, styles.pad)}>
        <div className={styles.headRow}>
          <h3>Pré-visualização</h3>
          <select
            aria-label='Modo da pré-visualização'
            value={previewMode}
            onChange={(event) => setPreviewMode(event.target.value)}
            className={styles.btn}
          >
            {MODES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <iframe
          key={preview}
          src={preview}
          title='Pré-visualização da prova de vida'
          width='100%'
          height={640}
          style={{
            border: '1px solid var(--pg-line)',
            borderRadius: 10,
            maxWidth: 640,
            background: '#fff',
            colorScheme: 'light',
          }}
          allow='camera; clipboard-read; clipboard-write'
        />
        <p className={styles.why}>
          Esta prévia usa o mock <code>kyc.woovi.com/onboarding/liveness</code>,
          sem cadastro. O exemplo ao lado é o formato do link de produção, com
          o id cortado. A API só devolve um link completo para o cadastro que
          o seu backend criou.
          {mode !== 'iframe'
            ? ' No modo escolhido ela abriria fora da sua página.'
            : ''}
        </p>
      </div>
    </div>
  );
};

export default LivenessPreview;
