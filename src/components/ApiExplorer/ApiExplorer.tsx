import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';

import { generateAll } from '../WebhookEventExplorer/schemaGenerators';
import styles from './ApiExplorer.module.css';
import { endpoints } from './endpoints';
import type { ApiEndpoint, ApiExample } from './endpoints';

type FormatId = 'json' | 'typescript' | 'jsonSchema' | 'yup' | 'zod';

type FormatOption = {
  id: FormatId;
  label: string;
  hint: string;
  language: string;
};

type Side = 'request' | 'response';

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

const groupByCategory = (list: ApiEndpoint[]) => {
  const map = new Map<string, ApiEndpoint[]>();
  list.forEach((endpoint) => {
    const arr = map.get(endpoint.category) ?? [];
    arr.push(endpoint);
    map.set(endpoint.category, arr);
  });
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
};

const methodClass = (method: string) =>
  ({
    GET: styles.methodGET,
    POST: styles.methodPOST,
    PUT: styles.methodPUT,
    PATCH: styles.methodPATCH,
    DELETE: styles.methodDELETE,
  })[method] ?? styles.methodGET;

const buildTypeName = (endpoint: ApiEndpoint, side: Side) => {
  const slug = endpoint.id
    .replace(/[-_]+/g, ' ')
    .replace(/\s+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase());
  return `${slug}${side === 'request' ? 'Request' : 'Response'}`;
};

const ApiExplorer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(endpoints[0].id);
  const [side, setSide] = useState<Side>('request');
  const [format, setFormat] = useState<FormatId>('json');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return endpoints;
    return endpoints.filter(
      (e) =>
        e.path.toLowerCase().includes(term) ||
        e.method.toLowerCase().includes(term) ||
        e.summary.toLowerCase().includes(term) ||
        e.category.toLowerCase().includes(term),
    );
  }, [search]);

  const grouped = useMemo(() => groupByCategory(filtered), [filtered]);

  const selected = useMemo(
    () => endpoints.find((e) => e.id === selectedId) ?? endpoints[0],
    [selectedId],
  );

  const hasRequest = selected.requestExamples.length > 0;
  const hasResponse = selected.responseExamples.length > 0;

  // Auto-correct side if current selection has no examples for the chosen side
  useEffect(() => {
    if (side === 'request' && !hasRequest && hasResponse) setSide('response');
    if (side === 'response' && !hasResponse && hasRequest) setSide('request');
    setExampleIndex(0);
  }, [selectedId, hasRequest, hasResponse, side]);

  const examples: ApiExample[] =
    side === 'request' ? selected.requestExamples : selected.responseExamples;

  const safeIndex = Math.min(exampleIndex, Math.max(examples.length - 1, 0));
  const currentExample = examples[safeIndex];

  const generated = useMemo(() => {
    if (!currentExample) return null;
    return generateAll(
      currentExample.value as Record<string, unknown>,
      buildTypeName(selected, side),
    );
  }, [currentExample, selected, side]);

  const code = useMemo(() => {
    if (!currentExample) return '';
    if (!generated) return '';
    switch (format) {
      case 'json':
        return JSON.stringify(currentExample.value, null, 2);
      case 'typescript':
        return generated.typescript;
      case 'jsonSchema':
        return generated.jsonSchema;
      case 'yup':
        return generated.yup;
      case 'zod':
        return generated.zod;
    }
  }, [format, currentExample, generated]);

  const currentFormat = FORMATS.find((f) => f.id === format) ?? FORMATS[0];
  const formatHint = currentFormat.hint;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Endpoints</div>
        <input
          className={styles.search}
          type='search'
          placeholder='Filtrar endpoints…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {grouped.length === 0 && (
          <p className={styles.empty}>Nenhum endpoint encontrado.</p>
        )}

        {grouped.map(([category, list]) => (
          <div key={category} className={styles.categoryGroup}>
            <div className={styles.categoryTitle}>{category}</div>
            <ul className={styles.endpointList}>
              {list.map((endpoint) => (
                <li key={endpoint.id}>
                  <button
                    type='button'
                    className={clsx(
                      styles.endpointItem,
                      endpoint.id === selectedId && styles.selected,
                    )}
                    onClick={() => setSelectedId(endpoint.id)}
                  >
                    <span
                      className={clsx(
                        styles.method,
                        methodClass(endpoint.method),
                      )}
                    >
                      {endpoint.method}
                    </span>
                    <span className={styles.endpointPath}>{endpoint.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <section className={styles.panel}>
        <header className={styles.endpointHeader}>
          <span className={styles.endpointCategory}>{selected.category}</span>
          <div className={styles.endpointTitleRow}>
            <span
              className={clsx(styles.method, methodClass(selected.method))}
            >
              {selected.method}
            </span>
            <h2 className={styles.endpointPathFull}>{selected.path}</h2>
          </div>
          {selected.summary && (
            <p className={styles.endpointSummary}>{selected.summary}</p>
          )}
        </header>

        <div className={styles.controlRow}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Tipo</span>
            <div className={styles.segment} role='tablist'>
              <button
                type='button'
                role='tab'
                aria-selected={side === 'request'}
                disabled={!hasRequest}
                className={clsx(
                  styles.segmentBtn,
                  side === 'request' && styles.segmentActive,
                )}
                onClick={() => setSide('request')}
              >
                Request
              </button>
              <button
                type='button'
                role='tab'
                aria-selected={side === 'response'}
                disabled={!hasResponse}
                className={clsx(
                  styles.segmentBtn,
                  side === 'response' && styles.segmentActive,
                )}
                onClick={() => setSide('response')}
              >
                Response
              </button>
            </div>
          </div>

          {examples.length > 1 && (
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Exemplo</span>
              <select
                className={styles.exampleSelect}
                value={safeIndex}
                onChange={(e) => setExampleIndex(Number(e.target.value))}
              >
                {examples.map((ex, idx) => (
                  <option key={ex.name} value={idx}>
                    {ex.summary || ex.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

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

        {currentExample ? (
          <div className={styles.codeWrapper}>
            <CodeBlock language={currentFormat.language}>{code}</CodeBlock>
          </div>
        ) : (
          <p className={styles.empty}>
            Sem exemplo {side === 'request' ? 'de requisição' : 'de resposta'}{' '}
            disponível para este endpoint.
          </p>
        )}
      </section>
    </div>
  );
};

export { ApiExplorer };
export default ApiExplorer;
