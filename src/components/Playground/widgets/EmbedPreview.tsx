import React, { useState } from 'react';
import clsx from 'clsx';

import { CodeTabs } from '../Code';
import styles from '../Playground.module.css';

const LINK = 'https://kyc.woovi.com/onboarding/QWNjb3VudFJlZ2lzdGVyOjY5…';
const STATUSES = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NOT_FOUND'];
type Mode = 'redirect' | 'popup' | 'iframe';

function code(mode: Mode, whiteLabel: boolean) {
  const url = whiteLabel ? `${LINK}?embed=true` : LINK;
  if (mode === 'redirect')
    return [
      {
        label: 'JavaScript',
        language: 'js',
        code: `// o link vem do seu backend (POST /api/v1/kyc/onboarding)\nconst { linkOnboarding } = await fetch('/api/merchant/onboarding').then((r) => r.json());\nwindow.location.href = linkOnboarding${whiteLabel ? " + '?embed=true'" : ''};`,
      },
    ];
  if (mode === 'popup')
    return [
      {
        label: 'JavaScript',
        language: 'js',
        code: `window.open(linkOnboarding${whiteLabel ? " + '?embed=true'" : ''}, 'woovi-kyc', 'width=480,height=800');`,
      },
    ];
  return [
    {
      label: 'HTML',
      language: 'html',
      code: `<iframe\n  src="${url}"\n  width="100%"\n  height="900"\n  style="border: 0; max-width: 640px;"\n  title="Cadastro KYC"\n  allow="camera; clipboard-read; clipboard-write"\n></iframe>`,
    },
    {
      label: 'React',
      language: 'jsx',
      code: `export function KycFrame({ link }) {\n  return (\n    <iframe\n      src={\`\${link}${whiteLabel ? '?embed=true' : ''}\`}\n      width="100%"\n      height={900}\n      style={{ border: 0, maxWidth: 640 }}\n      title="Cadastro KYC"\n      allow="camera; clipboard-read; clipboard-write"\n    />\n  );\n}`,
    },
  ];
}

export default function EmbedPreview() {
  const [mode, setMode] = useState<Mode>('iframe');
  const [whiteLabel, setWhiteLabel] = useState(true);
  const [status, setStatus] = useState('PENDING');
  const preview = `https://kyc.woovi.com/onboarding?status=${status}${whiteLabel ? '&embed=true' : ''}`;
  return (
    <div className={styles.halves}>
      <div className={styles.col}>
        <div className={clsx(styles.panel, styles.pad)}>
          <h3>Como abrir o cadastro</h3>
          <div className={styles.seg} role='tablist' aria-label='Modo'>
            {(
              [
                ['redirect', 'Redirect (recomendado)'],
                ['popup', 'Nova aba'],
                ['iframe', 'Iframe'],
              ] as [Mode, string][]
            ).map(([m, l]) => (
              <button
                key={m}
                type='button'
                role='tab'
                aria-selected={mode === m}
                className={clsx(mode === m && styles.on)}
                onClick={() => setMode(m)}
              >
                {l}
              </button>
            ))}
          </div>
          <label className={styles.toggle} htmlFor='pg-embed-wl'>
            <input
              id='pg-embed-wl'
              type='checkbox'
              checked={whiteLabel}
              onChange={(e) => setWhiteLabel(e.target.checked)}
            />
            White-label: <code>?embed=true</code> esconde o cabeçalho com a
            marca Woovi
          </label>
          <CodeTabs tabs={code(mode, whiteLabel)} groupId='playground-embed' />
          <div className={styles.callout}>
            Gere o link no seu backend: o AppID nunca vai para o front. A página
            precisa ser HTTPS, e o iframe precisa de <code>allow="camera"</code>{' '}
            para a selfie. Uploads dentro de iframe podem falhar em alguns
            navegadores de celular.
          </div>
          <div className={clsx(styles.callout, styles.calloutWarn)}>
            A página de KYC não envia postMessage para a sua página. Para saber
            o resultado, use os webhooks ACCOUNT_REGISTER_* ou consulte GET
            /api/v1/account-register/:id. Com redirectUrl, o usuário volta para
            você 5 segundos depois de um estado final.
          </div>
        </div>
      </div>
      <div className={clsx(styles.panel, styles.pad)}>
        <div className={styles.headRow}>
          <h3>Pré-visualização real</h3>
          <select
            aria-label='Status da pré-visualização'
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={styles.btn}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <iframe
          key={preview}
          src={preview}
          title='Pré-visualização do cadastro KYC'
          width='100%'
          height={640}
          style={{
            border: '1px solid var(--pg-line)',
            borderRadius: 10,
            maxWidth: 640,
            background: '#fff',
          }}
          allow='camera; clipboard-read; clipboard-write'
        />
        <p className={styles.why}>
          Esta é a página de demonstração da Woovi, a mesma dos docs, com o
          status escolhido.{' '}
          {mode !== 'iframe'
            ? 'No modo escolhido ela abriria fora da sua página.'
            : ''}
        </p>
      </div>
    </div>
  );
}
