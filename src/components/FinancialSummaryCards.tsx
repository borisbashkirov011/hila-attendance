import { formatCurrency } from "@/lib/utils/format";

export type MonthFinancialSummary = {
  label: string;
  gross: number;
  net: number;
  taxPension: number;
  hours: number;
  avgHourlyRate: number;
  employeePct: number;
  freelancePct: number;
};

function MonthCard({
  summary,
  variant,
}: {
  summary: MonthFinancialSummary;
  variant: "current" | "next";
}) {
  const cardStyles =
    variant === "current"
      ? "bg-gradient-to-br from-rose-100/80 via-orange-50/60 to-rose-50/80 border border-rose-200/70"
      : "bg-gradient-to-br from-purple-100/70 via-slate-50 to-indigo-50/70 border border-purple-200/60";

  const pillStyles =
    variant === "current"
      ? "bg-white/70 text-rose-700"
      : "bg-white/70 text-purple-700";

  return (
    <div className={`rounded-3xl p-6 shadow-sm md:flex-1 ${cardStyles}`}>
      <p className="mb-4 text-sm font-medium tracking-tight text-slate-600">
        {summary.label}
      </p>

      <p className="text-xs font-medium text-slate-500">צפי הכנסות (נטו)</p>
      <p className="mb-4 text-3xl font-bold text-slate-800">
        {formatCurrency(summary.net)}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${pillStyles}`}
        >
          ברוטו · {formatCurrency(summary.gross)}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
          מיסים ופנסיה · {formatCurrency(summary.taxPension)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full bg-rose-300"
            style={{ width: `${summary.employeePct}%` }}
          />
          <div
            className="h-full bg-orange-300"
            style={{ width: `${summary.freelancePct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-300" />
            שכירה · {summary.employeePct}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-300" />
            עצמאית · {summary.freelancePct}%
          </span>
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 p-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
            סה״כ שעות · {summary.hours}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
            תעריף ממוצע · {formatCurrency(summary.avgHourlyRate)}/שעה
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FinancialSummaryCards({
  current,
  next,
}: {
  current: MonthFinancialSummary;
  next: MonthFinancialSummary;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
      <MonthCard summary={current} variant="current" />
      <MonthCard summary={next} variant="next" />
    </div>
  );
}
