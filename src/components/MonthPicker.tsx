"use client";

import { useState } from "react";

const MONTH_NAMES = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const selectClassName =
  "h-11 flex-1 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20 dark:bg-zinc-800 dark:text-zinc-50";

// Month + year selects that submit a single 'YYYY-MM' value under `name`
// (native <input type="month"> is a plain text box in desktop Safari/Firefox).
export default function MonthPicker({
  name,
  defaultValue,
  id,
}: {
  name: string;
  defaultValue?: string; // 'YYYY-MM'
  id?: string;
}) {
  const now = new Date();
  const [initialYear, initialMonth] = (
    defaultValue ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  )
    .split("-")
    .map(Number);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  if (!years.includes(year)) years.unshift(year);

  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={`${year}-${String(month).padStart(2, "0")}`} />
      <select
        id={id}
        aria-label="חודש"
        value={month}
        onChange={(event) => setMonth(Number(event.target.value))}
        className={selectClassName}
      >
        {MONTH_NAMES.map((label, index) => (
          <option key={label} value={index + 1}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="שנה"
        value={year}
        onChange={(event) => setYear(Number(event.target.value))}
        className={selectClassName}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
