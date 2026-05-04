import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import styles from './CobvSimulator.module.css';

type DiscountType = 'FIXED' | 'PERCENTAGE';

type CobvConfig = {
  valueCents: number;
  dueDate: string;
  daysAfterDueDate: number;
  finesBp: number;
  interestsBp: number;
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValue: number;
  discountDueDate: string;
};

type ChargeStatus = 'BEFORE_DISCOUNT' | 'DISCOUNT' | 'ACTIVE' | 'OVERDUE' | 'EXPIRED';

type Breakdown = {
  status: ChargeStatus;
  principalCents: number;
  discountCents: number;
  finesCents: number;
  interestsCents: number;
  totalCents: number;
  daysOverdue: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const todayISO = (offsetDays = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const parseDateAtNoon = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return d.getTime();
};

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const formatBp = (bp: number) => `${(bp / 100).toLocaleString('pt-BR')}%`;

const computeCharge = (config: CobvConfig, atDate: string): Breakdown => {
  const principal = Math.max(0, Math.floor(config.valueCents));
  const at = parseDateAtNoon(atDate);
  const due = parseDateAtNoon(config.dueDate);
  const limit = due + config.daysAfterDueDate * DAY_MS;

  let discountCents = 0;
  let status: ChargeStatus = 'ACTIVE';

  if (config.discountEnabled && at <= parseDateAtNoon(config.discountDueDate)) {
    if (config.discountType === 'FIXED') {
      discountCents = Math.min(principal, Math.floor(config.discountValue));
    } else {
      discountCents = Math.floor((principal * config.discountValue) / 10000);
    }
    status = 'DISCOUNT';
  }

  if (at <= due) {
    if (status !== 'DISCOUNT') status = 'ACTIVE';
    return {
      status,
      principalCents: principal,
      discountCents,
      finesCents: 0,
      interestsCents: 0,
      totalCents: Math.max(0, principal - discountCents),
      daysOverdue: 0,
    };
  }

  const daysOverdue = Math.ceil((at - due) / DAY_MS);

  if (config.daysAfterDueDate > 0 && at > limit) {
    return {
      status: 'EXPIRED',
      principalCents: principal,
      discountCents: 0,
      finesCents: 0,
      interestsCents: 0,
      totalCents: 0,
      daysOverdue,
    };
  }

  const finesCents = Math.floor((principal * config.finesBp) / 10000);
  const interestsCents = Math.floor(
    (principal * config.interestsBp * daysOverdue) / 10000 / 30,
  );

  return {
    status: 'OVERDUE',
    principalCents: principal,
    discountCents: 0,
    finesCents,
    interestsCents,
    totalCents: principal + finesCents + interestsCents,
    daysOverdue,
  };
};

const STATUS_LABELS: Record<ChargeStatus, string> = {
  BEFORE_DISCOUNT: 'Antes do desconto',
  DISCOUNT: 'Com desconto',
  ACTIVE: 'Ativa',
  OVERDUE: 'Vencida',
  EXPIRED: 'Expirada',
};

const STATUS_CLASSES: Record<ChargeStatus, string> = {
  BEFORE_DISCOUNT: styles.statusActive,
  DISCOUNT: styles.statusDiscount,
  ACTIVE: styles.statusActive,
  OVERDUE: styles.statusOverdue,
  EXPIRED: styles.statusExpired,
};

const CobvSimulator: React.FC = () => {
  const [config, setConfig] = useState<CobvConfig>(() => ({
    valueCents: 15000,
    dueDate: todayISO(7),
    daysAfterDueDate: 30,
    finesBp: 200,
    interestsBp: 100,
    discountEnabled: true,
    discountType: 'PERCENTAGE',
    discountValue: 500,
    discountDueDate: todayISO(2),
  }));

  const [simulationDate, setSimulationDate] = useState(todayISO(0));

  const update = <K extends keyof CobvConfig>(key: K, value: CobvConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const breakdown = useMemo(
    () => computeCharge(config, simulationDate),
    [config, simulationDate],
  );

  const timeline = useMemo(() => {
    const due = parseDateAtNoon(config.dueDate);
    const points: { label: string; date: string; offsetDays: number }[] = [];

    if (config.discountEnabled) {
      points.push({
        label: 'Discount deadline',
        date: config.discountDueDate,
        offsetDays: Math.round(
          (parseDateAtNoon(config.discountDueDate) -
            parseDateAtNoon(todayISO(0))) /
            DAY_MS,
        ),
      });
    }

    points.push({
      label: 'Due date',
      date: config.dueDate,
      offsetDays: Math.round((due - parseDateAtNoon(todayISO(0))) / DAY_MS),
    });

    [1, 5, 10, 20, 30].forEach((d) => {
      if (d <= config.daysAfterDueDate) {
        const date = new Date(due + d * DAY_MS).toISOString().slice(0, 10);
        points.push({
          label: `+${d} day${d === 1 ? '' : 's'} after due`,
          date,
          offsetDays: Math.round((due + d * DAY_MS - parseDateAtNoon(todayISO(0))) / DAY_MS),
        });
      }
    });

    if (config.daysAfterDueDate > 0) {
      const expDate = new Date(due + (config.daysAfterDueDate + 1) * DAY_MS)
        .toISOString()
        .slice(0, 10);
      points.push({
        label: 'After expiration',
        date: expDate,
        offsetDays: Math.round(
          (due + (config.daysAfterDueDate + 1) * DAY_MS -
            parseDateAtNoon(todayISO(0))) /
            DAY_MS,
        ),
      });
    }

    const seen = new Set<string>();
    return points
      .filter((p) => {
        if (seen.has(p.date)) return false;
        seen.add(p.date);
        return true;
      })
      .sort((a, b) => parseDateAtNoon(a.date) - parseDateAtNoon(b.date))
      .map((p) => ({ ...p, breakdown: computeCharge(config, p.date) }));
  }, [config]);

  const requestPayload = useMemo(() => {
    const payload: Record<string, unknown> = {
      correlationID: 'cobv-simulator-example',
      value: config.valueCents,
      type: 'OVERDUE',
      expiresDate: new Date(parseDateAtNoon(config.dueDate)).toISOString(),
      daysAfterDueDate: config.daysAfterDueDate,
      interestsSettings: {
        fines: { value: config.finesBp },
        interests: { value: config.interestsBp },
      },
    };
    if (config.discountEnabled) {
      payload.discountSettings = {
        type: config.discountType,
        value: config.discountValue,
        dueDate: new Date(parseDateAtNoon(config.discountDueDate)).toISOString(),
      };
    }
    return payload;
  }, [config]);

  const dueOffset = Math.round(
    (parseDateAtNoon(config.dueDate) - parseDateAtNoon(todayISO(0))) / DAY_MS,
  );
  const minOffset = Math.min(-2, dueOffset - 5);
  const maxOffset = dueOffset + Math.max(config.daysAfterDueDate + 5, 10);
  const currentOffset = Math.round(
    (parseDateAtNoon(simulationDate) - parseDateAtNoon(todayISO(0))) / DAY_MS,
  );

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h2>Configuração da cobrança</h2>

        <div className={styles.field}>
          <label htmlFor="cobv-value">Valor principal (em centavos)</label>
          <input
            id="cobv-value"
            type="number"
            min={0}
            step={1}
            value={config.valueCents}
            onChange={(e) => update('valueCents', Number(e.target.value))}
          />
          <span className={styles.fieldHint}>
            {formatBRL(config.valueCents)}
          </span>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="cobv-due">Data de vencimento</label>
            <input
              id="cobv-due"
              type="date"
              value={config.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="cobv-days-after">Dias após o vencimento</label>
            <input
              id="cobv-days-after"
              type="number"
              min={0}
              value={config.daysAfterDueDate}
              onChange={(e) =>
                update('daysAfterDueDate', Number(e.target.value))
              }
            />
            <span className={styles.fieldHint}>
              Limite para pagamento após o vencimento
            </span>
          </div>
        </div>

        <h3>Multa & Juros</h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="cobv-fines">Multa (basis points)</label>
            <input
              id="cobv-fines"
              type="number"
              min={0}
              value={config.finesBp}
              onChange={(e) => update('finesBp', Number(e.target.value))}
            />
            <span className={styles.fieldHint}>
              {formatBp(config.finesBp)} aplicada uma vez
            </span>
          </div>
          <div className={styles.field}>
            <label htmlFor="cobv-interests">Juros (basis points / mês)</label>
            <input
              id="cobv-interests"
              type="number"
              min={0}
              value={config.interestsBp}
              onChange={(e) => update('interestsBp', Number(e.target.value))}
            />
            <span className={styles.fieldHint}>
              {formatBp(config.interestsBp)} ao mês, pro-rata diário
            </span>
          </div>
        </div>

        <h3>Desconto</h3>
        <div className={styles.field}>
          <label>
            <input
              type="checkbox"
              checked={config.discountEnabled}
              onChange={(e) => update('discountEnabled', e.target.checked)}
            />{' '}
            Aplicar desconto antes de uma data limite
          </label>
        </div>

        {config.discountEnabled && (
          <>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="cobv-discount-type">Tipo</label>
                <select
                  id="cobv-discount-type"
                  value={config.discountType}
                  onChange={(e) =>
                    update('discountType', e.target.value as DiscountType)
                  }
                >
                  <option value="PERCENTAGE">Percentual (basis points)</option>
                  <option value="FIXED">Fixo (centavos)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="cobv-discount-value">Valor</label>
                <input
                  id="cobv-discount-value"
                  type="number"
                  min={0}
                  value={config.discountValue}
                  onChange={(e) =>
                    update('discountValue', Number(e.target.value))
                  }
                />
                <span className={styles.fieldHint}>
                  {config.discountType === 'PERCENTAGE'
                    ? formatBp(config.discountValue)
                    : formatBRL(config.discountValue)}
                </span>
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="cobv-discount-due">Data limite do desconto</label>
              <input
                id="cobv-discount-due"
                type="date"
                value={config.discountDueDate}
                onChange={(e) => update('discountDueDate', e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className={styles.panel}>
        <h2>Resultado da simulação</h2>

        <div className={styles.field}>
          <label htmlFor="cobv-sim-date">Data do pagamento (simulada)</label>
          <input
            id="cobv-sim-date"
            type="date"
            value={simulationDate}
            onChange={(e) => setSimulationDate(e.target.value)}
          />
          <input
            className={styles.slider}
            type="range"
            min={minOffset}
            max={maxOffset}
            step={1}
            value={currentOffset}
            onChange={(e) => setSimulationDate(todayISO(Number(e.target.value)))}
          />
          <div className={styles.sliderTrack}>
            <span>{todayISO(minOffset)}</span>
            <span>hoje</span>
            <span>{todayISO(maxOffset)}</span>
          </div>
        </div>

        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>Valor a pagar nesta data</div>
          <div className={styles.totalValue}>
            {breakdown.status === 'EXPIRED'
              ? '—'
              : formatBRL(breakdown.totalCents)}
          </div>
          <span
            className={clsx(
              styles.statusBadge,
              STATUS_CLASSES[breakdown.status],
            )}
          >
            {STATUS_LABELS[breakdown.status]}
            {breakdown.daysOverdue > 0 &&
              ` · ${breakdown.daysOverdue} dia(s) de atraso`}
          </span>
        </div>

        <div className={styles.breakdown}>
          <div className={styles.breakdownRow}>
            <span>Valor principal</span>
            <span>{formatBRL(breakdown.principalCents)}</span>
          </div>
          {breakdown.discountCents > 0 && (
            <div className={styles.breakdownRow}>
              <span>Desconto</span>
              <span className={styles.negative}>
                −{formatBRL(breakdown.discountCents)}
              </span>
            </div>
          )}
          {breakdown.finesCents > 0 && (
            <div className={styles.breakdownRow}>
              <span>Multa ({formatBp(config.finesBp)})</span>
              <span className={styles.positive}>
                +{formatBRL(breakdown.finesCents)}
              </span>
            </div>
          )}
          {breakdown.interestsCents > 0 && (
            <div className={styles.breakdownRow}>
              <span>
                Juros ({breakdown.daysOverdue} dia(s) ·{' '}
                {formatBp(config.interestsBp)}/mês)
              </span>
              <span className={styles.positive}>
                +{formatBRL(breakdown.interestsCents)}
              </span>
            </div>
          )}
          <div className={clsx(styles.breakdownRow, styles.total)}>
            <span>Total</span>
            <span>
              {breakdown.status === 'EXPIRED'
                ? 'Cobrança expirada'
                : formatBRL(breakdown.totalCents)}
            </span>
          </div>
        </div>

        <div className={styles.timeline}>
          <h3>Linha do tempo</h3>
          <table className={styles.timelineTable}>
            <thead>
              <tr>
                <th>Marco</th>
                <th>Data</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((point) => (
                <tr
                  key={`${point.label}-${point.date}`}
                  className={
                    point.date === simulationDate ? styles.highlighted : ''
                  }
                >
                  <td>{point.label}</td>
                  <td>{point.date}</td>
                  <td>{STATUS_LABELS[point.breakdown.status]}</td>
                  <td>
                    {point.breakdown.status === 'EXPIRED'
                      ? '—'
                      : formatBRL(point.breakdown.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Payload equivalente da API</h3>
        <pre className={styles.jsonPreview}>
          {JSON.stringify(requestPayload, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export { CobvSimulator };
export default CobvSimulator;
