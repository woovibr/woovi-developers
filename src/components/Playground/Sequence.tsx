import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import type { Actor, Scenario, Step } from './types';
import { Code } from './Code';
import styles from './Playground.module.css';

const W = 760;
const TOP = 64;
const ROW = 42;

function xs(actors: Actor[]): Record<string, number> {
  const margin = 95;
  const gap = actors.length > 1 ? (W - margin * 2) / (actors.length - 1) : 0;
  return Object.fromEntries(actors.map((a, i) => [a.id, margin + i * gap]));
}

function Diagram({
  actors,
  steps,
  cur,
  onPick,
}: {
  actors: Actor[];
  steps: Step[];
  cur: number;
  onPick: (i: number) => void;
}) {
  const X = xs(actors);
  const H = TOP + steps.length * ROW + 30;
  const boxW = Math.min(150, (W - 40) / actors.length - 12);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role='img'
      aria-label='Diagrama de sequência'
    >
      <defs>
        {['', '-ink', '-acc', '-bad', '-warn'].map((c) => (
          <marker
            key={c}
            id={'pgah' + c}
            viewBox='0 0 10 10'
            refX='9'
            refY='5'
            markerWidth='7'
            markerHeight='7'
            orient='auto-start-reverse'
          >
            <path d='M0,0 L10,5 L0,10 z' className={'ah' + c} />
          </marker>
        ))}
      </defs>
      {actors.map((a) => (
        <g key={a.id}>
          <line className='life' x1={X[a.id]} x2={X[a.id]} y1={50} y2={H - 6} />
          <rect
            className='actor-box'
            x={X[a.id] - boxW / 2}
            y={6}
            width={boxW}
            height={42}
            rx={8}
          />
          <text className='actor-t' x={X[a.id]} y={25} textAnchor='middle'>
            {a.title}
          </text>
          {a.sub ? (
            <text className='actor-s' x={X[a.id]} y={40} textAnchor='middle'>
              {a.sub}
            </text>
          ) : null}
        </g>
      ))}
      {steps.map((s, i) => {
        const y = TOP + i * ROW + 22;
        const state = i < cur ? 'past' : i === cur ? 'cur' : 'future';
        const cls = clsx(
          'msg',
          state,
          s.kind === 'res' && 'res',
          s.bad && 'bad',
          s.kind === 'evt' && 'evt',
        );
        const mk =
          state === 'cur'
            ? s.bad
              ? '-bad'
              : s.kind === 'evt'
                ? '-warn'
                : '-acc'
            : state === 'past'
              ? s.bad
                ? '-bad'
                : '-ink'
              : '';
        const hit = (
          <rect
            className='hit'
            x={8}
            y={y - 24}
            width={W - 16}
            height={ROW}
            rx={6}
            onClick={() => onPick(i)}
          />
        );
        const num = (
          <text className='num' x={14} y={y + 4}>
            {String(i + 1).padStart(2, '0')}
          </text>
        );
        if (s.note) {
          const nx = Math.min(Math.max(X[s.note], 170), W - 170);
          return (
            <g key={i} className={clsx('note', cls)}>
              {hit}
              {num}
              <rect
                className='box'
                x={nx - 150}
                y={y - 16}
                width={300}
                height={26}
                rx={6}
              />
              <text className='nt' x={nx} y={y + 1} textAnchor='middle'>
                {s.label}
              </text>
            </g>
          );
        }
        const x1 = X[s.from!];
        const x2 = X[s.to!];
        if (s.from === s.to) {
          const left = x1 > W - 200;
          const d = left
            ? `M${x1},${y - 8} h-36 v16 h34`
            : `M${x1},${y - 8} h36 v16 h-34`;
          return (
            <g key={i} className={cls}>
              {hit}
              {num}
              <path d={d} markerEnd={`url(#pgah${mk})`} />
              <text
                className='lbl'
                x={left ? x1 - 44 : x1 + 44}
                y={y + 4}
                textAnchor={left ? 'end' : 'start'}
              >
                {s.label}
              </text>
            </g>
          );
        }
        const dir = x2 > x1 ? 1 : -1;
        return (
          <g
            key={i}
            className={cls}
            style={
              s.optional
                ? { opacity: state === 'future' ? 0.18 : 0.6 }
                : undefined
            }
          >
            {hit}
            {num}
            <line
              x1={x1}
              y1={y}
              x2={x2 - dir * 2}
              y2={y}
              markerEnd={`url(#pgah${mk})`}
              style={s.optional ? { strokeDasharray: '2 3' } : undefined}
            />
            <text
              className='lbl'
              x={(x1 + x2) / 2}
              y={y - 7}
              textAnchor='middle'
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Sequence({
  actors,
  scenarios,
  scenario,
  onScenario,
}: {
  actors: Actor[];
  scenarios: Scenario[];
  scenario?: string;
  onScenario?: (id: string) => void;
}) {
  const [own, setOwn] = useState(scenarios[0].id);
  const active = scenario ?? own;
  const setActive = onScenario ?? setOwn;
  const sc = scenarios.find((s) => s.id === active) ?? scenarios[0];
  const steps = sc.steps;
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCur(0);
    setPlaying(false);
  }, [active]);

  useEffect(() => {
    if (!playing) return undefined;
    if (cur >= steps.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setCur((c) => c + 1), 1600);
    return () => clearTimeout(t);
  }, [playing, cur, steps.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        !root.current?.matches(':hover') ||
        /INPUT|SELECT|TEXTAREA/.test(el.tagName)
      )
        return;
      if (e.key === 'ArrowRight')
        setCur((c) => Math.min(c + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setCur((c) => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steps.length]);

  const s = steps[Math.min(cur, steps.length - 1)];
  const name = (id?: string) => actors.find((a) => a.id === id)?.title ?? '';
  const who = s.note
    ? name(s.note)
    : s.from === s.to
      ? name(s.from)
      : `${name(s.from)} → ${name(s.to)}`;

  return (
    <div className={styles.col} ref={root}>
      <div className={styles.toolbar}>
        {scenarios.length > 1 ? (
          <div className={styles.seg} role='tablist' aria-label='Cenário'>
            {scenarios.map((x) => (
              <button
                key={x.id}
                type='button'
                role='tab'
                aria-selected={x.id === sc.id}
                className={clsx(x.id === sc.id && styles.on)}
                onClick={() => setActive(x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className={styles.ctrl}>
          <button
            type='button'
            className={clsx(styles.btn, styles.ghost)}
            aria-label='Passo anterior'
            disabled={cur === 0}
            onClick={() => {
              setPlaying(false);
              setCur(cur - 1);
            }}
          >
            ←
          </button>
          <span className={styles.count}>
            {cur + 1} / {steps.length}
          </span>
          <button
            type='button'
            className={clsx(styles.btn, styles.ghost)}
            aria-label='Próximo passo'
            disabled={cur === steps.length - 1}
            onClick={() => {
              setPlaying(false);
              setCur(cur + 1);
            }}
          >
            →
          </button>
          <button
            type='button'
            className={clsx(styles.btn, styles.primary)}
            onClick={() => {
              if (cur >= steps.length - 1) setCur(0);
              setPlaying(!playing);
            }}
          >
            {playing ? 'Pausar' : 'Reproduzir'}
          </button>
        </div>
      </div>
      <div className={styles.split}>
        <div className={clsx(styles.panel, styles.seqCanvas)}>
          <Diagram
            actors={actors}
            steps={steps}
            cur={cur}
            onPick={(i) => {
              setPlaying(false);
              setCur(i);
            }}
          />
        </div>
        <div
          className={clsx(styles.panel, styles.pad, styles.sticky)}
          aria-live='polite'
        >
          <div className={styles.who}>
            Passo {cur + 1} · {who}
          </div>
          <h3>{s.title}</h3>
          {s.text ? <p className={styles.muted}>{s.text}</p> : null}
          {s.code ? <Code code={s.code} language={s.lang ?? 'json'} /> : null}
          {s.callout ? (
            <div
              className={clsx(
                styles.callout,
                s.callout.tone === 'warn' && styles.calloutWarn,
                s.callout.tone === 'bad' && styles.calloutBad,
              )}
            >
              {s.callout.text}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
