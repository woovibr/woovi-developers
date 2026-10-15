import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
// eslint-disable-next-line import/no-unresolved
import CodeBlock from '@theme/CodeBlock';

import styles from './WebhookEventExplorer.module.css';
import { events } from './events';
import type { WebhookEvent } from './events';
import { generateAll } from './schemaGenerators';

type FormatId = 'json' | 'typescript' | 'jsonSchema' | 'yup' | 'zod';

type FormatOption = {
  id: FormatId;
  label: string;
  hint: string;
  language: string;
};

const FORMATS: FormatOption[] = [
  {
    id: 'json',
    label: 'JSON',
    hint: 'Sample payload as raw JSON.',
    language: 'json',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    hint: 'Inferred TypeScript type for the payload.',
    language: 'typescript',
  },
  {
    id: 'jsonSchema',
    label: 'JSON Schema',
    hint: 'Draft-07 JSON Schema describing the payload.',
    language: 'json',
  },
  {
    id: 'yup',
    label: 'Yup',
    hint: 'Yup validation schema for the payload.',
    language: 'typescript',
  },
  {
    id: 'zod',
    label: 'Zod',
    hint: 'Zod validation schema for the payload.',
    language: 'typescript',
  },
];

const groupByCategory = (list: WebhookEvent[]) => {
  const map = new Map<string, WebhookEvent[]>();
  list.forEach((evt) => {
    const arr = map.get(evt.category) ?? [];
    arr.push(evt);
    map.set(evt.category, arr);
  });
  return Array.from(map.entries());
};

// The explorer's state lives in the query string (?event=&q=&format=), so a
// link copied from the address bar reopens on the same event, search and tab
// — what support sends a customer to point them at one payload.
const PARAM = { event: 'event', search: 'q', format: 'format' } as const;

const readParams = () => new URLSearchParams(window.location.search);

// Accepts the slug (charge-completed) or the event name itself
// (OPENPIX:CHARGE_COMPLETED), so a link can be typed by hand.
const findEventId = (value: string | null): string | null => {
  if (!value) return null;
  const wanted = value.trim().toLowerCase();
  const found = events.find(
    (evt) => evt.id === wanted || evt.event.toLowerCase() === wanted,
  );
  return found?.id ?? null;
};

const findFormat = (value: string | null): FormatId | null =>
  FORMATS.find((f) => f.id === value)?.id ?? null;

const WebhookEventExplorer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(
    () => findEventId(readParams().get(PARAM.event)) ?? events[0].id,
  );
  const [format, setFormat] = useState<FormatId>(
    () => findFormat(readParams().get(PARAM.format)) ?? 'json',
  );
  const [search, setSearch] = useState(
    () => readParams().get(PARAM.search) ?? '',
  );
  const [copied, setCopied] = useState(false);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  // replaceState, not pushState: every keystroke in the search would
  // otherwise become a Back step. Defaults are left out of the URL.
  useEffect(() => {
    const params = readParams();
    // Dropped first so they are re-added in a fixed order: event, q, format.
    Object.values(PARAM).forEach((key) => params.delete(key));
    const set = (key: string, value: string, fallback: string) => {
      if (value && value !== fallback) params.set(key, value);
      else params.delete(key);
    };
    set(PARAM.event, selectedId, events[0].id);
    set(PARAM.search, search.trim(), '');
    set(PARAM.format, format, 'json');
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
  }, [selectedId, search, format]);

  // A shared link may point at an event far down the list.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return events;
    return events.filter(
      (evt) =>
        evt.event.toLowerCase().includes(term) ||
        evt.category.toLowerCase().includes(term) ||
        evt.description.toLowerCase().includes(term),
    );
  }, [search]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  const selected = useMemo(
    () => events.find((evt) => evt.id === selectedId) ?? events[0],
    [selectedId],
  );

  const generated = useMemo(
    () => generateAll(selected.payload, selected.event),
    [selected],
  );

  const code = useMemo(() => {
    switch (format) {
      case 'json':
        return JSON.stringify(selected.payload, null, 2);
      case 'typescript':
        return generated.typescript;
      case 'jsonSchema':
        return generated.jsonSchema;
      case 'yup':
        return generated.yup;
      case 'zod':
        return generated.zod;
    }
  }, [format, selected, generated]);

  const currentFormat = FORMATS.find((f) => f.id === format) ?? FORMATS[0];
  const formatHint = currentFormat.hint;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Eventos</div>
        <input
          className={styles.search}
          type='search'
          placeholder='Filtrar eventos…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {grouped.length === 0 && (
          <p style={{ fontSize: 13, opacity: 0.6 }}>Nenhum evento encontrado.</p>
        )}

        {grouped.map(([category, list]) => (
          <div key={category} className={styles.categoryGroup}>
            <div className={styles.categoryTitle}>{category}</div>
            <ul className={styles.eventList}>
              {list.map((evt) => (
                <li key={evt.id}>
                  <button
                    type='button'
                    className={clsx(
                      styles.eventItem,
                      evt.id === selectedId && styles.selected,
                    )}
                    ref={evt.id === selectedId ? selectedRef : undefined}
                    onClick={() => setSelectedId(evt.id)}
                  >
                    {evt.event}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <section className={styles.panel}>
        <header className={styles.eventHeader}>
          <span className={styles.eventCategory}>{selected.category}</span>
          <h2 className={styles.eventName}>{selected.event}</h2>
          <p className={styles.eventDescription}>{selected.description}</p>
          <a
            className={styles.eventDocsLink}
            href={selected.docsPath}
            target='_blank'
            rel='noreferrer'
          >
            Ver documentação completa →
          </a>
          <button
            type='button'
            className={styles.copyLink}
            onClick={copyLink}
            title='Copia a URL que abre este evento, com a busca e a aba atuais'
          >
            {copied ? 'Link copiado ✓' : 'Copiar link deste evento'}
          </button>
        </header>

        <div className={styles.tabs} role='tablist'>
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type='button'
              role='tab'
              aria-selected={format === f.id}
              className={clsx(styles.tab, format === f.id && styles.active)}
              onClick={() => setFormat(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className={styles.formatHint}>{formatHint}</p>

        <div className={styles.codeWrapper}>
          <CodeBlock language={currentFormat.language}>{code}</CodeBlock>
        </div>
      </section>
    </div>
  );
};

export { WebhookEventExplorer };
export default WebhookEventExplorer;
