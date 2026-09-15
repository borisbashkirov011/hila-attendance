import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import { calculateTaxBreakdown } from "@/lib/utils/tax-calculations";
import TaxCalculatorCards from "@/components/TaxCalculatorCards";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

type MonthLogRow = {
  gross_amount: number;
  income_sources: { category: "employee" | "freelance" } | null;
};

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const selectedMonth = month === "next" ? "next" : "current";

  const supabase = await createClient();

  const now = new Date();
  const targetDate =
    selectedMonth === "next"
      ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
      : now;

  const monthStart = toDateOnlyString(startOfMonth(targetDate));
  const monthEnd = toDateOnlyString(endOfMonth(targetDate));

  const { data } = await supabase
    .from("work_logs")
    .select("gross_amount, income_sources(category)")
    .gte("expected_payment_date", monthStart)
    .lte("expected_payment_date", monthEnd);

  const rows = (data ?? []) as unknown as MonthLogRow[];

  const totals = rows.reduce(
    (acc, row) => {
      const gross = Number(row.gross_amount);
      if (row.income_sources?.category === "freelance") {
        acc.freelance += gross;
      } else {
        acc.employee += gross;
      }
      return acc;
    },
    { employee: 0, freelance: 0 }
  );

  const breakdown = calculateTaxBreakdown(totals.employee, totals.freelance);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          מיסים וסוציאליות
        </h1>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900">
            <Link
              href="/taxes?month=current"
              className={`flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                selectedMonth === "current"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              חודש נוכחי
            </Link>
            <Link
              href="/taxes?month=next"
              className={`flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                selectedMonth === "next"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              חודש עוקב
            </Link>
          </div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {monthLabel(targetDate)}
          </span>
        </div>
      </div>

      <TaxCalculatorCards breakdown={breakdown} />
    </div>
  );
}
