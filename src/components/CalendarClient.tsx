"use client";

import { useState, useTransition } from "react";
import { deleteWorkLogAction } from "@/lib/actions/work-logs";
import { getMonthGridDates } from "@/lib/utils/calendar";
import { getShiftStatus } from "@/lib/utils/shift-status";
import { formatDate } from "@/lib/utils/format";
import LogSessionForm from "@/components/LogSessionForm";
import type { WorkLog } from "@/lib/types/work-log";

type IncomeSourceOption = {
  id: string;
  name: string;
};

type FormTarget =
  | { mode: "add"; workDate: string }
  | { mode: "edit"; log: WorkLog };

const WEEKDAY_LABELS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export default function CalendarClient({
  year,
  month,
  logs,
  incomeSources,
}: {
  year: number;
  month: number;
  logs: WorkLog[];
  incomeSources: IncomeSourceOption[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [isDeleting, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const cells = getMonthGridDates(year, month);
  const logsByDate = new Map<string, WorkLog[]>();
  for (const log of logs) {
    const dayLogs = logsByDate.get(log.work_date) ?? [];
    dayLogs.push(log);
    logsByDate.set(log.work_date, dayLogs);
  }

  function handleDelete(log: WorkLog) {
    if (!window.confirm("האם למחוק רשומה זו?")) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteWorkLogAction(log.id);
      if (result.status === "error") {
        setDeleteError(result.message ?? "מחיקת המשמרת נכשלה.");
      }
    });
  }

  const selectedDateLogs = selectedDate ? logsByDate.get(selectedDate) ?? [] : [];

  return (
    <>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-zinc-500 sm:gap-1 sm:text-xs dark:text-zinc-400">
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={`${label}-${index}`} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayLogs = logsByDate.get(date) ?? [];
          const dayNumber = Number(date.slice(-2));

          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate(date)}
              className="flex aspect-square min-h-14 flex-col items-start gap-0.5 overflow-hidden rounded-md border border-black/10 p-0.5 text-start text-[10px] hover:bg-black/5 sm:min-h-0 sm:gap-1 sm:p-1 sm:text-xs dark:border-white/10 dark:hover:bg-white/10"
            >
              <span className="text-zinc-500 dark:text-zinc-400">{dayNumber}</span>
              <div className="flex w-full flex-col gap-0.5">
                {dayLogs.map((log) => {
                  const status = getShiftStatus(log.work_date);
                  return (
                    <span
                      key={log.id}
                      className={`w-full truncate rounded px-0.5 py-0.5 text-start text-[9px] font-medium sm:px-1 sm:text-[10px] ${
                        status === "planned"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      }`}
                    >
                      {log.income_sources?.name ?? "משמרת"}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && !formTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg dark:bg-zinc-900">
            <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              משמרות ל-{formatDate(selectedDate)}
            </h3>

            {deleteError && (
              <p className="mb-2 text-sm text-red-600 dark:text-red-400">
                {deleteError}
              </p>
            )}

            {selectedDateLogs.length === 0 ? (
              <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                אין משמרות ביום זה.
              </p>
            ) : (
              <ul className="mb-3 flex flex-col gap-2">
                {selectedDateLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-black/10 p-2 text-sm dark:border-white/10"
                  >
                    <span className="truncate">
                      {log.income_sources?.name ?? "משמרת"} · ₪{log.net_amount.toFixed(2)}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="עריכה"
                        onClick={() => setFormTarget({ mode: "edit", log })}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        aria-label="מחיקה"
                        disabled={isDeleting}
                        onClick={() => handleDelete(log)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormTarget({ mode: "add", workDate: selectedDate })}
                className="flex h-11 flex-1 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                הוספת משמרת
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="flex h-11 flex-1 items-center justify-center rounded-md border border-black/10 px-4 text-sm font-medium text-zinc-700 dark:border-white/20 dark:text-zinc-300"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}

      {formTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setFormTarget(null)}
              aria-label="סגירה"
              className="absolute -top-3 -end-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-white shadow dark:bg-zinc-100 dark:text-zinc-900"
            >
              ✕
            </button>
            <LogSessionForm
              key={formTarget.mode === "edit" ? formTarget.log.id : `add-${formTarget.workDate}`}
              incomeSources={incomeSources}
              existingLog={formTarget.mode === "edit" ? formTarget.log : undefined}
              defaultWorkDate={formTarget.mode === "add" ? formTarget.workDate : undefined}
              onSuccess={() => setFormTarget(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
