"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AddReceiptModal from "@/components/AddReceiptModal";
import { deleteReceipt } from "@/app/actions/receiptActions";
import type { IncomeSource } from "@/lib/types/income-source";

export type ReceiptRowData = {
  id: string;
  receipt_date: string;
  source_id: string;
  client_type: string;
  for_month: string;
  amount: number;
  file_url: string | null;
};

export default function ReceiptRow({
  receipt,
  sources,
}: {
  receipt: ReceiptRowData;
  sources: IncomeSource[];
}) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק את הקבלה?")) return;

    startTransition(async () => {
      const result = await deleteReceipt(receipt.id);
      if (!result.success) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-1 rounded-md border border-black/10 p-3 text-sm dark:border-white/20">
      <span>
        {receipt.receipt_date} · {receipt.client_type} · {receipt.for_month}
      </span>
      <span>₪{receipt.amount}</span>
      {receipt.file_url && (
        <a
          href={receipt.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline dark:text-blue-400"
        >
          קובץ מצורף
        </a>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => setIsEditOpen(true)}
          className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-xs font-medium text-zinc-700 dark:border-white/20 dark:text-zinc-300"
        >
          עריכה
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex h-9 items-center justify-center rounded-md border border-red-200 px-3 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-400"
        >
          {isPending ? "מוחק..." : "מחיקה"}
        </button>
      </div>
      {isEditOpen && (
        <AddReceiptModal
          initialDate={receipt.receipt_date}
          sources={sources}
          receipt={{
            id: receipt.id,
            receipt_date: receipt.receipt_date,
            source_id: receipt.source_id,
            for_month: receipt.for_month,
            amount: receipt.amount,
          }}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </li>
  );
}
