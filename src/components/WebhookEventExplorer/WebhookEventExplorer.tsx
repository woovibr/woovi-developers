import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import styles from './WebhookEventExplorer.module.css';
import { events } from './events';
import type { WebhookEvent } from './events';
import { generateAll } from './schemaGenerators';

type FormatId = 'json' | 'typescript' | 'jsonSchema' | 'yup' | 'zod';

type FormatOption = {
  id: FormatId;
  label: string;
  hint: string;
};

const FORMATS: FormatOption[] = [
  { id: 'json', label: 'JSON', hint: 'Sample payload as raw JSON.' },
  {
    id: 'typescript',
    label: 'TypeScript',
    hint: 'Inferred TypeScript type for the payload.',
  },
  {
    id: 'jsonSchema',
    label: 'JSON Schema',
    hint: 'Draft-07 JSON Schema describing the payload.',
  },
  { id: 'yup', label: 'Yup', hint: 'Yup validation schema for the payload.' },
  { id: 'zod', label: 'Zod', hint: 'Zod validation schema for the payload.' },
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

const WebhookEventExplorer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(events[0].id);
  const [format, setFormat] = useState<FormatId>('json');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

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

  const formatHint =
    FORMATS.find((f) => f.id === format)?.hint ?? '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Eventos</div>
        <input
          className={styles.search}
          type="search"
          placeholder="Filtrar eventos…"
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
                    type="button"
                    className={clsx(
                      styles.eventItem,
                      evt.id === selectedId && styles.selected,
                    )}
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
            target="_blank"
            rel="noreferrer"
          >
            Ver documentação completa →
          </a>
        </header>

        <div className={styles.tabs} role="tablist">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
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
          <button
            type="button"
            className={clsx(styles.copyButton, copied && styles.copied)}
            onClick={handleCopy}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <pre className={styles.codeBlock}>{code}</pre>
        </div>
      </section>
    </div>
  );
};

export { WebhookEventExplorer };
export default WebhookEventExplorer;
