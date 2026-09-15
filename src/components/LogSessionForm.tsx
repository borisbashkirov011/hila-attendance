"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  logWorkSessionAction,
  updateWorkLogAction,
  type WorkLogFormState,
} from "@/lib/actions/work-logs";
import WorkLogFormFields from "@/components/WorkLogFormFields";
import type { WorkLog } from "@/lib/types/work-log";

type IncomeSourceOption = {
  id: string;
  name: string;
};

const initialState: WorkLogFormState = { status: "idle" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center rounded-full bg-rose-400 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "שומר..." : label}
    </button>
  );
}

export default function LogSessionForm({
  incomeSources,
  existingLog,
  defaultWorkDate,
  onSuccess,
}: {
  incomeSources: IncomeSourceOption[];
  existingLog?: WorkLog;
  defaultWorkDate?: string;
  onSuccess?: () => void;
}) {
  const isEditing = Boolean(existingLog);
  const action = isEditing ? updateWorkLogAction : logWorkSessionAction;
  const [state, formAction] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {isEditing ? "עריכת משמרת/פגישה" : "הוספת משמרת/פגישה"}
      </h2>

      {isEditing && <input type="hidden" name="id" value={existingLog!.id} />}

      <WorkLogFormFields
        incomeSources={incomeSources}
        defaults={
          isEditing
            ? {
                sourceId: existingLog!.source_id,
                workDate: existingLog!.work_date,
                hoursWorked: existingLog!.hours_worked,
                grossAmount: existingLog!.gross_amount,
              }
            : { workDate: defaultWorkDate ?? today }
        }
      />

      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="text-sm text-green-600 dark:text-green-400">
          {state.message}
        </p>
      )}

      <SubmitButton label={isEditing ? "שמירת שינויים" : "הוספת משמרת/פגישה"} />
    </form>
  );
}
