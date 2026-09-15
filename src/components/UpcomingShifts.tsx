import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { WorkLog } from "@/lib/types/work-log";

export default function UpcomingShifts({ logs }: { logs: WorkLog[] }) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-50 text-base">
          🗓️
        </span>
        <h2 className="text-base font-semibold tracking-tight text-slate-800">
          משמרות קרובות
        </h2>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-3xl">🌸</span>
          <p className="text-sm font-medium text-slate-400">
            אין משמרות קרובות מתוכננות.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-rose-50">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {log.income_sources?.name ?? "מקור לא ידוע"}
                </p>
                <p className="text-slate-400">{formatDate(log.work_date)}</p>
              </div>
              <div className="text-end">
                <p className="font-medium text-slate-800">
                  {formatCurrency(Number(log.net_amount))}
                </p>
                {log.hours_worked !== null && (
                  <p className="text-slate-400">{log.hours_worked} שעות</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
