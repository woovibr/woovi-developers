import React, { useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_BR_BANKING_HOLIDAYS,
  simulateChargeDiscount,
} from './simulate';
import type {
  DiscountModality,
  DiscountSettings,
  FineSettings,
  InterestSettings,
  SimulationInput,
  SimulationRow,
} from './simulate';

import styles from './styles.module.css';

type FixedDateRow = { daysActive: number; value: number };

const MODALITY_OPTIONS: {
  number: number;
  modality: DiscountModality;
  label: string;
  description: string;
}[] = [
  {
    number: 1,
    modality: 'FIXED_VALUE_UNTIL_SPECIFIED_DATE',
    label: '1 — FIXED_VALUE_UNTIL_SPECIFIED_DATE',
    description:
      'Desconto fixo em centavos até uma data específica (entradas com daysActive + value em centavos).',
  },
  {
    number: 2,
    modality: 'PERCENTAGE_UNTIL_SPECIFIED_DATE',
    label: '2 — PERCENTAGE_UNTIL_SPECIFIED_DATE',
    description:
      'Desconto percentual até uma data específica (entradas com daysActive + value em basis points).',
  },
  {
    number: 3,
    modality: 'VALUE_PER_RUNNING_DAY_ADVANCE',
    label: '3 — VALUE_PER_RUNNING_DAY_ADVANCE',
    description: 'Centavos por dia corrido de antecedência ao vencimento.',
  },
  {
    number: 4,
    modality: 'VALUE_PER_BUSINESS_DAY_ADVANCE',
    label: '4 — VALUE_PER_BUSINESS_DAY_ADVANCE',
    description:
      'Centavos por dia útil de antecedência (pula fins de semana e feriados BR).',
  },
  {
    number: 5,
    modality: 'PERCENTAGE_PER_RUNNING_DAY_ADVANCE',
    label: '5 — PERCENTAGE_PER_RUNNING_DAY_ADVANCE',
    description:
      'Basis points por dia corrido de antecedência ao vencimento.',
  },
  {
    number: 6,
    modality: 'PERCENTAGE_PER_BUSINESS_DAY_ADVANCE',
    label: '6 — PERCENTAGE_PER_BUSINESS_DAY_ADVANCE',
    description:
      'Basis points por dia útil de antecedência (pula fins de semana e feriados BR).',
  },
];

const isFixedDateModality = (m: DiscountModality): boolean =>
  m === 'FIXED_VALUE_UNTIL_SPECIFIED_DATE' ||
  m === 'PERCENTAGE_UNTIL_SPECIFIED_DATE';

const modalityNumber = (m: DiscountModality): number =>
  MODALITY_OPTIONS.find((o) => o.modality === m)?.number ?? 1;

const formatCents = (cents: number): string => {
  const sign = cents < 0 ? '-' : '';

  const abs = Math.abs(cents);

  return `${sign}R$${(abs / 100).toFixed(2)}`;
};

const formatBasisPoints = (bp: number): string =>
  `${(bp / 100).toFixed(2)}%`;

const todayIsoUtc = (): string => {
  const d = new Date();

  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
};

type DiscountValueUnit = {
  label: string;
  preview: typeof formatCents;
};

// Discount value-unit copy per modality.
const discountValueUnit = (m: DiscountModality): DiscountValueUnit => {
  switch (m) {
    case 'VALUE_PER_RUNNING_DAY_ADVANCE':
      return { label: 'Valor (centavos por dia corrido)', preview: formatCents };
    case 'VALUE_PER_BUSINESS_DAY_ADVANCE':
      return { label: 'Valor (centavos por dia útil)', preview: formatCents };
    case 'PERCENTAGE_PER_RUNNING_DAY_ADVANCE':
      return {
        label: 'Valor (basis points por dia corrido — 100 = 1,00%)',
        preview: formatBasisPoints,
      };
    case 'PERCENTAGE_PER_BUSINESS_DAY_ADVANCE':
      return {
        label: 'Valor (basis points por dia útil — 100 = 1,00%)',
        preview: formatBasisPoints,
      };
    default:
      return { label: 'Valor', preview: formatCents };
  }
};

