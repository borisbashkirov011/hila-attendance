import { createClient } from "@/lib/supabase/server";
import { getMonthRange } from "@/lib/utils/calendar";
import CalendarClient from "@/components/CalendarClient";
import MonthNavLink from "@/components/MonthNavLink";
import type { WorkLog } from "@/lib/types/work-log";
import type { PaymentMode } from "@/lib/types/income-source";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;

  const { start, end } = getMonthRange(year, month);

  const supabase = await createClient();
  const monthKey = start.slice(0, 7);
  const [sourcesResult, logsResult, quotasResult] = await Promise.all([
    supabase
      .from("income_sources")
      .select("id, name, payment_mode, standard_hours")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("work_logs")
      .select(
        "id, source_id, work_date, description, hours_worked, gross_amount, net_amount, expected_payment_date, status, income_sources(name)"
      )
      .gte("work_date", start)
      .lte("work_date", end)
      .order("work_date"),
    supabase
      .from("source_hour_quotas")
      .select("source_id, hours")
      .eq("month", monthKey),
  ]);

  const sourceRows = (sourcesResult.data ?? []) as {
    id: string;
    name: string;
    payment_mode: PaymentMode;
    standard_hours: number | null;
  }[];
  const incomeSources = sourceRows.map(({ id, name, payment_mode }) => ({
    id,
    name,
    payment_mode,
  }));
  const logs = (logsResult.data ?? []) as unknown as WorkLog[];

  const overrideBySource = new Map(
    (quotasResult.data ?? []).map((q) => [q.source_id as string, Number(q.hours)])
  );
  const quotaSummaries = sourceRows
    .map((source) => {
      const quota =
        overrideBySource.get(source.id) ??
        (source.standard_hours === null ? null : Number(source.standard_hours));
      if (quota === null) return null;
      const hours = logs
        .filter((log) => log.source_id === source.id)
        .reduce((sum, log) => sum + Number(log.hours_worked ?? 0), 0);
      return { id: source.id, name: source.name, quota, hours };
    })
    .filter((summary) => summary !== null);

  const prevMonthDate = new Date(year, month - 2, 1);
  const nextMonthDate = new Date(year, month, 1);
  const monthLabel = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        קביעת משמרות
      </h1>

      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <MonthNavLink
            href={`/schedule?year=${prevMonthDate.getFullYear()}&month=${prevMonthDate.getMonth() + 1}`}
            className="flex h-11 items-center rounded-md px-4 text-sm font-medium text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            החודש הקודם
          </MonthNavLink>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {monthLabel}
          </h2>
          <MonthNavLink
            href={`/schedule?year=${nextMonthDate.getFullYear()}&month=${nextMonthDate.getMonth() + 1}`}
            className="flex h-11 items-center rounded-md px-4 text-sm font-medium text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            החודש הבא
          </MonthNavLink>
        </div>

        {quotaSummaries.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {quotaSummaries.map((summary) => (
              <span
                key={summary.id}
                className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700"
              >
                {summary.name} · {summary.hours}/{summary.quota} שעות תקן
                {summary.hours > summary.quota &&
                  ` · +${summary.hours - summary.quota} מעבר לתקן`}
              </span>
            ))}
          </div>
        )}

        <CalendarClient
          year={year}
          month={month}
          logs={logs}
          incomeSources={incomeSources}
        />
      </div>
    </div>
  );
}
