import { formatCurrency } from "@/lib/utils/format";
import type { PaymentEntry } from "@/lib/utils/payment-schedule";

type SourceRow = {
  sourceId: string;
  sourceName: string;
  category: string;
  hours: number;
  overflowHours: number;
  items: number;
  gross: number;
  net: number;
};

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2).replace(/0$/, "");
}

export default function IncomeSourceBreakdown({
  entries,
  monthLabel,
}: {
  entries: PaymentEntry[];
  monthLabel: string;
}) {
  const bySource = new Map<string, SourceRow>();
  for (const entry of entries) {
    const row = bySource.get(entry.sourceId) ?? {
      sourceId: entry.sourceId,
      sourceName: entry.sourceName,
      category: entry.category,
      hours: 0,
      overflowHours: 0,
      items: 0,
      gross: 0,
      net: 0,
    };
    row.hours += entry.hours;
    if (entry.isOverflow) row.overflowHours += entry.hours;
    row.items += 1;
    row.gross += entry.gross;
    row.net += entry.net;
    bySource.set(entry.sourceId, row);
  }
  const rows = [...bySource.values()].sort((a, b) => b.gross - a.gross);
  const totalGross = rows.reduce((sum, row) => sum + row.gross, 0);

  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
      <h2 className="mb-1 text-base font-semibold tracking-tight text-slate-800">
        מאיפה הכסף מגיע
      </h2>
      <p className="mb-4 text-sm text-slate-400">תשלומים צפויים ב{monthLabel}</p>

      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          אין תשלומים צפויים בחודש זה.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-rose-50">
          {rows.map((row) => (
            <div
              key={row.sourceId}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {row.sourceName}
                  <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
                    {row.category === "employee" ? "שכירה" : "עצמאית"}
                  </span>
                </p>
                <p className="text-slate-400">
                  {row.hours > 0
                    ? `${formatHours(row.hours)} שעות`
                    : `${row.items} ${row.items === 1 ? "עבודה" : "עבודות"}`}
                  {row.overflowHours > 0 &&
                    ` (מתוכן ${formatHours(row.overflowHours)} מעבר לתקן)`}
                </p>
              </div>
              <div className="text-end">
                <p className="font-medium text-slate-800">{formatCurrency(row.gross)}</p>
                <p className="text-slate-400">נטו {formatCurrency(row.net)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 text-sm font-semibold text-slate-900">
            <span>סה״כ ברוטו</span>
            <span>{formatCurrency(totalGross)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
