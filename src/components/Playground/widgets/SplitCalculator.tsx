import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import { CodeTabs } from '../Code';
import { brl, snippets, uuid } from '../utils';
import styles from '../Playground.module.css';

type Mode = 'pct' | 'fixed';
type Part = {
  id: string;
  pixKey: string;
  mode: Mode;
  amount: number;
  splitType: string;
};

const TYPES = [
  {
    value: 'SPLIT_SUB_ACCOUNT',
    label: 'SPLIT_SUB_ACCOUNT · subconta (virtual)',
  },
  {
    value: 'SPLIT_INTERNAL_TRANSFER',
    label: 'SPLIT_INTERNAL_TRANSFER · conta da sua empresa',
  },
  { value: 'SPLIT_PARTNER', label: 'SPLIT_PARTNER · parceiro' },
];

const EXPLAIN: Record<string, string> = {
  SPLIT_SUB_ACCOUNT:
    'Crédito virtual na subconta. Nada sai da conta principal até a subconta sacar.',
  SPLIT_INTERNAL_TRANSFER:
    'Transferência para outra conta da sua empresa. Só via API; é o tipo usado para levar a taxa da plataforma para a conta principal no BaaS.',
  SPLIT_PARTNER:
    'Markup do parceiro. A taxa costuma ser configurada na plataforma (Minhas Empresas → Ajustes), não por cobrança.',
};

const cents = (total: number, p: Part) =>
  p.mode === 'pct' ? Math.floor(total * (p.amount / 100)) : p.amount;

