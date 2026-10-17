import { createClient } from "@/lib/supabase/server";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import { calculateTaxBreakdown } from "@/lib/utils/tax-calculations";
import TaxCalculatorCards from "@/components/TaxCalculatorCards";
import MonthToggle from "@/components/MonthToggle";
import AddReceiptButton from "@/components/AddReceiptButton";
import AddExpenseButton from "@/components/AddExpenseButton";
import ReceiptRow from "@/components/ReceiptRow";
import IncomeSummaryWidget from "@/components/IncomeSummaryWidget";
import { formatCurrency } from "@/lib/utils/format";
import { getReceiptsForPaymentMonth, getReceiptsForYear } from "@/lib/data/receipts";
import { getExpensesForYear } from "@/lib/data/expenses";
import type { IncomeSource } from "@/lib/types/income-source";

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

const MONTH_OPTIONS = ["current", "next", "two_ahead"] as const;
type MonthOption = (typeof MONTH_OPTIONS)[number];

const MONTH_OFFSETS: Record<MonthOption, number> = {
  current: 0,
  next: 1,
  two_ahead: 2,
};

const MONTH_TOGGLE_LABELS: Record<MonthOption, string> = {
  current: "חודש נוכחי",
  next: "חודש עוקב",
  two_ahead: "בעוד חודשיים",
};

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const selectedMonth: MonthOption = (MONTH_OPTIONS as readonly string[]).includes(
    month ?? ""
  )
    ? (month as MonthOption)
    : "next";

  const supabase = await createClient();

  const now = new Date();
  const targetDate = new Date(
    now.getFullYear(),
    now.getMonth() + MONTH_OFFSETS[selectedMonth],
    1
  );

  const monthStart = toDateOnlyString(startOfMonth(targetDate));
  const monthEnd = toDateOnlyString(endOfMonth(targetDate));

  const targetMonthValue = monthStart.slice(0, 7);
  const year = now.getFullYear();

  const [
    { data },
    { data: sourcesData },
    receipts,
    targetMonthReceipts,
    expenses,
  ] = await Promise.all([
    supabase
      .from("work_logs")
      .select("gross_amount, income_sources(category)")
      .gte("expected_payment_date", monthStart)
      .lte("expected_payment_date", monthEnd),
    supabase
      .from("income_sources")
      .select(
        "id, name, category, payment_mode, payment_offset_days, default_hourly_rate, tax_pension_rate, is_active"
      )
      .eq("category", "freelance")
      .eq("is_active", true),
    getReceiptsForYear(year),
    getReceiptsForPaymentMonth(targetMonthValue),
    getExpensesForYear(year),
  ]);

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

  const actualIncome = targetMonthReceipts.reduce(
    (sum, receipt) => sum + (Number(receipt.amount) || 0),
    0
  );

  const freelanceSources = (sourcesData ?? []) as IncomeSource[];

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + (Number(exp.amount) || 0),
    0
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          מיסים וסוציאליות
        </h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AddReceiptButton initialDate={toDateOnlyString(now)} sources={freelanceSources} />
          <AddExpenseButton initialDate={toDateOnlyString(now)} />
          <MonthToggle
            selected={selectedMonth}
            options={MONTH_OPTIONS.map((option) => ({
              value: option,
              label: MONTH_TOGGLE_LABELS[option],
              sublabel: monthLabel(
                new Date(now.getFullYear(), now.getMonth() + MONTH_OFFSETS[option], 1)
              ),
              href: `/taxes?month=${option}`,
            }))}
          />
        </div>
      </div>

      <IncomeSummaryWidget />

      <TaxCalculatorCards breakdown={breakdown} actualIncome={actualIncome} />

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          קבלות ({year})
        </h2>
        <ul className="flex flex-col gap-2">
          {receipts.map((receipt) => (
              <ReceiptRow
                key={receipt.id}
                receipt={receipt}
                sources={freelanceSources}
              />
            ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          הוצאות מוכרות ({year})
        </h2>
        <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900/40 dark:bg-orange-950/30">
          <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
            סה״כ הוצאות מוכרות השנה
          </span>
          <span className="text-xl font-bold text-orange-700 dark:text-orange-300">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10"
              >
                <span className="text-zinc-500 dark:text-zinc-400">
                  {expense.expense_date}
                </span>
                <span className="flex-1 text-zinc-900 dark:text-zinc-50">
                  {expense.supplier_name}
                </span>
                <span className="text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(Number(expense.amount))}
                </span>
                {expense.file_url && (
                  <a
                    href={expense.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    קובץ
                  </a>
                )}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
