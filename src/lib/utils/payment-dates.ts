export type PaymentMode = "immediate" | "specific_day" | "eom_plus_days";

export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateExpectedPaymentDate(
  workDate: Date,
  paymentMode: PaymentMode,
  offsetDays: number | null
): Date {
  switch (paymentMode) {
    case "immediate":
      return new Date(workDate);

    case "specific_day":
      return new Date(
        workDate.getFullYear(),
        workDate.getMonth() + 1,
        offsetDays ?? 1
      );

    case "eom_plus_days":
      return new Date(
        workDate.getFullYear(),
        workDate.getMonth() + 2,
        offsetDays ?? 1
      );
  }
}
