import { createClient } from "@/lib/supabase/server";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import { calculateTaxBreakdown } from "@/lib/utils/tax-calculations";
import TaxCalculatorCards from "@/components/TaxCalculatorCards";
import MonthToggle from "@/components/MonthToggle";

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
  const selectedMonth: MonthOption = MONTH_OPTIONS.includes(month as MonthOption)
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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          מיסים וסוציאליות
        </h1>

        <MonthToggle
          selected={selectedMonth}
          hrefFor={(value) => `/taxes?month=${value}`}
          options={MONTH_OPTIONS.map((option) => ({
            value: option,
            label: MONTH_TOGGLE_LABELS[option],
            sublabel: monthLabel(
              new Date(now.getFullYear(), now.getMonth() + MONTH_OFFSETS[option], 1)
            ),
          }))}
        />
      </div>

      <TaxCalculatorCards breakdown={breakdown} />
    </div>
  );
}
