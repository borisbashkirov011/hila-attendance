"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { addReceipt, uploadReceiptFile } from "@/app/actions/receiptActions";
import type { IncomeSource } from "@/lib/types/income-source";

export default function AddReceiptModal({
  initialDate,
  sources,
  onClose,
}: {
  initialDate: string;
  sources: IncomeSource[];
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const initialMonth = useMemo(() => initialDate.slice(0, 7), [initialDate]);

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
          source_id: String(formData.get("source_id")),
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
              defaultValue={initialDate}
              required
              className="h-11 rounded-md border border-black/10 px-3 text-sm dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="source_id" className="text-sm text-zinc-700 dark:text-zinc-300">
              לקוח
            </label>
            <select
              id="source_id"
              name="source_id"
              required
              defaultValue=""
              className="h-11 rounded-md border border-black/10 px-3 text-sm dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50"
            >
              <option value="" disabled>
                בחר לקוח
              </option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
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
              defaultValue={initialMonth}
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
            <label htmlFor="receipt-file-upload" className="text-sm text-zinc-700 dark:text-zinc-300">
              קובץ קבלה
            </label>
            <input
              id="receipt-file-upload"
              name="file"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) =>
                setFileName(event.target.files?.[0]?.name ?? null)
              }
            />
            <label
              htmlFor="receipt-file-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-black/15 px-4 py-6 text-center text-sm text-zinc-600 transition-colors hover:border-black/30 dark:border-white/20 dark:text-zinc-400 dark:hover:border-white/40"
            >
              <Upload className="h-6 w-6" />
              <span>{fileName ?? "לחצו להעלאת קובץ (תמונה או PDF)"}</span>
            </label>
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
