import { toDateOnlyString } from "@/lib/utils/payment-dates";

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: toDateOnlyString(start), end: toDateOnlyString(end) };
}

// Returns one cell per grid slot for a standard 7-column month view;
// null marks the leading/trailing slots outside the month.
export function getMonthGridDates(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateOnlyString(new Date(year, month - 1, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}
