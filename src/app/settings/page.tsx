import { createClient } from "@/lib/supabase/server";
import IncomeSourceManager from "@/components/IncomeSourceManager";
import CalendarSyncButton from "@/components/CalendarSyncButton";
import type { IncomeSource } from "@/lib/types/income-source";
import { computeAuthToken } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data }, feedToken] = await Promise.all([
    supabase
      .from("income_sources")
      .select(
        "id, name, category, payment_mode, payment_offset_days, default_hourly_rate, tax_pension_rate, is_active"
      )
      .order("name"),
    computeAuthToken(),
  ]);

  const incomeSources = (data ?? []) as IncomeSource[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        הגדרות
      </h1>

      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <IncomeSourceManager incomeSources={incomeSources} />
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
