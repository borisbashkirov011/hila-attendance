import type { PaymentMode } from "@/lib/types/income-source";

export type PaymentTiming = "immediate" | "next_month" | "two_months";

export const PAYMENT_TIMING_OPTIONS: { value: PaymentTiming; label: string }[] = [
  { value: "immediate", label: "מיידי" },
  { value: "next_month", label: "בחודש העוקב" },
  { value: "two_months", label: "בעוד חודשיים" },
];

export function paymentTimingFor(
  paymentMode: PaymentMode,
  offsetDays: number | null
): { timing: PaymentTiming; day: number | null } {
  if (paymentMode === "specific_day") {
    return { timing: "next_month", day: offsetDays };
  }
  if (paymentMode === "eom_plus_days") {
    return { timing: "two_months", day: offsetDays };
  }
  return { timing: "immediate", day: null };
}

export function paymentTimingLabel(
  paymentMode: PaymentMode,
  offsetDays: number | null
): string {
  const { timing, day } = paymentTimingFor(paymentMode, offsetDays);
  const label =
    PAYMENT_TIMING_OPTIONS.find((option) => option.value === timing)?.label ??
    timing;
  return timing === "immediate" ? label : `${label} (יום ${day ?? "?"})`;
}
