import React, { useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import {
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useColorMode } from '@docusaurus/theme-common';

import { ACCENT_HEX } from './StateMachine';
import styles from './Playground.module.css';

export type Option = {
  id: string;
  label: string;
  hint?: string;
  /** next question id; omitted → question.next; null → ends the flow */
  next?: string | null;
  /** marks an option that leaves this flow (e.g. points to another guide) */
  leaf?: boolean;
};
export type Question = {
  id: string;
  q: string;
  next?: string | null;
  opts: Option[];
};
export type Answers = Record<string, string>;

export function nextOf(q: Question, o: Option): string | null {
  if (o.leaf) return null;
  if (o.next !== undefined) return o.next;
  return q.next ?? null;
}

/** questions on the current path, in order */
export function pathOf(
  questions: Record<string, Question>,
  root: string,
  ans: Answers,
): Question[] {
  const out: Question[] = [];
  let id: string | null = root;
  while (id && questions[id]) {
    const q: Question = questions[id];
    out.push(q);
    const chosen = q.opts.find((o) => o.id === ans[q.id]);
    if (!chosen) break;
    id = nextOf(q, chosen);
  }
  return out;
}

export function isDone(
  questions: Record<string, Question>,
  root: string,
  ans: Answers,
): boolean {
  const path = pathOf(questions, root, ans);
  const last = path[path.length - 1];
  return !!last && !!ans[last.id];
}

type QData = { q: string; n: number; state: string };
type OData = Option & { qid: string; state: string };
type RData = { label: string; sub: string; ready: boolean };

function QNode({ data }: NodeProps<Node<QData>>) {
  return (
    <div
      className={clsx(
        styles.qNode,
        data.state === 'current' && styles.qCurrent,
      )}
    >
      <Handle type='target' position={Position.Top} />
      <div className={styles.t}>Pergunta {data.n}</div>
      <div className={styles.q}>{data.q}</div>
      <Handle type='source' position={Position.Bottom} />
    </div>
  );
}

function ONode({ data }: NodeProps<Node<OData>>) {
  return (
    <div
      className={clsx(
        styles.oNode,
        data.state === 'chosen' && styles.oChosen,
        data.state === 'dim' && styles.oDim,
        data.state === 'available' && styles.oAvailable,
      )}
      title={data.hint}
    >
      <Handle type='target' position={Position.Top} />
      {data.label}
      {data.leaf ? <span className={styles.leaf}>→ outro guia</span> : null}
      <Handle type='source' position={Position.Bottom} />
    </div>
  );
}

function RNode({ data }: NodeProps<Node<RData>>) {
  return (
    <div className={clsx(styles.rNode, data.ready && styles.rReady)}>
      <Handle type='target' position={Position.Top} />
      <strong>{data.label}</strong>
      <div className={clsx(styles.mono, styles.muted)}>{data.sub}</div>
    </div>
  );
}

const nodeTypes = { q: QNode, o: ONode, r: RNode };

const W = 170;
const ROW = 150;

export default function QuestionFlow({
  questions,
  root,
  answers,
  onAnswer,
  resultLabel,
  resultSub,
}: {
  questions: Record<string, Question>;
  root: string;
  answers: Answers;
  onAnswer: (qid: string, oid: string) => void;
  resultLabel: string;
  resultSub: (done: boolean) => string;
}) {
  const { colorMode } = useColorMode();
  const accent = ACCENT_HEX[colorMode];
  const idle = colorMode === 'dark' ? '#606770' : '#b6c2bd';
  const path = pathOf(questions, root, answers);
  const done = isDone(questions, root, answers);
  const rf = useRef<ReactFlowInstance | null>(null);

  const { nodes, edges } = useMemo(() => {
    const ns: Node[] = [];
    const es: Edge[] = [];
    const widest = Math.max(...path.map((q) => q.opts.length));
    const cx = (widest * W) / 2;
    path.forEach((q, qi) => {
      const y = qi * ROW;
      const answered = !!answers[q.id];
      ns.push({
        id: 'q-' + q.id,
        type: 'q',
        position: { x: cx - 115, y },
        data: { q: q.q, n: qi + 1, state: answered ? 'done' : 'current' },
        draggable: false,
      });
      const span = q.opts.length * W;
      q.opts.forEach((o, oi) => {
        const chosen = answers[q.id] === o.id;
        const state = chosen ? 'chosen' : answered ? 'dim' : 'available';
        const oid = `o-${q.id}-${o.id}`;
        ns.push({
          id: oid,
          type: 'o',
          position: { x: cx - span / 2 + oi * W + 10, y: y + 74 },
          data: { ...o, qid: q.id, state },
          draggable: false,
        });
        es.push({
          id: 'e-' + oid,
          source: 'q-' + q.id,
          target: oid,
          type: 'smoothstep',
          style: {
            stroke: chosen ? accent : idle,
            strokeWidth: chosen ? 2 : 1.2,
          },
        });
        if (chosen) {
          const nx = nextOf(q, o);
          const target = nx && questions[nx] ? 'q-' + nx : 'result';
          es.push({
            id: 'n-' + oid,
            source: oid,
            target,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: accent,
              width: 16,
              height: 16,
            },
            style: { stroke: accent, strokeWidth: 2 },
          });
        }
      });
    });
    ns.push({
      id: 'result',
      type: 'r',
      position: { x: cx - 120, y: path.length * ROW },
      data: { label: resultLabel, sub: resultSub(done), ready: done },
      draggable: false,
    });
    return { nodes: ns, edges: es };
  }, [path, answers, questions, accent, idle, done, resultLabel, resultSub]);

  useEffect(() => {
    const t = window.setTimeout(
      () => rf.current?.fitView({ padding: 0.12, duration: 300 }),
      40,
    );
    return () => window.clearTimeout(t);
  }, [path.length]);

  return (
    <div className={styles.flow} aria-label='Mapa das perguntas'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        onInit={(i) => {
          rf.current = i;
        }}
        onNodeClick={(_, n) => {
          if (n.type === 'o') {
            const d = n.data as OData;
            onAnswer(d.qid, d.id);
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        preventScrolling={false}
        minZoom={0.3}
        maxZoom={1.4}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

/** side panel: trail of answers + current question as buttons */
export function QuestionPanel({
  questions,
  root,
  answers,
  setAnswers,
}: {
  questions: Record<string, Question>;
  root: string;
  answers: Answers;
  setAnswers: (a: Answers) => void;
}) {
  const path = pathOf(questions, root, answers);
  const current = path.find((q) => !answers[q.id]);
  const answer = (qid: string, oid: string) =>
    setAnswers(answerOn(questions, root, answers, qid, oid));
  return (
    <>
      {path.some((q) => answers[q.id]) ? (
        <div className={styles.trail} aria-label='Suas respostas'>
          {path
            .filter((q) => answers[q.id])
            .map((q, i) => {
              const o = q.opts.find((x) => x.id === answers[q.id])!;
              return (
                <button
                  key={q.id}
                  type='button'
                  title='Mudar esta resposta'
                  onClick={() =>
                    setAnswers(
                      Object.fromEntries(
                        path.slice(0, i).map((p) => [p.id, answers[p.id]]),
                      ),
                    )
                  }
                >
                  {o.label} ✕
                </button>
              );
            })}
        </div>
      ) : null}
      {current ? (
        <div className={clsx(styles.panel, styles.pad)}>
          <div className={styles.qn}>Pergunta {path.indexOf(current) + 1}</div>
          <h3>{current.q}</h3>
          <div className={styles.opts}>
            {current.opts.map((o) => (
              <button
                key={o.id}
                type='button'
                className={styles.opt}
                onClick={() => answer(current.id, o.id)}
              >
                <b>{o.label}</b>
                {o.hint ? <span>{o.hint}</span> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** answering a question drops every answer that came after it */
export function answerOn(
  questions: Record<string, Question>,
  root: string,
  answers: Answers,
  qid: string,
  oid: string,
): Answers {
  const path = pathOf(questions, root, answers);
  const idx = path.findIndex((q) => q.id === qid);
  if (idx < 0) return answers;
  const kept = Object.fromEntries(
    path.slice(0, idx).map((q) => [q.id, answers[q.id]]),
  );
  return { ...kept, [qid]: oid };
}
