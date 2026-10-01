import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import styles from '../Playground.module.css';

import {
  SAMPLE_PAYLOAD,
  SAMPLE_SIGNATURE,
  WOOVI_PUBLIC_KEY_BASE64,
} from './webhookSample';

async function importKey(): Promise<CryptoKey> {
  const pem = atob(WOOVI_PUBLIC_KEY_BASE64);
  const der = atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  const bytes = Uint8Array.from(der, (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'spki',
    bytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
}

async function verify(payload: string, signature: string): Promise<boolean> {
  const key = await importKey();
  const sig = Uint8Array.from(atob(signature.trim()), (c) => c.charCodeAt(0));
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    sig,
    new TextEncoder().encode(payload),
  );
}

type Result = { ok: boolean; text: string } | null;

function Verifier() {
  const [payload, setPayload] = useState(SAMPLE_PAYLOAD);
  const [signature, setSignature] = useState(SAMPLE_SIGNATURE);
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(() => {
      verify(payload, signature)
        .then(
          (ok) =>
            alive &&
            setResult(
              ok
                ? {
                    ok,
                    text: 'Assinatura válida: o corpo veio da Woovi e não foi alterado.',
                  }
                : {
                    ok,
                    text: 'Assinatura inválida: o corpo foi alterado ou a assinatura não é deste corpo.',
                  },
            ),
        )
        .catch(
          () =>
            alive &&
            setResult({
              ok: false,
              text: 'Não consegui ler a assinatura. Ela precisa estar em base64, como chega no header.',
            }),
        );
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [payload, signature]);

  const tamper = () =>
    setPayload((p) => p.replace('"value": 1000', '"value": 9000'));

  return (
    <div className={clsx(styles.panel, styles.pad)}>
      <div className={styles.headRow}>
        <h3>Valide x-webhook-signature agora</h3>
        <span className={clsx(styles.status, result?.ok && styles.statusOn)}>
          verificação real, no navegador
        </span>
      </div>
      <p className={styles.muted}>
        RSA-SHA256 com a chave pública da Woovi, via Web Crypto. O exemplo é o
        da documentação. Altere um caractere do corpo e veja a assinatura deixar
        de conferir.
      </p>
      <div className={styles.field}>
        <label htmlFor='pg-wh-payload'>
          Corpo bruto <code>request body</code>
        </label>
        <textarea
          id='pg-wh-payload'
          rows={7}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor='pg-wh-sig'>
          Assinatura <code>x-webhook-signature</code>
        </label>
        <textarea
          id='pg-wh-sig'
          rows={3}
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
        />
      </div>
      {result ? (
        <div className={result.ok ? styles.okBox : styles.koBox}>
          {result.text}
        </div>
      ) : null}
      <div className={styles.actions}>
        <button type='button' className={styles.btn} onClick={tamper}>
          Alterar o valor no corpo
        </button>
        <button
          type='button'
          className={styles.btn}
          onClick={() => setPayload(JSON.stringify(JSON.parse(payload)))}
        >
          Fazer JSON.parse + stringify
        </button>
        <button
          type='button'
          className={clsx(styles.btn, styles.ghost)}
          onClick={() => {
            setPayload(SAMPLE_PAYLOAD);
            setSignature(SAMPLE_SIGNATURE);
          }}
        >
          Restaurar exemplo
        </button>
      </div>
      <p className={styles.why}>
        O segundo botão mostra por que a validação usa o corpo bruto:
        reserializar o JSON muda os bytes e a assinatura não confere mais, mesmo
        com os mesmos dados.
      </p>
    </div>
  );
}

const ATTEMPTS = 8;

function Retry() {
  const [okAt, setOkAt] = useState(4);
  // first try at t=0; then waits of 10 × 2^n s
  let t = 0;
  const rows = Array.from({ length: ATTEMPTS + 1 }, (_, i) => {
    if (i > 0) t += 10 * 2 ** i;
    return { n: i, at: t };
  });
  const total = rows[rows.length - 1].at;
  const fmt = (s: number) =>
    s < 60
      ? `${s} s`
      : s < 3600
        ? `${Math.round(s / 60)} min`
        : `${(s / 3600).toFixed(1)} h`;
  return (
    <div className={clsx(styles.panel, styles.pad)}>
      <div className={styles.headRow}>
        <h3>Retentativas</h3>
        <span className={clsx(styles.mono, styles.muted)}>
          intervalo = 10 × 2^tentativa
        </span>
      </div>
      <p className={styles.muted}>
        A primeira entrega sai no momento do evento. Se o seu endpoint falhar, a
        Woovi tenta mais 8 vezes. Escolha quando ele volta a responder 200.
      </p>
      <div className={styles.field}>
        <label htmlFor='pg-retry'>Meu endpoint responde 200 na entrega</label>
        <select
          id='pg-retry'
          value={okAt}
          onChange={(e) => setOkAt(Number(e.target.value))}
        >
          <option value={0}>1ª (sem falha)</option>
          {rows.slice(1).map((r) => (
            <option key={r.n} value={r.n}>
              retentativa {r.n} · {fmt(r.at)} depois
            </option>
          ))}
          <option value={99}>nunca: todas falham</option>
        </select>
      </div>
      <div className={styles.timeline}>
        {rows.map((r) => {
          const state = r.n < okAt ? 'fail' : r.n === okAt ? 'ok' : 'skip';
          return (
            <div
              key={r.n}
              className={styles.tlRow}
              style={{ opacity: state === 'skip' ? 0.35 : 1 }}
            >
              <span className={styles.mono}>
                {r.n === 0 ? 'entrega' : `tentativa ${r.n}`}
              </span>
              <div className={styles.tlBar}>
                <div
                  className={clsx(
                    styles.tlFill,
                    state === 'fail' && styles.tlFillBad,
                  )}
                  style={{
                    width: `${Math.max(2, (r.at / total) * 100)}%`,
                    opacity: state === 'skip' ? 0.3 : 1,
                  }}
                />
              </div>
              <span
                className={clsx(
                  styles.mono,
                  state === 'ok'
                    ? styles.ok
                    : state === 'fail'
                      ? styles.ko
                      : styles.muted,
                )}
              >
                {state === 'ok' ? '200' : state === 'fail' ? 'erro' : '—'} ·{' '}
                {fmt(r.at)}
              </span>
            </div>
          );
        })}
      </div>
      <p className={styles.why}>
        {okAt === 99
          ? `Depois de ${fmt(total)} a Woovi desiste. Ainda dá para reenviar pela plataforma, em API/Plugins.`
          : okAt === 0
            ? 'Entregue de primeira.'
            : `Entregue ${fmt(rows[okAt].at)} depois do evento. Seu handler precisa aceitar o mesmo evento mais de uma vez.`}
      </p>
    </div>
  );
}

export default function WebhookVerifier() {
  return (
    <div className={styles.halves}>
      <Verifier />
      <Retry />
    </div>
  );
}
