"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteHourQuotaAction,
  upsertHourQuotaAction,
  type HourQuotaFormState,
} from "@/lib/actions/hour-quotas";
import type { HourQuotaOverride, IncomeSource } from "@/lib/types/income-source";

const initialState: HourQuotaFormState = { status: "idle" };

function monthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(
    new Date(year, monthNum - 1, 1)
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending ? "שומר..." : "שמירה"}
    </button>
  );
}

export default function HourQuotaModal({
  source,
  overrides,
  onClose,
}: {
  source: IncomeSource;
  overrides: HourQuotaOverride[];
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(upsertHourQuotaAction, initialState);
  const [isDeleting, startTransition] = useTransition();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg dark:bg-zinc-900">
        <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          תקן שעות לפי חודש · {source.name}
        </h3>
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          ברירת מחדל: {source.standard_hours ?? "—"} שעות. שעות מעבר לתקן משולמות חודש
          אחרי התשלום הרגיל.
        </p>

        {overrides.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1">
            {overrides.map((override) => (
              <li
                key={override.id}
                className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <span>
                  {monthLabel(override.month)} · {override.hours} שעות
                </span>
                <button
                  type="button"
                  aria-label="מחיקה"
                  disabled={isDeleting}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteHourQuotaAction(override.id);
                      if (result.status === "error") window.alert(result.message);
                    })
                  }
                  className="text-red-600 disabled:opacity-60 dark:text-red-400"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="source_id" value={source.id} />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="month"
              type="month"
              required
              aria-label="חודש"
              className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
            />
            <input
              name="hours"
              type="number"
              step="0.25"
              min="0"
              required
              placeholder="שעות תקן"
              className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
            />
          </div>
          {state.status === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
          )}
          <div className="flex gap-2">
            <SaveButton />
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-black/10 px-4 text-sm font-medium text-zinc-700 dark:border-white/20 dark:text-zinc-300"
            >
              סגירה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
