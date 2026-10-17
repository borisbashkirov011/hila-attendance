import { addMonthsClamped, toDateOnlyString } from "@/lib/utils/payment-dates";

export type ScheduleLog = {
  id: string;
  source_id: string;
  work_date: string;
  hours_worked: number | null;
  gross_amount: number;
  net_amount: number;
  tax_pension_amount: number;
  expected_payment_date: string;
  created_at?: string | null;
  income_sources: { category: string; standard_hours: number | null } | null;
};

export type QuotaOverride = { source_id: string; month: string; hours: number };

export type PaymentEntry = {
  paymentDate: string; // 'YYYY-MM-DD'
  category: string;
  hours: number;
  gross: number;
  net: number;
  taxPension: number;
  isOverflow: boolean;
};

function quotaKey(sourceId: string, month: string) {
  return `${sourceId}:${month}`;
}

export function buildQuotaLookup(overrides: QuotaOverride[]) {
  const map = new Map<string, number>();
  for (const o of overrides) map.set(quotaKey(o.source_id, o.month), Number(o.hours));
  return (sourceId: string, month: string, defaultHours: number | null) =>
    map.get(quotaKey(sourceId, month)) ?? (defaultHours === null ? null : Number(defaultHours));
}

// Splits each source's monthly hours at its standard-hours quota: hours within the
// quota are paid on the log's expected_payment_date, hours beyond it one month later.
export function buildPaymentEntries(
  logs: ScheduleLog[],
  overrides: QuotaOverride[]
): PaymentEntry[] {
  const quotaFor = buildQuotaLookup(overrides);
  const groups = new Map<string, ScheduleLog[]>();
  for (const log of logs) {
    const key = quotaKey(log.source_id, log.work_date.slice(0, 7));
    const group = groups.get(key) ?? [];
    group.push(log);
    groups.set(key, group);
  }

  const entries: PaymentEntry[] = [];
  for (const group of groups.values()) {
    group.sort(
      (a, b) =>
        a.work_date.localeCompare(b.work_date) ||
        (a.created_at ?? "").localeCompare(b.created_at ?? "")
    );
    const first = group[0];
    const quota = quotaFor(
      first.source_id,
      first.work_date.slice(0, 7),
      first.income_sources?.standard_hours ?? null
    );
    let remaining = quota ?? Infinity;

    for (const log of group) {
      const hours = Number(log.hours_worked ?? 0);
      const gross = Number(log.gross_amount);
      const net = Number(log.net_amount);
      const taxPension = Number(log.tax_pension_amount);
      const category = log.income_sources?.category ?? "employee";

      const regularHours = hours > 0 ? Math.min(hours, Math.max(remaining, 0)) : 0;
      const overflowHours = hours > 0 ? hours - regularHours : 0;
      remaining -= hours;

      const overflowShare = hours > 0 ? overflowHours / hours : 0;
      const regularShare = 1 - overflowShare;

      if (regularShare > 0) {
        entries.push({
          paymentDate: log.expected_payment_date,
          category,
          hours: hours > 0 ? regularHours : 0,
          gross: gross * regularShare,
          net: net * regularShare,
          taxPension: taxPension * regularShare,
          isOverflow: false,
        });
      }
      if (overflowShare > 0) {
        entries.push({
          paymentDate: toDateOnlyString(addMonthsClamped(log.expected_payment_date, 1)),
          category,
          hours: overflowHours,
          gross: gross * overflowShare,
          net: net * overflowShare,
          taxPension: taxPension * overflowShare,
          isOverflow: true,
        });
      }
    }
  }
  return entries;
}
