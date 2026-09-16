import { createClient } from "@/lib/supabase/server";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import FinancialSummaryCards from "@/components/FinancialSummaryCards";
import UpcomingShifts from "@/components/UpcomingShifts";
import QuickAddModal from "@/components/QuickAddModal";
import IncomeSummaryWidget from "@/components/IncomeSummaryWidget";
import type { WorkLog } from "@/lib/types/work-log";

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

type MonthTotalsRow = {
  gross_amount: number;
  net_amount: number;
  tax_pension_amount: number;
  hours_worked: number | null;
  income_sources: { category: string } | null;
};

function sumMonthTotals(rows: MonthTotalsRow[]) {
  const totals = rows.reduce(
    (acc, row) => {
      const gross = Number(row.gross_amount);
      const isEmployee = row.income_sources?.category === "employee";
      return {
        gross: acc.gross + gross,
        net: acc.net + Number(row.net_amount),
        taxPension: acc.taxPension + Number(row.tax_pension_amount),
        hours: acc.hours + Number(row.hours_worked ?? 0),
        employeeGross: acc.employeeGross + (isEmployee ? gross : 0),
        freelanceGross: acc.freelanceGross + (isEmployee ? 0 : gross),
      };
    },
    {
      gross: 0,
      net: 0,
      taxPension: 0,
      hours: 0,
      employeeGross: 0,
      freelanceGross: 0,
    }
  );

  const employeePct =
    totals.gross > 0 ? Math.round((totals.employeeGross / totals.gross) * 100) : 0;

  return {
    gross: totals.gross,
    net: totals.net,
    taxPension: totals.taxPension,
    hours: totals.hours,
    avgHourlyRate: totals.hours > 0 ? totals.gross / totals.hours : 0,
    employeePct,
    freelancePct: totals.gross > 0 ? 100 - employeePct : 0,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const today = toDateOnlyString(now);

  const currentMonthStart = toDateOnlyString(startOfMonth(now));
  const currentMonthEnd = toDateOnlyString(endOfMonth(now));

  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthStart = toDateOnlyString(startOfMonth(nextMonthDate));
  const nextMonthEnd = toDateOnlyString(endOfMonth(nextMonthDate));

  const [sourcesResult, currentMonthResult, nextMonthResult, upcomingResult] =
    await Promise.all([
      supabase
        .from("income_sources")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("work_logs")
        .select(
          "gross_amount, net_amount, tax_pension_amount, hours_worked, income_sources(category)"
        )
        .gte("expected_payment_date", currentMonthStart)
        .lte("expected_payment_date", currentMonthEnd),
      supabase
        .from("work_logs")
        .select(
          "gross_amount, net_amount, tax_pension_amount, hours_worked, income_sources(category)"
        )
        .gte("expected_payment_date", nextMonthStart)
        .lte("expected_payment_date", nextMonthEnd),
      supabase
        .from("work_logs")
        .select(
          "id, source_id, work_date, hours_worked, gross_amount, net_amount, status, income_sources(name)"
        )
        .gte("work_date", today)
        .order("work_date", { ascending: true })
        .limit(5),
    ]);

  const incomeSources = sourcesResult.data ?? [];
  const upcomingLogs = (upcomingResult.data ?? []) as unknown as WorkLog[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-8 sm:py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          היי הילה ✨
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-400">
          דשבורד ותזרים
        </p>
      </div>

      <IncomeSummaryWidget />

      <FinancialSummaryCards
        current={{
          label: monthLabel(now),
          ...sumMonthTotals(
            (currentMonthResult.data ?? []) as unknown as MonthTotalsRow[]
          ),
        }}
        next={{
          label: monthLabel(nextMonthDate),
          ...sumMonthTotals(
            (nextMonthResult.data ?? []) as unknown as MonthTotalsRow[]
          ),
        }}
      />

      <UpcomingShifts logs={upcomingLogs} />

      <QuickAddModal incomeSources={incomeSources} />
    </div>
  );
}
