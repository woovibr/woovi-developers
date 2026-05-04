// Sync source: packages/openpix/scripts/api/charge/simulateChargeDiscount.ts in
// entria/woovi monorepo. Update both files in lockstep when the calculation
// rules change.

// =====================================================================
//                              Types
// =====================================================================

export type DiscountModality =
  | 'FIXED_VALUE_UNTIL_SPECIFIED_DATE'
  | 'PERCENTAGE_UNTIL_SPECIFIED_DATE'
  | 'VALUE_PER_RUNNING_DAY_ADVANCE'
  | 'VALUE_PER_BUSINESS_DAY_ADVANCE'
  | 'PERCENTAGE_PER_RUNNING_DAY_ADVANCE'
  | 'PERCENTAGE_PER_BUSINESS_DAY_ADVANCE';

export type DiscountSettings =
  | {
      modality:
        | 'FIXED_VALUE_UNTIL_SPECIFIED_DATE'
        | 'PERCENTAGE_UNTIL_SPECIFIED_DATE';
      discountFixedDate: { daysActive: number; value: number }[];
    }
  | {
      modality:
        | 'VALUE_PER_RUNNING_DAY_ADVANCE'
        | 'VALUE_PER_BUSINESS_DAY_ADVANCE'
        | 'PERCENTAGE_PER_RUNNING_DAY_ADVANCE'
        | 'PERCENTAGE_PER_BUSINESS_DAY_ADVANCE';
      value: number;
    };

export type InterestSettings = {
  // basis points per running day (100 = 1.00%/day). Mirrors woovi's current rule.
  value: number;
};

export type FineSettings = {
  // For type 'PERCENTAGE': basis points (100 = 1.00%).
  // For type 'FIXED': cents.
  value: number;
  type?: 'PERCENTAGE' | 'FIXED';
};

export type SimulationInput = {
  chargeValue: number;
  daysForDueDate: number;
  daysAfterDueDate?: number;
  discountSettings?: DiscountSettings;
  interests?: InterestSettings;
  fines?: FineSettings;
  creationDate?: Date;
  holidays?: string[];
  granularity?: 'daily' | 'summary';
};

export type SimulationRow = {
  date: string;
  daysFromCreation: number;
  daysToDueDate: number;
  isBusinessDay: boolean;
  value: number;
  discount: number;
  interest: number;
  fine: number;
  total: number;
};

// =====================================================================
//                          Date helpers
// =====================================================================

