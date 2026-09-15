"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createIncomeSourceAction,
  updateIncomeSourceAction,
  type IncomeSourceFormState,
} from "@/lib/actions/income-sources";
import { paymentTimingFor } from "@/lib/utils/payment-terms";
import IncomeSourceFormFields from "@/components/IncomeSourceFormFields";
import type { IncomeSource } from "@/lib/types/income-source";

const initialState: IncomeSourceFormState = { status: "idle" };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 flex-1 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
    >
      {pending ? "שומר..." : "שמירה"}
    </button>
  );
}

export default function IncomeSourceFormModal({
  source,
  onClose,
}: {
  source: IncomeSource | null;
  onClose: () => void;
}) {
  const isEditing = source !== null;
  const action = isEditing ? updateIncomeSourceAction : createIncomeSourceAction;
  const [state, formAction] = useActionState(action, initialState);

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "success") {
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {isEditing ? "עריכת מקור הכנסה" : "מקור הכנסה חדש"}
        </h3>
        <form action={formAction} className="flex flex-col gap-4">
          {isEditing && <input type="hidden" name="id" value={source.id} />}
          <IncomeSourceFormFields
            idPrefix={isEditing ? `edit-${source.id}-` : "new-"}
            defaults={
              isEditing
                ? {
                    name: source.name,
                    category: source.category,
                    defaultHourlyRate: source.default_hourly_rate,
                    ...(() => {
                      const { timing, day } = paymentTimingFor(
                        source.payment_mode,
                        source.payment_offset_days
                      );
                      return { paymentTiming: timing, paymentDay: day };
                    })(),
                  }
                : undefined
            }
          />

          {state.status === "error" && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.message}
            </p>
          )}

          <div className="flex gap-2">
            <SaveButton />
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-md border border-black/10 px-4 text-sm font-medium text-zinc-700 dark:border-white/20 dark:text-zinc-300"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
