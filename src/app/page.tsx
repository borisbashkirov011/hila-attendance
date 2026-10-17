import { createClient } from "@/lib/supabase/server";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import FinancialSummaryCards from "@/components/FinancialSummaryCards";
import UpcomingShifts from "@/components/UpcomingShifts";
import DashboardQuickActions from "@/components/DashboardQuickActions";
import IncomeSummaryWidget from "@/components/IncomeSummaryWidget";
import type { WorkLog } from "@/lib/types/work-log";
import { INCOME_SOURCE_COLUMNS, type IncomeSource } from "@/lib/types/income-source";
import { getPaymentEntries } from "@/lib/data/payment-schedule";
import type { PaymentEntry } from "@/lib/utils/payment-schedule";

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

function sumMonthTotals(entries: PaymentEntry[]) {
  const totals = entries.reduce(
    (acc, entry) => {
      const gross = entry.gross;
      const isEmployee = entry.category === "employee";
      return {
        gross: acc.gross + gross,
        net: acc.net + entry.net,
        taxPension: acc.taxPension + entry.taxPension,
        hours: acc.hours + entry.hours,
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

  const [sourcesResult, paymentEntries, upcomingResult] =
    await Promise.all([
      supabase
        .from("income_sources")
        .select(INCOME_SOURCE_COLUMNS)
        .eq("is_active", true)
        .order("name"),
      getPaymentEntries(currentMonthStart, nextMonthEnd),
      supabase
        .from("work_logs")
        .select(
          "id, source_id, work_date, description, hours_worked, gross_amount, net_amount, expected_payment_date, status, income_sources(name)"
        )
        .gte("work_date", today)
        .order("work_date", { ascending: true })
        .limit(5),
    ]);

  const activeSources = (sourcesResult.data ?? []) as IncomeSource[];
  const incomeSources = activeSources.map(({ id, name, payment_mode }) => ({
    id,
    name,
    payment_mode,
  }));
  const freelanceSources = activeSources.filter(
    (source) => source.category === "freelance"
  );
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
            paymentEntries.filter((e) => e.paymentDate <= currentMonthEnd)
          ),
        }}
        next={{
          label: monthLabel(nextMonthDate),
          ...sumMonthTotals(
            paymentEntries.filter((e) => e.paymentDate >= nextMonthStart)
          ),
        }}
      />

      <UpcomingShifts logs={upcomingLogs} />

      <DashboardQuickActions
        incomeSources={incomeSources}
        freelanceSources={freelanceSources}
      />
    </div>
  );
}