const ChargeDiscountSimulator = (): JSX.Element => {
  // Mount detection — avoids SSR/CSR hydration mismatch from `new Date()` used
  // as the default creationDate. Server renders the loading fallback; client
  // swaps in the real form post-hydration.
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [modality, setModality] = useState<DiscountModality>(
    'PERCENTAGE_PER_RUNNING_DAY_ADVANCE',
  );

  const [chargeValue, setChargeValue] = useState<number>(10000);

  const [daysForDueDate, setDaysForDueDate] = useState<number>(10);

  const [daysAfterDueDate, setDaysAfterDueDate] = useState<number>(15);

  const [creationDate, setCreationDate] = useState<string>('');

  useEffect(() => {
    if (!creationDate) {
      setCreationDate(todayIsoUtc());
    }
     
  }, []);

  const [fixedDateRows, setFixedDateRows] = useState<FixedDateRow[]>([
    { daysActive: 5, value: 500 },
    { daysActive: 10, value: 200 },
  ]);

  const [discountValue, setDiscountValue] = useState<number>(10);

  const [noDiscount, setNoDiscount] = useState<boolean>(false);

  const [interestValue, setInterestValue] = useState<number>(100);

  const [noInterest, setNoInterest] = useState<boolean>(false);

  const [fineValue, setFineValue] = useState<number>(200);

  const [fineType, setFineType] = useState<'PERCENTAGE' | 'FIXED'>(
    'PERCENTAGE',
  );

  const [noFine, setNoFine] = useState<boolean>(false);

  const [granularity, setGranularity] = useState<'daily' | 'summary'>(
    'daily',
  );

  const [copyStatus, setCopyStatus] = useState<string>('');

  // ---------- Derived input ----------

  const validation = useMemo<string | null>(() => {
    if (!Number.isFinite(chargeValue) || chargeValue <= 0) {
      return 'O valor da cobrança (chargeValue) deve ser maior que zero.';
    }
    if (!Number.isFinite(daysForDueDate) || daysForDueDate <= 0) {
      return 'daysForDueDate deve ser maior que zero.';
    }
    if (!Number.isFinite(daysAfterDueDate) || daysAfterDueDate < 0) {
      return 'daysAfterDueDate não pode ser negativo.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(creationDate)) {
      return 'Data de criação inválida.';
    }
    return null;
  }, [chargeValue, daysForDueDate, daysAfterDueDate, creationDate]);

  const discountSettings: DiscountSettings | undefined = useMemo(() => {
    if (noDiscount) {
      return undefined;
    }
    if (isFixedDateModality(modality)) {
      return {
        modality: modality as
          | 'FIXED_VALUE_UNTIL_SPECIFIED_DATE'
          | 'PERCENTAGE_UNTIL_SPECIFIED_DATE',
        discountFixedDate: fixedDateRows.map((r) => ({
          daysActive: r.daysActive,
          value: r.value,
        })),
      };
    }
    return {
      modality: modality as
        | 'VALUE_PER_RUNNING_DAY_ADVANCE'
        | 'VALUE_PER_BUSINESS_DAY_ADVANCE'
        | 'PERCENTAGE_PER_RUNNING_DAY_ADVANCE'
        | 'PERCENTAGE_PER_BUSINESS_DAY_ADVANCE',
      value: discountValue,
    };
  }, [noDiscount, modality, fixedDateRows, discountValue]);

  const interests: InterestSettings | undefined = noInterest
    ? undefined
    : { value: interestValue };

  const fines: FineSettings | undefined = noFine
    ? undefined
    : { value: fineValue, type: fineType };

  const input = useMemo<SimulationInput>(() => {
    return {
      chargeValue,
      daysForDueDate,
      daysAfterDueDate,
      creationDate: new Date(`${creationDate}T00:00:00Z`),
      discountSettings,
      interests,
      fines,
      granularity,
      holidays: DEFAULT_BR_BANKING_HOLIDAYS,
    };
  }, [
    chargeValue,
    daysForDueDate,
    daysAfterDueDate,
    creationDate,
    discountSettings,
    interests,
    fines,
    granularity,
  ]);

  const rows: SimulationRow[] = useMemo(() => {
    if (validation) {
      return [];
    }
    try {
      return simulateChargeDiscount(input);
    } catch {
      return [];
    }
  }, [input, validation]);

  // ---------- Copy helpers ----------

  const buildJsonEnvelope = (): string => {
    const envelope = {
      modality,
      modalityNumber: modalityNumber(modality),
      input: {
        ...input,
        creationDate: input.creationDate
          ? new Date(input.creationDate).toISOString()
          : undefined,
      },
      rows,
    };

    return JSON.stringify(envelope, null, 2);
  };

  const buildCurl = (): string => {
    const body: Record<string, unknown> = {
      type: 'OVERDUE',
      correlationID: '<CORRELATION_ID>',
      value: chargeValue,
      daysForDueDate,
      daysAfterDueDate,
    };

    if (discountSettings) {
      body.discountSettings = discountSettings;
    }
    if (interests) {
      body.interests = interests;
    }
    if (fines) {
      body.fines = fines;
    }

    const json = JSON.stringify(body, null, 2);

    return [
      "curl -X POST 'https://api.woovi.com/api/v1/charge' \\",
      "  -H 'Content-Type: application/json' \\",
      "  -H 'Authorization: <APP_ID>' \\",
      `  -d '${json}'`,
    ].join('\n');
  };

  const copy = async (text: string, label: string): Promise<void> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopyStatus(`${label} copiado.`);
      } else {
        setCopyStatus('Clipboard indisponível neste navegador.');
      }
    } catch {
      setCopyStatus('Falha ao copiar — selecione e copie manualmente.');
    }

    window.setTimeout(() => setCopyStatus(''), 2500);
  };

  // ---------- Sub-renderers ----------

  const selectedOption = MODALITY_OPTIONS.find((o) => o.modality === modality);

  const renderDiscountBlock = (): JSX.Element => {
    if (noDiscount) {
      return <p className={styles.muted}>Cobrança sem desconto.</p>;
    }

    if (isFixedDateModality(modality)) {
      const isPercentage = modality === 'PERCENTAGE_UNTIL_SPECIFIED_DATE';

      return (
        <div className={styles.fixedDateGrid}>
          <div className={styles.fixedDateHeader}>
            <span>daysActive</span>
            <span>
              value{' '}
              {isPercentage
                ? '(basis points — 100 = 1,00%)'
                : '(centavos)'}
            </span>
            <span>preview</span>
            <span aria-hidden='true' />
          </div>

          {fixedDateRows.map((row, idx) => (
            <div key={idx} className={styles.fixedDateRow}>
              <input
                type='number'
                min={0}
                value={row.daysActive}
                onChange={(e) => {
                  const next = [...fixedDateRows];

                  next[idx] = {
                    ...next[idx],
                    daysActive: Number(e.target.value),
                  };
                  setFixedDateRows(next);
                }}
                aria-label={`daysActive linha ${idx + 1}`}
              />
              <input
                type='number'
                min={0}
                value={row.value}
                onChange={(e) => {
                  const next = [...fixedDateRows];

                  next[idx] = {
                    ...next[idx],
                    value: Number(e.target.value),
                  };
                  setFixedDateRows(next);
                }}
                aria-label={`value linha ${idx + 1}`}
              />
              <span className={styles.muted}>
                {isPercentage
                  ? formatBasisPoints(row.value)
                  : formatCents(row.value)}
              </span>
              <button
                type='button'
                className={styles.iconButton}
                onClick={() => {
                  if (fixedDateRows.length === 1) {
                    return;
                  }
                  const next = fixedDateRows.filter((_, i) => i !== idx);

                  setFixedDateRows(next);
                }}
                disabled={fixedDateRows.length === 1}
                aria-label={`Remover linha ${idx + 1}`}
              >
                −
              </button>
            </div>
          ))}

          <button
            type='button'
            className={styles.secondaryButton}
            onClick={() =>
              setFixedDateRows([
                ...fixedDateRows,
                { daysActive: 0, value: 0 },
              ])
            }
          >
            + Adicionar linha
          </button>
        </div>
      );
    }

    const unit = discountValueUnit(modality);

    return (
      <div className={styles.field}>
        <label htmlFor='discount-single-value'>{unit.label}</label>
        <input
          id='discount-single-value'
          type='number'
          min={0}
          value={discountValue}
          onChange={(e) => setDiscountValue(Number(e.target.value))}
        />
        <span className={styles.muted}>{unit.preview(discountValue)}</span>
      </div>
    );
  };

  if (!mounted) {
    return <div className={styles.simulator}>Carregando simulador…</div>;
  }

  return (
    <div className={styles.simulator}>
      <div className={styles.formGrid}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Modalidade</h3>
          <div className={styles.field}>
            <label htmlFor='modality'>Modalidade BACEN</label>
            <select
              id='modality'
              value={modality}
              onChange={(e) =>
                setModality(e.target.value as DiscountModality)
              }
            >
              {MODALITY_OPTIONS.map((o) => (
                <option key={o.modality} value={o.modality}>
                  {o.label}
                </option>
              ))}
            </select>
            {selectedOption && (
              <p className={styles.muted}>{selectedOption.description}</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Parâmetros da cobrança</h3>

          <div className={styles.field}>
            <label htmlFor='chargeValue'>Valor (centavos)</label>
            <input
              id='chargeValue'
              type='number'
              min={1}
              value={chargeValue}
              onChange={(e) => setChargeValue(Number(e.target.value))}
            />
            <span className={styles.muted}>{formatCents(chargeValue)}</span>
          </div>

          <div className={styles.field}>
            <label htmlFor='daysForDueDate'>Dias até o vencimento</label>
            <input
              id='daysForDueDate'
              type='number'
              min={1}
              value={daysForDueDate}
              onChange={(e) => setDaysForDueDate(Number(e.target.value))}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor='daysAfterDueDate'>
              Dias simulados após o vencimento
            </label>
            <input
              id='daysAfterDueDate'
              type='number'
              min={0}
              value={daysAfterDueDate}
              onChange={(e) => setDaysAfterDueDate(Number(e.target.value))}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor='creationDate'>Data de criação (UTC)</label>
            <input
              id='creationDate'
              type='date'
              value={creationDate}
              onChange={(e) => setCreationDate(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Desconto</h3>

          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={noDiscount}
              onChange={(e) => setNoDiscount(e.target.checked)}
            />
            Sem desconto
          </label>

          {renderDiscountBlock()}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Juros</h3>

          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={noInterest}
              onChange={(e) => setNoInterest(e.target.checked)}
            />
            Sem juros
          </label>

          {!noInterest && (
            <div className={styles.field}>
              <label htmlFor='interestValue'>
                Valor (basis points por dia corrido — 100 = 1,00%)
              </label>
              <input
                id='interestValue'
                type='number'
                min={0}
                value={interestValue}
                onChange={(e) => setInterestValue(Number(e.target.value))}
              />
              <span className={styles.muted}>
                {formatBasisPoints(interestValue)} ao dia, após o vencimento
              </span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Multa</h3>

          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={noFine}
              onChange={(e) => setNoFine(e.target.checked)}
            />
            Sem multa
          </label>

          {!noFine && (
            <>
              <div className={styles.field}>
                <label htmlFor='fineType'>Tipo</label>
                <select
                  id='fineType'
                  value={fineType}
                  onChange={(e) =>
                    setFineType(e.target.value as 'PERCENTAGE' | 'FIXED')
                  }
                >
                  <option value='PERCENTAGE'>PERCENTAGE</option>
                  <option value='FIXED'>FIXED</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor='fineValue'>
                  Valor{' '}
                  {fineType === 'FIXED'
                    ? '(centavos)'
                    : '(basis points — 100 = 1,00%)'}
                </label>
                <input
                  id='fineValue'
                  type='number'
                  min={0}
                  value={fineValue}
                  onChange={(e) => setFineValue(Number(e.target.value))}
                />
                <span className={styles.muted}>
                  {fineType === 'FIXED'
                    ? formatCents(fineValue)
                    : formatBasisPoints(fineValue)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Granularidade</h3>

          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={granularity === 'summary'}
              onChange={(e) =>
                setGranularity(e.target.checked ? 'summary' : 'daily')
              }
            />
            Modo summary (apenas marcos relevantes)
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type='button'
          className={styles.primaryButton}
          onClick={() => copy(buildJsonEnvelope(), 'JSON')}
          disabled={!!validation}
        >
          Copiar JSON
        </button>
        <button
          type='button'
          className={styles.secondaryButton}
          onClick={() => copy(buildCurl(), 'cURL')}
          disabled={!!validation}
        >
          Copiar como cURL
        </button>
        {copyStatus && (
          <span className={styles.copyStatus} role='status'>
            {copyStatus}
          </span>
        )}
      </div>

      {validation ? (
        <p className={styles.error} role='alert'>
          {validation}
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope='col'>date</th>
                <th scope='col'>day</th>
                <th scope='col'>toDue</th>
                <th scope='col'>business</th>
                <th scope='col'>value</th>
                <th scope='col'>discount</th>
                <th scope='col'>interest</th>
                <th scope='col'>fine</th>
                <th scope='col'>total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const rowClass =
                  r.daysToDueDate === 0
                    ? styles.rowDue
                    : r.daysToDueDate < 0
                      ? styles.rowOverdue
                      : '';

                return (
                  <tr key={r.daysFromCreation} className={rowClass}>
                    <td>{r.date}</td>
                    <td>{r.daysFromCreation}</td>
                    <td>{r.daysToDueDate}</td>
                    <td>{r.isBusinessDay ? 'business' : 'non-bus.'}</td>
                    <td>{formatCents(r.value)}</td>
                    <td>{formatCents(r.discount)}</td>
                    <td>{formatCents(r.interest)}</td>
                    <td>{formatCents(r.fine)}</td>
                    <td className={styles.totalCell}>
                      {formatCents(r.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChargeDiscountSimulator;
