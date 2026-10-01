import React, { useMemo } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useColorMode } from '@docusaurus/theme-common';

import type { State, Transition } from './types';
import styles from './Playground.module.css';

type StateData = State & { on: boolean };

const SIDES = [
  ['l', Position.Left],
  ['r', Position.Right],
  ['t', Position.Top],
  ['b', Position.Bottom],
] as const;

function StateNode({ data }: NodeProps<Node<StateData>>) {
  const tone =
    data.tone === 'muted'
      ? styles.toneMuted
      : data.tone === 'bad'
        ? styles.toneBad
        : data.tone === 'warn'
          ? styles.toneWarn
          : undefined;
  return (
    <div
      className={clsx(
        styles.sNode,
        data.terminal && styles.sTerminal,
        data.on && styles.sOn,
        tone,
      )}
    >
      {SIDES.map(([id, pos]) => (
        <Handle key={'t' + id} type='target' position={pos} id={'t' + id} />
      ))}
      {data.id}
      <small>{data.sub}</small>
      {SIDES.map(([id, pos]) => (
        <Handle key={'s' + id} type='source' position={pos} id={'s' + id} />
      ))}
    </div>
  );
}

function StartNode() {
  return (
    <div className={styles.startDot}>
      {SIDES.map(([id, pos]) => (
        <Handle key={id} type='source' position={pos} id={'s' + id} />
      ))}
    </div>
  );
}

const nodeTypes = { state: StateNode, start: StartNode };

export const ACCENT_HEX = { light: '#058a6c', dark: '#46cbae' };

type Props = {
  states: State[];
  transitions: Transition[];
  current?: string;
  last?: string | null;
  small?: boolean;
};

export default function StateMachine({
  states,
  transitions,
  current,
  last,
  small = true,
}: Props) {
  const { colorMode } = useColorMode();
  const accent = ACCENT_HEX[colorMode];
  const muted = colorMode === 'dark' ? '#8d949e' : '#8a9a94';

  const nodes = useMemo<Node[]>(() => {
    const start = transitions.find((t) => t.from === 'start');
    const first = start && states.find((s) => s.id === start.to);
    const out: Node[] = states.map((s) => ({
      id: s.id,
      type: 'state',
      position: { x: s.x, y: s.y },
      data: { ...s, on: s.id === current },
      draggable: true,
    }));
    if (first) {
      out.unshift({
        id: 'start',
        type: 'start',
        position: { x: first.x - 130, y: first.y + 18 },
        data: {},
        draggable: false,
      });
    }
    return out;
  }, [states, transitions, current]);

  const edges = useMemo<Edge[]>(
    () =>
      transitions.map((t) => {
        const active = t.id === last;
        return {
          id: t.id,
          source: t.from,
          target: t.to,
          sourceHandle: 's' + (t.sourceHandle ?? 'r'),
          targetHandle: 't' + (t.targetHandle ?? 'l'),
          label: t.label,
          type: 'smoothstep',
          animated: active,
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 4,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: active ? accent : muted,
          },
          style: {
            stroke: active ? accent : muted,
            strokeWidth: active ? 2.4 : 1.4,
          },
        };
      }),
    [transitions, last, accent, muted],
  );

  return (
    <div
      className={clsx(styles.flow, small && styles.flowSm)}
      aria-label='Máquina de estados'
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        colorMode={colorMode}
        fitView
        fitViewOptions={{ padding: 0.14 }}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        preventScrolling={false}
        minZoom={0.3}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
