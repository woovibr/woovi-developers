import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import type {
  Field,
  Lab as LabConfig,
  LogEntry,
  Resource,
  State,
  Transition,
  Values,
} from './types';
import StateMachine from './StateMachine';
import { Code, CodeTabs } from './Code';
import { brl, fakeSignature, json, qrSvg, snippets, uuid } from './utils';
import styles from './Playground.module.css';

type Shown = LogEntry & { id: string; t: string };

function initialValues(fields: Field[]): Values {
  return Object.fromEntries(
    fields.map((f) => [
      f.id,
      f.type === 'id' && f.default === 'uuid' ? uuid() : f.default,
    ]),
  );
}

function FieldInput({
  f,
  value,
  onChange,
}: {
  f: Field;
  value: Values[string];
  onChange: (v: string | number) => void;
}) {
  const id = 'pg-' + f.id;
  const label = (
    <label htmlFor={id}>
      {f.label} {f.api ? <code>{f.api}</code> : null}
    </label>
  );
  let input: React.ReactNode;
  if (f.type === 'select') {
    input = (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {f.options!.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (f.type === 'id') {
    input = (
      <div className={styles.inline}>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type='button'
          className={styles.btn}
          onClick={() => onChange(uuid())}
        >
          Novo UUID
        </button>
      </div>
    );
  } else if (f.type === 'cents' || f.type === 'number') {
    input = (
      <input
        id={id}
        type='number'
        min={0}
        step={1}
        value={value}
        onChange={(e) =>
          onChange(Math.max(0, parseInt(e.target.value || '0', 10)))
        }
      />
    );
  } else {
    input = (
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    );
  }
  const hint =
    f.type === 'cents'
      ? `em centavos · ${brl(Number(value) || 0)}${f.hint ? ' · ' + f.hint : ''}`
      : f.hint;
  return (
    <div
      className={clsx(styles.field, (f.wide || f.type === 'id') && styles.wide)}
    >
      {label}
      {input}
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}

function render(entry: LogEntry): { code: string; lang: string } {
  if (entry.kind === 'hook') {
    const head = `POST /webhooks/woovi HTTP/1.1\nContent-Type: application/json\nx-webhook-signature: ${fakeSignature()}`;
    return { code: head + '\n\n' + json(entry.body), lang: 'http' };
  }
  return { code: json(entry.body), lang: 'json' };
}

export default function Lab({
  lab,
  states,
  transitions,
}: {
  lab: LabConfig;
  states?: State[];
  transitions?: Transition[];
}) {
  const [values, setValues] = useState<Values>(() => initialValues(lab.fields));
  const [res, setRes] = useState<Resource | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [log, setLog] = useState<Shown[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const t0 = useRef(Date.now());
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => timers.current.forEach((t) => window.clearTimeout(t)),
    [],
  );

  const status = res ? res.status : 'NONE';
  const body = useMemo(() => lab.body(values), [lab, values]);
  const path = lab.pathOf ? lab.pathOf(values) : lab.path;
  const tabs = useMemo(
    () => snippets(lab.method, path, body),
    [lab, path, body],
  );

  const stamp = () => {
    const s = Math.round((Date.now() - t0.current) / 1000);
    return `+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  const push = (entries: LogEntry[]) => {
    entries.forEach((e) => {
      const add = () => setLog((l) => [{ ...e, id: uuid(), t: stamp() }, ...l]);
      if (e.delay) timers.current.push(window.setTimeout(add, e.delay));
      else add();
    });
  };

  const valid = lab.fields.every((f) =>
    f.type === 'cents'
      ? Number(values[f.id]) > 0
      : f.type === 'id'
        ? String(values[f.id]).trim() !== ''
        : true,
  );

  const submit = () => {
    if (!valid) return;
    const key = lab.idempotencyField;
    if (res && key && res[key] === values[key]) {
      if (lab.replay) {
        push(lab.replay(res, values));
        return;
      }
      push([
        {
          kind: 'api',
          title: `${lab.method} ${path}`,
          code: 200,
          note: `mesmo ${key}: a API devolveu o recurso existente, sem criar outro`,
          body: { status: res.status, [key]: res[key] },
        },
      ]);
      return;
    }
    timers.current.forEach((t) => window.clearTimeout(t));
    t0.current = Date.now();
    const { resource, log: entries } = lab.create(values);
    if (!resource) {
      push(entries);
      return;
    }
    setRes(resource);
    setLast(lab.createTransition);
    setOpen(null);
    setLog([]);
    push(entries);
  };

  const act = (a: LabConfig['actions'][number]) => {
    if (!res) return;
    const refused = a.reject?.(res);
    if (refused) {
      push(refused);
      return;
    }
    // an empty `to` keeps the status (reads, repeated payments, settings)
    const next = {
      ...(a.apply ? a.apply(res) : res),
      status: a.to || res.status,
    };
    setRes(next);
    if (a.transition) setLast(a.transition);
    push(a.log(next));
  };

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    setRes(null);
    setLast(null);
    setLog([]);
    setOpen(null);
    setValues(initialValues(lab.fields));
  };

  const qr = res && lab.qr ? lab.qr(res) : undefined;
  const qrMarkup = useMemo(() => (qr ? qrSvg(qr) : ''), [qr]);
  const explain = lab.explain?.[status];

  return (
    <div className={styles.halves}>
      <div className={styles.col}>
        <form
          className={clsx(styles.panel, styles.pad)}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className={styles.headRow}>
            <h3>
              <span className={clsx(styles.chip, styles.chipPost)}>
                {lab.method}
              </span>{' '}
              <code>{path}</code>
            </h3>
            <span className={styles.sim}>simulado · nada sai do navegador</span>
          </div>
          <div className={styles.fields}>
            {lab.fields.map((f) => (
              <FieldInput
                key={f.id}
                f={f}
                value={values[f.id]}
                onChange={(v) => setValues((x) => ({ ...x, [f.id]: v }))}
              />
            ))}
          </div>
          <CodeTabs tabs={tabs} />
          <div className={styles.actions}>
            <button
              type='submit'
              className={clsx(styles.btn, styles.primary)}
              disabled={!valid}
            >
              Enviar requisição
            </button>
            {res ? (
              <button
                type='button'
                className={clsx(styles.btn, styles.ghost)}
                onClick={reset}
              >
                Recomeçar
              </button>
            ) : null}
          </div>
        </form>

        {lab.handler ? (
          <div className={clsx(styles.panel, styles.pad)}>
            <h3>{lab.handlerTitle ?? 'Seu endpoint de webhook'}</h3>
            <p className={styles.muted}>
              O código que recebe os eventos ao lado: valide a assinatura,
              processe de forma idempotente e responda 200.
            </p>
            <CodeTabs tabs={lab.handler} groupId='playground-handler' />
          </div>
        ) : null}
      </div>

      <div className={styles.col}>
        {states && transitions ? (
          <StateMachine
            states={states}
            transitions={transitions}
            current={res && lab.stateOf ? lab.stateOf(res) : status}
            last={last}
          />
        ) : null}

        <div className={clsx(styles.panel, styles.pad)}>
          <div className={styles.headRow}>
            <h3>{lab.title ?? 'Recurso'}</h3>
            <span className={clsx(styles.status, res && styles.statusOn)}>
              {res ? status : 'não criado'}
            </span>
          </div>
          <div className={clsx(styles.qrRow, !lab.qr && styles.noQr)}>
            {lab.qr ? (
              qrMarkup ? (
                <div
                  className={styles.qrTile}
                  aria-label='QR Code Pix simulado'
                  dangerouslySetInnerHTML={{ __html: qrMarkup }}
                />
              ) : (
                <div className={clsx(styles.qrTile, styles.qrEmpty)}>
                  O QR Code aparece aqui depois da requisição.
                </div>
              )
            ) : null}
            <div className={styles.col}>
              {res ? (
                <dl className={styles.kv}>
                  {lab.summary(res).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              ) : (
                <p className={styles.muted}>
                  Preencha o formulário e envie a requisição para ver a resposta
                  e liberar as próximas ações.
                </p>
              )}
              {qr ? (
                <div className={styles.brcode} title='brCode (copia e cola)'>
                  {qr}
                </div>
              ) : null}
            </div>
          </div>
          <div className={styles.actions}>
            {lab.actions.map((a) => (
              <button
                key={a.id}
                type='button'
                className={clsx(styles.btn, a.primary && styles.primary)}
                disabled={!res || !a.from.includes(status)}
                onClick={() => act(a)}
              >
                {a.label}
              </button>
            ))}
          </div>
          {explain ? <p className={styles.why}>{explain}</p> : null}
        </div>

        <div className={styles.panel}>
          <div className={clsx(styles.logHead, styles.headRow)}>
            <h3>Chamadas e eventos</h3>
            <span className={clsx(styles.mono, styles.muted)}>
              mais recente primeiro
            </span>
          </div>
          {log.length ? (
            <ul className={styles.log}>
              {log.map((e) => {
                const r = open === e.id ? render(e) : null;
                return (
                  <li key={e.id}>
                    <button
                      type='button'
                      className={styles.logRow}
                      aria-expanded={open === e.id}
                      onClick={() => setOpen(open === e.id ? null : e.id)}
                    >
                      <span className={clsx(styles.mono, styles.muted)}>
                        {e.t}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          className={clsx(
                            styles.chip,
                            e.kind === 'hook'
                              ? styles.chipEvt
                              : styles.chipPost,
                          )}
                        >
                          {e.kind === 'hook' ? 'webhook' : 'api'}
                        </span>{' '}
                        <span
                          className={styles.mono}
                          style={{ overflowWrap: 'anywhere' }}
                        >
                          {e.title}
                        </span>
                        {e.note ? (
                          <>
                            <br />
                            <span
                              className={styles.muted}
                              style={{ fontSize: 12.5 }}
                            >
                              {e.note}
                            </span>
                          </>
                        ) : null}
                      </span>
                      <span
                        className={
                          e.code !== 0 && (e.code ?? 200) < 300
                            ? styles.ok
                            : styles.ko
                        }
                      >
                        {e.code === 0 ? '—' : (e.code ?? 200)}
                      </span>
                    </button>
                    {r ? (
                      <div className={styles.logBody}>
                        <Code code={r.code} language={r.lang} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}>
              Nada ainda. Cada chamada à API e cada webhook que a Woovi enviaria
              aparecem aqui, com o payload.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
