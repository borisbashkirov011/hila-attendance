"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReceipt, uploadReceiptFile } from "@/app/actions/receiptActions";

const CLIENT_TYPE_OPTIONS = ["מעונות", "כללית (עצמאי)", "פרטי"];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function AddReceiptModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const file = formData.get("file") as File | null;
        let fileUrl: string | undefined;

        if (file && file.size > 0) {
          fileUrl = await uploadReceiptFile(formData);
        }

        await addReceipt({
          receipt_date: String(formData.get("receipt_date")),
          client_type: String(formData.get("client_type")),
          for_month: String(formData.get("for_month")),
          amount: Number(formData.get("amount")),
          file_url: fileUrl,
        });

        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה לא ידועה");
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg dark:bg-zinc-900">
        <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          הוספת קבלה
        </h3>
        <form
          ref={formRef}
          action={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="receipt_date" className="text-sm text-zinc-700 dark:text-zinc-300">
              תאריך
            </label>
            <input
              id="receipt_date"
              name="receipt_date"
              type="date"
              defaultValue={todayDateString()}
              required
              className="h-11 rounded-md border border-black/10 px-3 text-sm dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="client_type" className="text-sm text-zinc-700 dark:text-zinc-300">
              סוג לקוח
            </label>
            <select
              id="client_type"
              name="client_type"
              required
              className="h-11 rounded-md border border-black/10 px-3 text-sm dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {CLIENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="for_month" className="text-sm text-zinc-700 dark:text-zinc-300">
              עבור חודש
            </label>
            <input
              id="for_month"
              name="for_month"
              type="month"
              defaultValue={currentMonthString()}
              required
              className="h-11 rounded-md border border-black/10 px-3 text-sm dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="amount" className="text-sm text-zinc-700 dark:text-zinc-300">
              סכום
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              className="h-11 rounded-md border border-black/10 px-3 text-sm dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="file" className="text-sm text-zinc-700 dark:text-zinc-300">
              קובץ קבלה
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/*,application/pdf"
              className="text-sm text-zinc-700 dark:text-zinc-300"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex h-11 flex-1 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isPending ? "שומר..." : "שמירה"}
            </button>
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
