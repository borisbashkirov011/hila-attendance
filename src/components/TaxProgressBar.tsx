const OSEK_PATUR_LIMIT = 120000;

export default function TaxProgressBar({ currentTotal }: { currentTotal: number }) {
  const percentage = Math.min((currentTotal / OSEK_PATUR_LIMIT) * 100, 100);
  const remaining = Math.max(OSEK_PATUR_LIMIT - currentTotal, 0);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          סה״כ הכנסות: ₪{currentTotal.toLocaleString()}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          מתוך ₪120,000 (תקרת עוסק פטור)
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        נותר עד התקרה: ₪{remaining.toLocaleString()}
      </span>
    </div>
  );
}
