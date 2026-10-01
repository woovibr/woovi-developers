import type { ComponentType } from 'react';

export type Actor = { id: string; title: string; sub?: string };

export type Callout = { tone?: 'info' | 'warn' | 'bad'; text: string };

export type Step = {
  /** message between two actors (from === to draws a self call) */
  from?: string;
  to?: string;
  /** actor id: draws a note over that lifeline instead of an arrow */
  note?: string;
  label: string;
  kind?: 'req' | 'res' | 'evt';
  bad?: boolean;
  optional?: boolean;
  title: string;
  text?: string;
  code?: string;
  lang?: string;
  callout?: Callout;
};

export type Scenario = { id: string; label: string; steps: Step[] };

export type State = {
  id: string;
  sub: string;
  x: number;
  y: number;
  terminal?: boolean;
  tone?: 'ok' | 'muted' | 'bad' | 'warn';
};

type Side = 'l' | 'r' | 't' | 'b';

export type Transition = {
  id: string;
  /** 'start' is the initial pseudo-state */
  from: string;
  to: string;
  label: string;
  sourceHandle?: Side;
  targetHandle?: Side;
};

export type Field = {
  id: string;
  label: string;
  /** API field name shown next to the label */
  api?: string;
  type: 'cents' | 'text' | 'number' | 'select' | 'id';
  default: string | number;
  options?: { value: string; label: string }[];
  hint?: string;
  wide?: boolean;
};

// form values and simulated resources are free-form JSON shaped per product
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Values = Record<string, any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Resource = Record<string, any> & { status: string };

export type LogEntry = {
  kind: 'api' | 'hook';
  title: string;
  /** HTTP status shown on the right */
  code?: number;
  note?: string;
  body: unknown;
  /** delay in ms before the entry shows up (simulates async delivery) */
  delay?: number;
};

export type Action = {
  id: string;
  label: string;
  /** statuses where the action is allowed */
  from: string[];
  /** transition id to animate in the state machine ('' for none) */
  transition: string;
  /** next status ('' keeps the current one) */
  to: string;
  primary?: boolean;
  apply?: (r: Resource) => Resource;
  log: (r: Resource) => LogEntry[];
  /** return entries to refuse the action (state stays the same) */
  reject?: (r: Resource) => LogEntry[] | null;
};

export type Lab = {
  title?: string;
  method: 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  /** path built from the form (e.g. /api/v1/charge/{id}/refund) */
  pathOf?: (v: Values) => string;
  fields: Field[];
  body: (v: Values) => Record<string, unknown> | null;
  /** transition id from 'start' */
  createTransition: string;
  /** no resource means the API refused the request (only the log is shown) */
  create: (v: Values) => { resource?: Resource; log: LogEntry[] };
  /** field id whose repeated value returns the same resource */
  idempotencyField?: string;
  /** custom answer when the idempotency field repeats */
  replay?: (r: Resource, v: Values) => LogEntry[];
  /** state-machine node to highlight (defaults to status) */
  stateOf?: (r: Resource) => string;
  actions: Action[];
  summary: (r: Resource) => [string, string][];
  qr?: (r: Resource) => string | undefined;
  /** one sentence per status explaining what the viewer can do */
  explain?: Record<string, string>;
  handler?: { label: string; language: string; code: string }[];
  handlerTitle?: string;
};

export type DocLink = { label: string; href: string };

export type PlaygroundConfig = {
  id: string;
  title: string;
  lede: string;
  docs: DocLink[];
  actors: Actor[];
  scenarios: Scenario[];
  states?: State[];
  transitions?: Transition[];
  statesTitle?: string;
  statesLede?: string;
  lab?: Lab;
  /** custom widget rendered before the sequence diagram */
  widget?: ComponentType;
  widgetTitle?: string;
  widgetLede?: string;
};
