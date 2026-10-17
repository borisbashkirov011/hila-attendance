import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { addMonthsClamped, toDateOnlyString } from "@/lib/utils/payment-dates";
import {
  buildPaymentEntries,
  type PaymentEntry,
  type QuotaOverride,
  type ScheduleLog,
} from "@/lib/utils/payment-schedule";

// Payment entries (quota-split) whose payment date falls in [start, end].
// Fetches one extra month back so overflow hours paid in the range are included.
export const getPaymentEntries = cache(
  async (start: string, end: string): Promise<PaymentEntry[]> => {
    const supabase = await createClient();
    const fetchStart = toDateOnlyString(addMonthsClamped(start, -1));

    const [logsResult, quotasResult] = await Promise.all([
      supabase
        .from("work_logs")
        .select(
          "id, source_id, work_date, hours_worked, gross_amount, net_amount, tax_pension_amount, expected_payment_date, created_at, income_sources(name, category, standard_hours)"
        )
        .gte("expected_payment_date", fetchStart)
        .lte("expected_payment_date", end),
      supabase.from("source_hour_quotas").select("source_id, month, hours"),
    ]);

    if (logsResult.error) {
      console.error("getPaymentEntries error:", logsResult.error);
      return [];
    }

    const entries = buildPaymentEntries(
      (logsResult.data ?? []) as unknown as ScheduleLog[],
      (quotasResult.data ?? []) as QuotaOverride[]
    );
    return entries.filter(
      (entry) => entry.paymentDate >= start && entry.paymentDate <= end
    );
  }
);
