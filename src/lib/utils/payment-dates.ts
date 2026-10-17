import type { PaymentMode } from "@/lib/types/income-source";

export type { PaymentMode };

export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Builds a date on `day` of the given month, clamped to the month's last day
// (e.g. day 31 in February → Feb 28/29 instead of rolling into March).
function dateInMonth(year: number, monthIndex: number, day: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

// Shifts a 'YYYY-MM-DD' date by `months`, keeping the day (clamped to month length).
export function addMonthsClamped(dateString: string, months: number): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return dateInMonth(year, month - 1 + months, day);
}

export function calculateExpectedPaymentDate(
  workDate: Date,
  paymentMode: PaymentMode,
  offsetDays: number | null
): Date {
  switch (paymentMode) {
    case "immediate":
    case "manual":
      return new Date(workDate);

    case "specific_day":
      return dateInMonth(
        workDate.getFullYear(),
        workDate.getMonth() + 1,
        offsetDays ?? 1
      );

    case "eom_plus_days":
      return dateInMonth(
        workDate.getFullYear(),
        workDate.getMonth() + 2,
        offsetDays ?? 1
      );
  }
}