const stripTime = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const addDays = (d: Date, days: number): Date => {
  const next = stripTime(d);

  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const formatDate = (d: Date): string => stripTime(d).toISOString().slice(0, 10);

const isWeekend = (d: Date): boolean => {
  const day = d.getUTCDay();

  return day === 0 || day === 6;
};

const isBusinessDay = (d: Date, holidays: Set<string>): boolean =>
  !isWeekend(d) && !holidays.has(formatDate(d));

const businessDaysBetween = (
  from: Date,
  to: Date,
  holidays: Set<string>,
): number => {
  const start = stripTime(from);

  const end = stripTime(to);

  if (start.getTime() >= end.getTime()) {
    return 0;
  }
  let count = 0;

  let cursor = addDays(start, 1);

  while (cursor.getTime() <= end.getTime()) {
    if (isBusinessDay(cursor, holidays)) {
      count++;
    }
    cursor = addDays(cursor, 1);
  }
  return count;
};

// =====================================================================
//                  Default Brazilian banking holidays
// =====================================================================

/**
 * Brazilian national banking holidays for 2026 and 2027. Update this list
 * yearly. Override via `input.holidays` for staging/testing or future years.
 *
 * Sources:
 * - Fixed feasts: BACEN domain.
 * - Movable feasts (Carnaval/Cinzas/Sexta-Santa/Corpus Christi): derived from
 *   Easter Sunday on the year (computus): 2026 = 5-Apr; 2027 = 28-Mar.
 */
export const DEFAULT_BR_BANKING_HOLIDAYS: string[] = [
  // 2026
  '2026-01-01', // Confraternização Universal
  '2026-02-16', // Carnaval (segunda)
  '2026-02-17', // Carnaval (terça)
  '2026-02-18', // Quarta-feira de Cinzas (até 12h)
  '2026-04-03', // Sexta-Feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência
  '2026-10-12', // NS Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República (cai dom)
  '2026-11-20', // Consciência Negra
  '2026-12-25', // Natal
  // 2027
  '2027-01-01',
  '2027-02-08',
  '2027-02-09',
  '2027-02-10',
  '2027-03-26',
  '2027-04-21',
  '2027-05-01',
  '2027-05-27',
  '2027-09-07',
  '2027-10-12',
  '2027-11-02',
  '2027-11-15',
  '2027-11-20',
  '2027-12-25',
];

// =====================================================================
//                      Discount per day calculation
// =====================================================================

const calculateDiscountForDay = (
  input: SimulationInput,
  dayIndex: number,
  daysForDueDate: number,
  currentDate: Date,
  dueDate: Date,
  holidays: Set<string>,
): number => {
  if (!input.discountSettings) {
    return 0;
  }
  if (dayIndex >= daysForDueDate) {
    // No discount on the due date itself or later.
    return 0;
  }

  const ds = input.discountSettings;

  const original = input.chargeValue;

  switch (ds.modality) {
    case 'FIXED_VALUE_UNTIL_SPECIFIED_DATE': {
      const items = ds.discountFixedDate ?? [];

      const valid = items.filter((it) => dayIndex <= it.daysActive);

      if (valid.length === 0) {
        return 0;
      }
      return Math.max(...valid.map((it) => it.value));
    }

    case 'PERCENTAGE_UNTIL_SPECIFIED_DATE': {
      const items = ds.discountFixedDate ?? [];

      const valid = items.filter((it) => dayIndex <= it.daysActive);

      if (valid.length === 0) {
        return 0;
      }
      return Math.max(
        ...valid.map((it) => Math.round((it.value / 10000) * original)),
      );
    }

    case 'VALUE_PER_RUNNING_DAY_ADVANCE': {
      const daysAhead = daysForDueDate - dayIndex;

      return ds.value * daysAhead;
    }

    case 'VALUE_PER_BUSINESS_DAY_ADVANCE': {
      const businessDays = businessDaysBetween(currentDate, dueDate, holidays);

      return ds.value * businessDays;
    }

    case 'PERCENTAGE_PER_RUNNING_DAY_ADVANCE': {
      const daysAhead = daysForDueDate - dayIndex;

      return Math.round((ds.value / 10000) * original * daysAhead);
    }

    case 'PERCENTAGE_PER_BUSINESS_DAY_ADVANCE': {
      const businessDays = businessDaysBetween(currentDate, dueDate, holidays);

      return Math.round((ds.value / 10000) * original * businessDays);
    }

    default:
      return 0;
  }
};

const calculateInterestForDay = (
  input: SimulationInput,
  dayIndex: number,
  daysForDueDate: number,
): number => {
  if (!input.interests) {
    return 0;
  }
  const daysAfterDue = dayIndex - daysForDueDate;

  if (daysAfterDue <= 0) {
    return 0;
  }
  // Daily percentage rule: (basis_points / 10000) * chargeValue * daysAfterDue
  return Math.round(
    (input.interests.value / 10000) * input.chargeValue * daysAfterDue,
  );
};

const calculateFineForDay = (
  input: SimulationInput,
  dayIndex: number,
  daysForDueDate: number,
): number => {
  if (!input.fines) {
    return 0;
  }
  if (dayIndex <= daysForDueDate) {
    return 0;
  }
  if (input.fines.type === 'FIXED') {
    return input.fines.value;
  }
  // Default and PERCENTAGE: basis points × chargeValue, applied once.
  return Math.round((input.fines.value / 10000) * input.chargeValue);
};

// =====================================================================
//                          Main simulator
// =====================================================================

export const simulateChargeDiscount = (
  input: SimulationInput,
): SimulationRow[] => {
  if (input.chargeValue <= 0) {
    throw new Error('chargeValue must be positive (in cents).');
  }
  if (input.daysForDueDate <= 0) {
    throw new Error('daysForDueDate must be positive.');
  }

  const daysAfterDueDate = input.daysAfterDueDate ?? 15;

  const creationDate = stripTime(input.creationDate ?? new Date());

  const dueDate = addDays(creationDate, input.daysForDueDate);

  const holidays = new Set<string>(
    input.holidays ?? DEFAULT_BR_BANKING_HOLIDAYS,
  );

  const granularity = input.granularity ?? 'daily';

  const lastDayIndex = input.daysForDueDate + daysAfterDueDate;

  const rows: SimulationRow[] = [];

  for (let dayIndex = 0; dayIndex <= lastDayIndex; dayIndex++) {
    const currentDate = addDays(creationDate, dayIndex);

    const discount = calculateDiscountForDay(
      input,
      dayIndex,
      input.daysForDueDate,
      currentDate,
      dueDate,
      holidays,
    );

    const interest = calculateInterestForDay(
      input,
      dayIndex,
      input.daysForDueDate,
    );

    const fine = calculateFineForDay(input, dayIndex, input.daysForDueDate);

    rows.push({
      date: formatDate(currentDate),
      daysFromCreation: dayIndex,
      daysToDueDate: input.daysForDueDate - dayIndex,
      isBusinessDay: isBusinessDay(currentDate, holidays),
      value: input.chargeValue,
      discount,
      interest,
      fine,
      total: input.chargeValue - discount + interest + fine,
    });
  }

  if (granularity === 'summary') {
    return summarize(rows, input.daysForDueDate);
  }

  return rows;
};

const summarize = (
  rows: SimulationRow[],
  daysForDueDate: number,
): SimulationRow[] => {
  const out: SimulationRow[] = [];

  const isMilestone = (idx: number, row: SimulationRow): boolean => {
    if (idx === 0) {
      return true;
    }
    if (idx === rows.length - 1) {
      return true;
    }
    if (row.daysFromCreation === daysForDueDate) {
      return true;
    }
    if (row.daysFromCreation === daysForDueDate + 1) {
      return true;
    }
    const prev = rows[idx - 1];

    return (
      row.discount !== prev.discount ||
      row.interest !== prev.interest ||
      row.fine !== prev.fine
    );
  };

  rows.forEach((row, idx) => {
    if (isMilestone(idx, row)) {
      out.push(row);
    }
  });

  return out;
};
