import { toDateOnlyString } from "@/lib/utils/payment-dates";

export type ShiftStatus = "planned" | "completed";

const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  planned: "מתוכנן",
  completed: "בוצע",
};

export function getShiftStatus(workDate: string): ShiftStatus {
  const today = toDateOnlyString(new Date());
  return workDate > today ? "planned" : "completed";
}

export function shiftStatusLabel(status: ShiftStatus): string {
  return SHIFT_STATUS_LABELS[status];
}
