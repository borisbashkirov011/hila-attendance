"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { addExpense, uploadExpenseFile } from "@/app/actions/expenseActions";

export default function AddExpenseModal({
  initialDate,
  onClose,
}: {
  initialDate: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const file = formData.get("file") as File | null;
      let fileUrl: string | undefined;

      if (file && file.size > 0) {
        const uploadResult = await uploadExpenseFile(formData);
        if (!uploadResult.success) {
          alert(uploadResult.error);
          return;
        }
        fileUrl = uploadResult.data;
      }

      const result = await addExpense({
        expense_date: String(formData.get("expense_date")),
        supplier_name: String(formData.get("supplier_name")),
        amount: Number(formData.get("amount")),
        file_url: fileUrl,
      });

      if (!result.success) {
        alert(result.error);
        return;
      }

      router.refresh();
      onClose();
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
          הוספת הוצאה
        </h3>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="expense_date" className="text-sm text-zinc-700 dark:text-zinc-300">
              תאריך
            </label>
            <input
              id="expense_date"
              name="expense_date"
              type="date"
              defaultValue={initialDate}
              required
              className="h-11 rounded-md border border-black/10 px-3 text-sm dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="supplier_name" className="text-sm text-zinc-700 dark:text-zinc-300">
              ספק / תיאור
            </label>
            <input
              id="supplier_name"
              name="supplier_name"
              type="text"
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
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              קובץ חשבונית
            </span>
            <input
              ref={fileInputRef}
              name="file"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(event) =>
                setFileName(event.target.files?.[0]?.name ?? null)
              }
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-black/15 px-4 py-6 text-center text-sm text-zinc-600 transition-colors hover:border-black/30 dark:border-white/20 dark:text-zinc-400 dark:hover:border-white/40"
            >
              <Upload className="h-6 w-6" />
              <span>{fileName ?? "לחצו להעלאת קובץ (תמונה או PDF)"}</span>
            </div>
          </div>

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
