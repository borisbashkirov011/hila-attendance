import { createClient } from "@/lib/supabase/server";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import { calculateTaxBreakdown } from "@/lib/utils/tax-calculations";
import TaxCalculatorCards from "@/components/TaxCalculatorCards";
import MonthToggle from "@/components/MonthToggle";
import AddReceiptButton from "@/components/AddReceiptButton";
import AddExpenseButton from "@/components/AddExpenseButton";
import ReceiptRow from "@/components/ReceiptRow";
import IncomeSummaryWidget from "@/components/IncomeSummaryWidget";
import { getReceipts } from "@/app/actions/receiptActions";
import { getExpenses } from "@/app/actions/expenseActions";

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

  const receipts = await getReceipts(now.getFullYear());

  const targetMonthValue = toDateOnlyString(targetDate).slice(0, 7);
  const receiptsForTargetMonth =
    targetDate.getFullYear() === now.getFullYear()
      ? receipts
      : await getReceipts(targetDate.getFullYear());

  const actualIncome = receiptsForTargetMonth
    .filter((receipt) => receipt.expected_payment_month === targetMonthValue)
    .reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0);

  const { data: sourcesData } = await supabase
    .from("income_sources")
    .select("id, name, category, payment_mode, payment_offset_days, default_hourly_rate, tax_pension_rate, is_active")
    .eq("category", "freelance")
    .eq("is_active", true);

  const freelanceSources = sourcesData ?? [];

  const expenses = await getExpenses();
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
          קבלות ({now.getFullYear()})
        </h2>
        <ul className="flex flex-col gap-2">
          {Array.isArray(receipts) &&
            receipts.map((receipt) => (
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
          הוצאות מוכרות
        </h2>
        <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-900/40 dark:bg-orange-950/30">
          <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
            סה״כ הוצאות מוכרות השנה
          </span>
          <span className="text-xl font-bold text-orange-700 dark:text-orange-300">
            ₪{totalExpenses.toLocaleString()}
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {Array.isArray(expenses) &&
            expenses.map((expense) => (
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
                  ₪{Number(expense.amount).toLocaleString()}
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
