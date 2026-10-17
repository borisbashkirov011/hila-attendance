import { getReceiptsForYear } from "@/lib/data/receipts";
import TaxProgressBar from "@/components/TaxProgressBar";

export default async function IncomeSummaryWidget() {
  const receipts = await getReceiptsForYear(new Date().getFullYear());

  const actualIncome = receipts.reduce(
    (sum, receipt) => sum + (Number(receipt.amount) || 0),
    0
  );

  return <TaxProgressBar currentTotal={actualIncome} />;
}
