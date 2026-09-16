"use client";

import { useState } from "react";
import AddReceiptModal from "@/components/AddReceiptModal";

export default function AddReceiptButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        הוספת קבלה +
      </button>
      {isOpen && <AddReceiptModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
