import { createClient } from "@/lib/supabase/server";
import IncomeSourceManager from "@/components/IncomeSourceManager";
import CalendarSyncButton from "@/components/CalendarSyncButton";
import {
  INCOME_SOURCE_COLUMNS,
  type HourQuotaOverride,
  type IncomeSource,
} from "@/lib/types/income-source";
import { computeAuthToken } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data }, { data: quotasData }, feedToken] = await Promise.all([
    supabase
      .from("income_sources")
      .select(INCOME_SOURCE_COLUMNS)
      .order("name"),
    supabase
      .from("source_hour_quotas")
      .select("id, source_id, month, hours")
      .order("month"),
    computeAuthToken(),
  ]);

  const incomeSources = (data ?? []) as IncomeSource[];
  const quotaOverrides = (quotasData ?? []) as HourQuotaOverride[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        הגדרות
      </h1>

      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <IncomeSourceManager
          incomeSources={incomeSources}
          quotaOverrides={quotaOverrides}
        />
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-rose-100/80 via-orange-50/60 to-rose-50/80 p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold tracking-tight text-slate-800">
          סנכרון יומן
        </p>
        <CalendarSyncButton feedPath={`/api/calendar/feed?token=${feedToken}`} />
        <p className="mt-3 text-xs font-medium text-slate-500">
          לחיצה חד-פעמית לסנכרון אוטומטי של כל המשמרות ישירות לאפליקציית
          היומן באייפון.
        </p>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex h-11 items-center justify-center rounded-md border border-black/10 px-4 text-sm font-medium text-zinc-700 dark:border-white/20 dark:text-zinc-300"
        >
          התנתקות
        </button>
      </form>
    </div>
  );
}