export default function SplitCalculator() {
  const [total, setTotal] = useState(10000);
  const [parts, setParts] = useState<Part[]>([
    {
      id: 'a',
      pixKey: 'loja-parceira@exemplo.com',
      mode: 'pct',
      amount: 20,
      splitType: 'SPLIT_SUB_ACCOUNT',
    },
    {
      id: 'b',
      pixKey: 'entregador@exemplo.com',
      mode: 'fixed',
      amount: 1500,
      splitType: 'SPLIT_SUB_ACCOUNT',
    },
  ]);
  const computed = parts.map((p) => ({ ...p, value: cents(total, p) }));
  const sum = computed.reduce((s, p) => s + p.value, 0);
  const rest = total - sum;
  const over = rest < 0;
  const body = useMemo(
    () => ({
      correlationID: 'pedido-1042',
      value: total,
      splits: computed.map((p) => ({
        pixKey: p.pixKey,
        value: p.value,
        splitType: p.splitType,
      })),
    }),
    [total, computed],
  );
  const set = (id: string, patch: Partial<Part>) =>
    setParts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className={styles.halves}>
      <div className={clsx(styles.panel, styles.pad)}>
        <div className={styles.headRow}>
          <h3>Divida o valor</h3>
          <span className={clsx(styles.mono, styles.muted)}>
            a API só aceita centavos
          </span>
        </div>
        <div className={styles.field}>
          <label htmlFor='pg-split-total'>
            Valor da cobrança <code>value</code>
          </label>
          <input
            id='pg-split-total'
            type='number'
            min={1}
            value={total}
            onChange={(e) =>
              setTotal(Math.max(0, parseInt(e.target.value || '0', 10)))
            }
          />
          <span className={styles.hint}>em centavos · {brl(total)}</span>
        </div>
        {computed.map((p, i) => (
          <div
            key={p.id}
            className={clsx(styles.panel, styles.pad)}
            style={{ background: 'var(--pg-bg2)' }}
          >
            <div className={styles.headRow}>
              <strong>Parte {i + 1}</strong>
              <span className={styles.mono}>{brl(p.value)}</span>
            </div>
            <div className={styles.fields}>
              <div className={clsx(styles.field, styles.wide)}>
                <label htmlFor={`pg-sp-key-${p.id}`}>
                  Chave Pix <code>splits[{i}].pixKey</code>
                </label>
                <input
                  id={`pg-sp-key-${p.id}`}
                  value={p.pixKey}
                  onChange={(e) => set(p.id, { pixKey: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor={`pg-sp-mode-${p.id}`}>Como calcular</label>
                <select
                  id={`pg-sp-mode-${p.id}`}
                  value={p.mode}
                  onChange={(e) =>
                    set(p.id, {
                      mode: e.target.value as Mode,
                      amount: e.target.value === 'pct' ? 10 : 1000,
                    })
                  }
                >
                  <option value='pct'>percentual</option>
                  <option value='fixed'>valor fixo (centavos)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor={`pg-sp-amt-${p.id}`}>
                  {p.mode === 'pct' ? 'Percentual' : 'Centavos'}
                </label>
                <input
                  id={`pg-sp-amt-${p.id}`}
                  type='number'
                  min={0}
                  step={p.mode === 'pct' ? 0.5 : 1}
                  value={p.amount}
                  onChange={(e) =>
                    set(p.id, {
                      amount: Math.max(0, Number(e.target.value || 0)),
                    })
                  }
                />
                {p.mode === 'pct' ? (
                  <span
                    className={styles.hint}
                  >{`${total} × ${p.amount}/100 = ${p.value}`}</span>
                ) : null}
              </div>
              <div className={clsx(styles.field, styles.wide)}>
                <label htmlFor={`pg-sp-type-${p.id}`}>
                  Tipo <code>splitType</code>
                </label>
                <select
                  id={`pg-sp-type-${p.id}`}
                  value={p.splitType}
                  onChange={(e) => set(p.id, { splitType: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <span className={styles.hint}>{EXPLAIN[p.splitType]}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                type='button'
                className={clsx(styles.btn, styles.ghost)}
                onClick={() =>
                  setParts((ps) => ps.filter((x) => x.id !== p.id))
                }
              >
                Remover parte
              </button>
            </div>
          </div>
        ))}
        <div className={styles.actions}>
          <button
            type='button'
            className={styles.btn}
            onClick={() =>
              setParts((ps) => [
                ...ps,
                {
                  id: uuid(),
                  pixKey: 'nova-chave@exemplo.com',
                  mode: 'pct',
                  amount: 10,
                  splitType: 'SPLIT_SUB_ACCOUNT',
                },
              ])
            }
          >
            Adicionar parte
          </button>
        </div>
      </div>
      <div className={styles.col}>
        <div className={clsx(styles.panel, styles.pad)}>
          <h3>Resultado</h3>
          <div className={styles.timeline}>
            {computed.map((p, i) => (
              <div key={p.id} className={styles.tlRow}>
                <span className={styles.mono}>parte {i + 1}</span>
                <div className={styles.tlBar}>
                  <div
                    className={styles.tlFill}
                    style={{
                      width: `${total ? Math.min(100, (p.value / total) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className={styles.mono}>{brl(p.value)}</span>
              </div>
            ))}
            <div className={styles.tlRow}>
              <span className={styles.mono}>fica com você</span>
              <div className={styles.tlBar}>
                <div
                  className={clsx(styles.tlFill, over && styles.tlFillBad)}
                  style={{
                    width: `${total ? Math.min(100, (Math.abs(rest) / total) * 100) : 0}%`,
                    opacity: over ? 1 : 0.5,
                  }}
                />
              </div>
              <span className={clsx(styles.mono, over && styles.ko)}>
                {brl(rest)}
              </span>
            </div>
          </div>
          {over ? (
            <div className={styles.koBox}>
              A soma das partes passa do valor da cobrança. A API recusa: o
              split não pode exceder o total.
            </div>
          ) : (
            <div className={styles.okBox}>
              O resto da cobrança fica na conta que a criou. Tarifas Woovi não
              estão neste cálculo.
            </div>
          )}
          <p className={styles.why}>
            Percentuais são calculados por você antes de chamar a API. Aqui o
            arredondamento é para baixo; a API não documenta uma regra de
            centavos.
          </p>
        </div>
        <CodeTabs tabs={snippets('POST', '/api/v1/charge', body)} />
      </div>
    </div>
  );
}
