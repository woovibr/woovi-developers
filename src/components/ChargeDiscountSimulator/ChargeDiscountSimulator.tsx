import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import {
  DEFAULT_BR_BANKING_HOLIDAYS,
  simulateChargeDiscount,
  summarize,
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

type SpotStatus =
  | 'BEFORE_DISCOUNT'
  | 'DISCOUNT'
  | 'ACTIVE'
  | 'DUE_TODAY'
  | 'OVERDUE';

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

const formatCents = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatBasisPoints = (bp: number): string =>
  `${(bp / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

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

const STATUS_LABELS: Record<SpotStatus, string> = {
  BEFORE_DISCOUNT: 'Antes do desconto',
  DISCOUNT: 'Com desconto',
  ACTIVE: 'Ativa',
  DUE_TODAY: 'Vence hoje',
  OVERDUE: 'Vencida',
};

const deriveStatus = (
  row: SimulationRow,
  hasDiscountConfig: boolean,
): SpotStatus => {
  if (row.daysToDueDate < 0) {
    return 'OVERDUE';
  }
  if (row.daysToDueDate === 0) {
    return 'DUE_TODAY';
  }
  if (row.discount > 0) {
    return 'DISCOUNT';
  }
  if (hasDiscountConfig) {
    return 'BEFORE_DISCOUNT';
  }
  return 'ACTIVE';
};

const ChargeDiscountSimulator = (): JSX.Element => {
  // Mount detection — avoids SSR/CSR hydration mismatch from `new Date()`.
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

  const [spotlightDayIndex, setSpotlightDayIndex] = useState<number>(0);

  const [copyStatus, setCopyStatus] = useState<string>('');

  // ---------- Validation ----------

  const validation = useMemo<string | null>(() => {
    if (!Number.isFinite(chargeValue) || chargeValue <= 0) {
      return 'O valor da cobrança deve ser maior que zero.';
    }
    if (!Number.isFinite(daysForDueDate) || daysForDueDate <= 0) {
      return 'Dias até o vencimento deve ser maior que zero.';
    }
    if (!Number.isFinite(daysAfterDueDate) || daysAfterDueDate < 0) {
      return 'Dias após o vencimento não pode ser negativo.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(creationDate)) {
      return 'Data de criação inválida.';
    }
    return null;
  }, [chargeValue, daysForDueDate, daysAfterDueDate, creationDate]);

  // ---------- Derived input ----------

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

  const dailyInput = useMemo<SimulationInput>(
    () => ({
      chargeValue,
      daysForDueDate,
      daysAfterDueDate,
      creationDate: new Date(`${creationDate}T00:00:00Z`),
      discountSettings,
      interests,
      fines,
      granularity: 'daily',
      holidays: DEFAULT_BR_BANKING_HOLIDAYS,
    }),
    [
      chargeValue,
      daysForDueDate,
      daysAfterDueDate,
      creationDate,
      discountSettings,
      interests,
      fines,
    ],
  );

  // The full daily array is used for the spotlight day picker and the
  // schedule table (so the day picker always has every calendar day to
  // choose from). The summary view is just a filter applied on top.
  const dailyRows: SimulationRow[] = useMemo(() => {
    if (validation) {
      return [];
    }
    try {
      return simulateChargeDiscount(dailyInput);
    } catch {
      return [];
    }
  }, [dailyInput, validation]);

  const summaryRows: SimulationRow[] = useMemo(() => {
    if (dailyRows.length === 0) {
      return [];
    }
    return summarize(dailyRows, daysForDueDate);
  }, [dailyRows, daysForDueDate]);

  const tableRows = granularity === 'summary' ? summaryRows : dailyRows;

  // Clamp spotlight when the simulation length changes.
  useEffect(() => {
    if (dailyRows.length === 0) {
      return;
    }
    const last = dailyRows.length - 1;

    if (spotlightDayIndex > last) {
      setSpotlightDayIndex(last);
    } else if (spotlightDayIndex < 0) {
      setSpotlightDayIndex(0);
    }
  }, [dailyRows.length, spotlightDayIndex]);

  const spotlightRow: SimulationRow | undefined =
    dailyRows[Math.max(0, Math.min(spotlightDayIndex, dailyRows.length - 1))];

  const status: SpotStatus | null = spotlightRow
    ? deriveStatus(spotlightRow, !!discountSettings)
    : null;

  // ---------- Derived label info ----------

  const selectedOption = MODALITY_OPTIONS.find((o) => o.modality === modality);

  const spotlightDate = spotlightRow?.date ?? '';

  const onSpotlightDateChange = (iso: string): void => {
    if (!iso || dailyRows.length === 0) {
      return;
    }
    const idx = dailyRows.findIndex((r) => r.date === iso);

    if (idx >= 0) {
      setSpotlightDayIndex(idx);
    }
  };

  // ---------- Copy helpers ----------

  const buildJsonEnvelope = (): string => {
    const envelope = {
      modality,
      modalityNumber: modalityNumber(modality),
      input: {
        ...dailyInput,
        granularity,
        creationDate: dailyInput.creationDate
          ? new Date(dailyInput.creationDate).toISOString()
          : undefined,
      },
      rows: tableRows,
    };

    return JSON.stringify(envelope, null, 2);
  };

  const buildBody = (): Record<string, unknown> => {
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
    return body;
  };

  const buildCurl = (): string => {
    const json = JSON.stringify(buildBody(), null, 2);

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

  // ---------- Discount block ----------

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
    return <div className={styles.container}>Carregando simulador…</div>;
  }

  // ---------- Render ----------

  return (
    <div className={styles.container}>
      {/* ============================ CONFIG ============================ */}
      <div className={styles.panel}>
        <h2>Configuração da cobrança</h2>

        <div className={styles.field}>
          <label htmlFor='modality'>Modalidade de desconto</label>
          <select
            id='modality'
            value={modality}
            onChange={(e) => setModality(e.target.value as DiscountModality)}
          >
            {MODALITY_OPTIONS.map((o) => (
              <option key={o.modality} value={o.modality}>
                {o.label}
              </option>
            ))}
          </select>
          {selectedOption && (
            <span className={styles.fieldHint}>{selectedOption.description}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor='chargeValue'>Valor principal (em centavos)</label>
          <input
            id='chargeValue'
            type='number'
            min={1}
            value={chargeValue}
            onChange={(e) => setChargeValue(Number(e.target.value))}
          />
          <span className={styles.fieldHint}>{formatCents(chargeValue)}</span>
        </div>

        <div className={styles.row}>
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
            <label htmlFor='daysAfterDueDate'>Dias após o vencimento</label>
            <input
              id='daysAfterDueDate'
              type='number'
              min={0}
              value={daysAfterDueDate}
              onChange={(e) => setDaysAfterDueDate(Number(e.target.value))}
            />
            <span className={styles.fieldHint}>
              Janela máxima de simulação após o vencimento
            </span>
          </div>
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

        <h3>Desconto</h3>
        <div className={styles.field}>
          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={noDiscount}
              onChange={(e) => setNoDiscount(e.target.checked)}
            />{' '}
            Sem desconto
          </label>
        </div>

        {!noDiscount && renderDiscountBlock()}

        <h3>Multa &amp; Juros</h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor='fineValue'>
              Multa{' '}
              {fineType === 'FIXED'
                ? '(centavos)'
                : '(basis points)'}
            </label>
            <input
              id='fineValue'
              type='number'
              min={0}
              value={fineValue}
              onChange={(e) => setFineValue(Number(e.target.value))}
              disabled={noFine}
            />
            <span className={styles.fieldHint}>
              {fineType === 'FIXED'
                ? `${formatCents(fineValue)} aplicada uma vez`
                : `${formatBasisPoints(fineValue)} aplicada uma vez`}
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor='fineType'>Tipo da multa</label>
            <select
              id='fineType'
              value={fineType}
              onChange={(e) =>
                setFineType(e.target.value as 'PERCENTAGE' | 'FIXED')
              }
              disabled={noFine}
            >
              <option value='PERCENTAGE'>Percentual (basis points)</option>
              <option value='FIXED'>Fixa (centavos)</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={noFine}
              onChange={(e) => setNoFine(e.target.checked)}
            />{' '}
            Sem multa
          </label>
        </div>

        <div className={styles.field}>
          <label htmlFor='interestValue'>
            Juros (basis points por dia corrido)
          </label>
          <input
            id='interestValue'
            type='number'
            min={0}
            value={interestValue}
            onChange={(e) => setInterestValue(Number(e.target.value))}
            disabled={noInterest}
          />
          <span className={styles.fieldHint}>
            {formatBasisPoints(interestValue)} ao dia, após o vencimento
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={noInterest}
              onChange={(e) => setNoInterest(e.target.checked)}
            />{' '}
            Sem juros
          </label>
        </div>

        <h3>Granularidade do cronograma</h3>
        <div className={styles.field}>
          <label className={styles.checkboxLine}>
            <input
              type='checkbox'
              checked={granularity === 'summary'}
              onChange={(e) =>
                setGranularity(e.target.checked ? 'summary' : 'daily')
              }
            />{' '}
            Modo summary (apenas marcos relevantes)
          </label>
        </div>
      </div>

      {/* ============================ RESULT ============================ */}
      <div className={styles.panel}>
        <h2>Resultado da simulação</h2>

        {validation ? (
          <p className={styles.error} role='alert'>
            {validation}
          </p>
        ) : (
          <>
            <div className={styles.field}>
              <label htmlFor='spot-date'>Data do pagamento (simulada)</label>
              <input
                id='spot-date'
                type='date'
                value={spotlightDate}
                min={dailyRows[0]?.date}
                max={dailyRows[dailyRows.length - 1]?.date}
                onChange={(e) => onSpotlightDateChange(e.target.value)}
              />
              <input
                className={styles.slider}
                type='range'
                min={0}
                max={Math.max(0, dailyRows.length - 1)}
                step={1}
                value={spotlightDayIndex}
                onChange={(e) =>
                  setSpotlightDayIndex(Number(e.target.value))
                }
                aria-label='Dia simulado'
              />
              <div className={styles.sliderTrack}>
                <span>{dailyRows[0]?.date ?? '—'}</span>
                <span>
                  {spotlightRow
                    ? `dia ${spotlightRow.daysFromCreation} · toDue ${spotlightRow.daysToDueDate}`
                    : '—'}
                </span>
                <span>
                  {dailyRows[dailyRows.length - 1]?.date ?? '—'}
                </span>
              </div>
            </div>

            {spotlightRow && status && (
              <>
                <div className={styles.totalCard}>
                  <div className={styles.totalLabel}>
                    Valor a pagar nesta data
                  </div>
                  <div className={styles.totalValue}>
                    {formatCents(spotlightRow.total)}
                  </div>
                  <span
                    className={clsx(
                      styles.statusBadge,
                      styles[`status_${status}`],
                    )}
                  >
                    {STATUS_LABELS[status]}
                    {spotlightRow.daysToDueDate < 0 &&
                      ` · ${Math.abs(spotlightRow.daysToDueDate)} dia(s) de atraso`}
                  </span>
                </div>

                <div className={styles.breakdown}>
                  <div className={styles.breakdownRow}>
                    <span>Valor principal</span>
                    <span>{formatCents(spotlightRow.value)}</span>
                  </div>
                  {spotlightRow.discount > 0 && (
                    <div className={styles.breakdownRow}>
                      <span>Desconto</span>
                      <span className={styles.negative}>
                        −{formatCents(spotlightRow.discount)}
                      </span>
                    </div>
                  )}
                  {spotlightRow.fine > 0 && (
                    <div className={styles.breakdownRow}>
                      <span>
                        Multa (
                        {fines?.type === 'FIXED'
                          ? formatCents(fines.value)
                          : formatBasisPoints(fines?.value ?? 0)}
                        )
                      </span>
                      <span className={styles.positive}>
                        +{formatCents(spotlightRow.fine)}
                      </span>
                    </div>
                  )}
                  {spotlightRow.interest > 0 && (
                    <div className={styles.breakdownRow}>
                      <span>
                        Juros ({Math.abs(spotlightRow.daysToDueDate)} dia(s) ·{' '}
                        {formatBasisPoints(interests?.value ?? 0)}/dia)
                      </span>
                      <span className={styles.positive}>
                        +{formatCents(spotlightRow.interest)}
                      </span>
                    </div>
                  )}
                  <div className={clsx(styles.breakdownRow, styles.total)}>
                    <span>Total</span>
                    <span>{formatCents(spotlightRow.total)}</span>
                  </div>
                </div>
              </>
            )}

            <div className={styles.timeline}>
              <h3>Linha do tempo</h3>
              <div className={styles.tableWrap}>
                <table className={styles.timelineTable}>
                  <thead>
                    <tr>
                      <th scope='col'>date</th>
                      <th scope='col'>day</th>
                      <th scope='col'>toDue</th>
                      <th scope='col'>business</th>
                      <th scope='col'>discount</th>
                      <th scope='col'>interest</th>
                      <th scope='col'>fine</th>
                      <th scope='col'>total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r) => {
                      const isSpot =
                        spotlightRow &&
                        r.daysFromCreation === spotlightRow.daysFromCreation;

                      const rowClass = clsx(
                        r.daysToDueDate === 0 && styles.rowDue,
                        r.daysToDueDate < 0 && styles.rowOverdue,
                        isSpot && styles.highlighted,
                      );

                      return (
                        <tr
                          key={r.daysFromCreation}
                          className={rowClass}
                          onClick={() =>
                            setSpotlightDayIndex(r.daysFromCreation)
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{r.date}</td>
                          <td>{r.daysFromCreation}</td>
                          <td>{r.daysToDueDate}</td>
                          <td>{r.isBusinessDay ? 'business' : 'non-bus.'}</td>
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
            </div>

            <div className={styles.actions}>
              <button
                type='button'
                className={styles.primaryButton}
                onClick={() => copy(buildJsonEnvelope(), 'JSON')}
              >
                Copiar JSON
              </button>
              <button
                type='button'
                className={styles.secondaryButton}
                onClick={() => copy(buildCurl(), 'cURL')}
              >
                Copiar como cURL
              </button>
              {copyStatus && (
                <span className={styles.copyStatus} role='status'>
                  {copyStatus}
                </span>
              )}
            </div>

            <h3>Payload equivalente da API</h3>
            <pre className={styles.jsonPreview}>
              {JSON.stringify(buildBody(), null, 2)}
            </pre>
          </>
        )}
      </div>
    </div>
  );
};

export default ChargeDiscountSimulator;
