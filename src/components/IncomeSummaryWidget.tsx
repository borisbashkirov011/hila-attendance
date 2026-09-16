import { createClient } from "@/lib/supabase/server";
import { toDateOnlyString } from "@/lib/utils/payment-dates";
import { getReceipts } from "@/app/actions/receiptActions";
import IncomeSummaryCards from "@/components/IncomeSummaryCards";
import TaxProgressBar from "@/components/TaxProgressBar";

type MonthLogRow = {
  gross_amount: number;
  income_sources: { category: "employee" | "freelance" } | null;
};

export default async function IncomeSummaryWidget() {
  const supabase = await createClient();
  const now = new Date();

  const yearStart = toDateOnlyString(new Date(now.getFullYear(), 0, 1));
  const yearEnd = toDateOnlyString(new Date(now.getFullYear(), 11, 31));

  const [receipts, expectedIncomeResult] = await Promise.all([
    getReceipts(now.getFullYear()),
    supabase
      .from("work_logs")
      .select("gross_amount, income_sources(category)")
      .gte("work_date", yearStart)
      .lte("work_date", yearEnd),
  ]);

  const expectedIncomeRows = (expectedIncomeResult.data ??
    []) as unknown as MonthLogRow[];

  const expectedIncome = expectedIncomeRows.reduce((sum, row) => {
    if (row.income_sources?.category !== "freelance") return sum;
    return sum + Number(row.gross_amount);
  }, 0);

  const actualIncome = receipts.reduce(
    (sum, receipt) => sum + (Number(receipt.amount) || 0),
    0
  );

  return (
    <div className="flex flex-col gap-3">
      <IncomeSummaryCards expectedIncome={expectedIncome} actualIncome={actualIncome} />
      <TaxProgressBar currentTotal={actualIncome} />
    </div>
  );
}
