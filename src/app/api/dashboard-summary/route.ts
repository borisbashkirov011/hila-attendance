import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getPaymentEntries } from "@/lib/data/payment-schedule";
import { getReceiptsForYear } from "@/lib/data/receipts";
import { buildQuotaLookup, type PaymentEntry, type QuotaOverride } from "@/lib/utils/payment-schedule";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import { OSEK_PATUR_LIMIT } from "@/components/TaxProgressBar";

// Read-only summary for Hila's dashboard. Requires `Authorization: Bearer <DASHBOARD_TOKEN>`.
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const expected = process.env.DASHBOARD_TOKEN;
  if (!expected) return false;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function totals(entries: PaymentEntry[]) {
  const sum = entries.reduce(
    (acc, e) => ({
      gross: acc.gross + e.gross,
      net: acc.net + e.net,
      taxPension: acc.taxPension + e.taxPension,
      hours: acc.hours + e.hours,
    }),
    { gross: 0, net: 0, taxPension: 0, hours: 0 }
  );
  return {
    gross: Math.round(sum.gross),
    net: Math.round(sum.net),
    taxPension: Math.round(sum.taxPension),
    hours: Math.round(sum.hours * 100) / 100,
  };
}

type SourceRow = { id: string; name: string; standard_hours: number | null };
type LogRow = {
  id: string;
  source_id: string;
  work_date: string;
  description: string | null;
  hours_worked: number | null;
  expected_payment_date: string;
  net_amount: number;
  status: string;
  income_sources: { name: string } | null;
};

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const today = toDateOnlyString(now);
  const month = today.slice(0, 7);
  const monthStart = `${month}-01`;
  const monthEnd = toDateOnlyString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = toDateOnlyString(nextDate).slice(0, 7);
  const nextEnd = toDateOnlyString(new Date(now.getFullYear(), now.getMonth() + 2, 0));
  const in14 = toDateOnlyString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14));
  const logColumns =
    "id, source_id, work_date, description, hours_worked, expected_payment_date, net_amount, status, income_sources(name)";

  const [entries, receipts, sourcesRes, quotasRes, monthLogsRes, upcomingRes, overdueRes] =
    await Promise.all([
      getPaymentEntries(monthStart, nextEnd),
      getReceiptsForYear(now.getFullYear()),
      supabase.from("income_sources").select("id, name, standard_hours").eq("is_active", true).order("name"),
      supabase.from("source_hour_quotas").select("source_id, month, hours").eq("month", month),
      supabase.from("work_logs").select("source_id, hours_worked").gte("work_date", monthStart).lte("work_date", monthEnd),
      supabase.from("work_logs").select(logColumns).gte("work_date", today).lte("work_date", in14).order("work_date"),
      supabase
        .from("work_logs")
        .select(logColumns)
        .eq("status", "pending")
        .lt("expected_payment_date", today)
        .order("expected_payment_date"),
    ]);

  const quotaFor = buildQuotaLookup((quotasRes.data ?? []) as QuotaOverride[]);
  const hoursBySource = new Map<string, number>();
  for (const log of monthLogsRes.data ?? []) {
    hoursBySource.set(log.source_id, (hoursBySource.get(log.source_id) ?? 0) + Number(log.hours_worked ?? 0));
  }
  const hours = ((sourcesRes.data ?? []) as SourceRow[])
    .map((s) => ({
      sourceName: s.name,
      worked: Math.round((hoursBySource.get(s.id) ?? 0) * 100) / 100,
      quota: quotaFor(s.id, month, s.standard_hours),
    }))
    .filter((h) => h.worked > 0 || h.quota !== null);

  const ytdIncome = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const shift = (log: LogRow) => ({
    date: log.work_date,
    sourceName: log.income_sources?.name ?? "",
    description: log.description,
    hours: log.hours_worked === null ? null : Number(log.hours_worked),
    expectedPaymentDate: log.expected_payment_date,
    net: Math.round(Number(log.net_amount)),
  });

  return Response.json(
    {
      generatedAt: now.toISOString(),
      month,
      current: totals(entries.filter((e) => e.paymentDate <= monthEnd)),
      next: { month: nextMonth, ...totals(entries.filter((e) => e.paymentDate > monthEnd)) },
      paymentDays: [...new Set(entries.map((e) => e.paymentDate))].sort().map((date) => ({
        date,
        net: Math.round(entries.filter((e) => e.paymentDate === date).reduce((s, e) => s + e.net, 0)),
      })),
      hours,
      osekPatur: { limit: OSEK_PATUR_LIMIT, ytdIncome: Math.round(ytdIncome) },
      upcomingShifts: ((upcomingRes.data ?? []) as unknown as LogRow[]).map(shift),
      overduePayments: ((overdueRes.data ?? []) as unknown as LogRow[]).map(shift),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
