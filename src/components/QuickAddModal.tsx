"use client";

import { useState } from "react";
import LogSessionForm from "@/components/LogSessionForm";

type IncomeSourceOption = {
  id: string;
  name: string;
};

export default function QuickAddModal({
  incomeSources,
}: {
  incomeSources: IncomeSourceOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="הוספת משמרת/פגישה"
        className="fixed bottom-20 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-rose-400 text-2xl font-semibold text-white shadow-lg transition-colors transition-transform hover:scale-105 hover:bg-rose-500 md:bottom-6 md:end-6"
      >
        +
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="סגירה"
              className="absolute -top-3 -end-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-400 text-sm font-medium text-white shadow hover:bg-rose-500"
            >
              ✕
            </button>
            <LogSessionForm incomeSources={incomeSources} />
          </div>
        </div>
      )}
    </>
  );
}
