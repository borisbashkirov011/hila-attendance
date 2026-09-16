"use client";

import { useState } from "react";
import { Receipt, ShoppingCart } from "lucide-react";
import LogSessionForm from "@/components/LogSessionForm";
import AddReceiptModal from "@/components/AddReceiptModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import type { IncomeSource } from "@/lib/types/income-source";

type IncomeSourceOption = {
  id: string;
  name: string;
};

export default function DashboardQuickActions({
  incomeSources,
  freelanceSources,
}: {
  incomeSources: IncomeSourceOption[];
  freelanceSources: IncomeSource[];
}) {
  const [openModal, setOpenModal] = useState<"shift" | "receipt" | "expense" | null>(
    null
  );
  const today = toDateOnlyString(new Date());

  return (
    <>
      <div className="fixed bottom-20 end-4 z-40 flex flex-col items-end gap-3 md:bottom-6 md:end-6">
        <button
          type="button"
          onClick={() => setOpenModal("expense")}
          aria-label="הוספת הוצאה"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-amber-500"
        >
          <ShoppingCart className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("receipt")}
          aria-label="הוספת קבלה"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-500"
        >
          <Receipt className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("shift")}
          aria-label="הוספת משמרת/פגישה"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-400 text-2xl font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-rose-500"
        >
          +
        </button>
      </div>

      {openModal === "shift" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setOpenModal(null)}
              aria-label="סגירה"
              className="absolute -top-3 -end-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-400 text-sm font-medium text-white shadow hover:bg-rose-500"
            >
              ✕
            </button>
            <LogSessionForm incomeSources={incomeSources} />
          </div>
        </div>
      )}

      {openModal === "receipt" && (
        <AddReceiptModal
          initialDate={today}
          sources={freelanceSources}
          onClose={() => setOpenModal(null)}
        />
      )}

      {openModal === "expense" && (
        <AddExpenseModal initialDate={today} onClose={() => setOpenModal(null)} />
      )}
    </>
  );
}
