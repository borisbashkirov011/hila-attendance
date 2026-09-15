"use client";

import { useTransition, useState } from "react";
import {
  deleteIncomeSourceAction,
  reactivateIncomeSourceAction,
} from "@/lib/actions/income-sources";
import { paymentTimingLabel } from "@/lib/utils/payment-terms";
import IncomeSourceFormModal from "@/components/IncomeSourceFormModal";
import type { IncomeSource } from "@/lib/types/income-source";

const CATEGORY_LABELS: Record<string, string> = {
  employee: "שכירה",
  freelance: "עצמאית",
};

function paymentTermLabel(source: IncomeSource): string {
  return paymentTimingLabel(source.payment_mode, source.payment_offset_days);
}

export default function IncomeSourceManager({
  incomeSources,
}: {
  incomeSources: IncomeSource[];
}) {
  const [modalSource, setModalSource] = useState<IncomeSource | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(source: IncomeSource) {
    if (!window.confirm(`האם למחוק את "${source.name}"?`)) return;
    setPendingId(source.id);
    startTransition(async () => {
      const result = await deleteIncomeSourceAction(source.id);
      if (result.status === "error") {
        window.alert(result.message ?? "מחיקת מקור ההכנסה נכשלה.");
      }
      setPendingId(null);
    });
  }

  function handleReactivate(source: IncomeSource) {
    setPendingId(source.id);
    startTransition(async () => {
      const result = await reactivateIncomeSourceAction(source.id);
      if (result.status === "error") {
        window.alert(result.message ?? "הפעלת מקור ההכנסה נכשלה.");
      }
      setPendingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          מקורות הכנסה
        </h2>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex h-9 items-center justify-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white transition-colors dark:bg-zinc-100 dark:text-zinc-900"
        >
          מקור הכנסה חדש
        </button>
      </div>

      {incomeSources.length === 0 && (
        <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
          לא נמצאו מקורות הכנסה.
        </p>
      )}

      <div className="flex flex-col divide-y divide-black/5 dark:divide-white/10">
        {incomeSources.map((source) => (
          <div
            key={source.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                {source.name}
                {!source.is_active && (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    לא פעיל
                  </span>
                )}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {CATEGORY_LABELS[source.category] ?? source.category} ·{" "}
                {paymentTermLabel(source)}
                {source.default_hourly_rate !== null &&
                  ` · ₪${source.default_hourly_rate}`}
              </p>
            </div>

            <div className="flex gap-2">
              {source.is_active ? (
                <>
                  <button
                    type="button"
                    onClick={() => setModalSource(source)}
                    className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-zinc-700 dark:border-white/20 dark:text-zinc-300"
                  >
                    עריכה
                  </button>
                  <button
                    type="button"
                    disabled={isPending && pendingId === source.id}
                    onClick={() => handleDelete(source)}
                    className="flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
                  >
                    מחיקה
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isPending && pendingId === source.id}
                  onClick={() => handleReactivate(source)}
                  className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-zinc-300"
                >
                  הפעלה מחדש
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <IncomeSourceFormModal source={null} onClose={() => setIsAdding(false)} />
      )}
      {modalSource && (
        <IncomeSourceFormModal
          source={modalSource}
          onClose={() => setModalSource(null)}
        />
      )}
    </div>
  );
}
