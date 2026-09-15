"use client";

import { useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";

export type MonthToggleOption = {
  value: string;
  label: string;
  sublabel: string;
};

export default function MonthToggle({
  options,
  selected,
  hrefFor,
}: {
  options: MonthToggleOption[];
  selected: string;
  hrefFor: (value: string) => string;
}) {
  const router = useRouter();
  const [optimisticSelected, setOptimisticSelected] = useOptimistic(selected);

  function handleSelect(value: string) {
    if (value === optimisticSelected) return;
    startTransition(() => {
      setOptimisticSelected(value);
      router.push(hrefFor(value));
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900">
      {options.map((option) => {
        const isActive = optimisticSelected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`flex h-11 flex-col items-center justify-center rounded-md px-3 text-center transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
            }`}
          >
            <span className="text-sm font-medium">{option.label}</span>
            <span
              className={`text-xs ${
                isActive
                  ? "text-white/80 dark:text-zinc-900/70"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {option.sublabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
