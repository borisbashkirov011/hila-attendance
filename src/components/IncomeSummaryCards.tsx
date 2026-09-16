export default function IncomeSummaryCards({
  expectedIncome,
  actualIncome,
}: {
  expectedIncome: number;
  actualIncome: number;
}) {
  const pending = expectedIncome - actualIncome;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          צפי הכנסות
        </span>
        <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          ₪{expectedIncome.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          הכנסות בפועל
        </span>
        <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          ₪{actualIncome.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          יתרה לגבייה
        </span>
        <span
          className={`text-xl font-semibold ${
            pending > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          ₪{pending.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
