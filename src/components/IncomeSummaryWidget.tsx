import { getReceipts } from "@/app/actions/receiptActions";
import TaxProgressBar from "@/components/TaxProgressBar";

export default async function IncomeSummaryWidget() {
  const now = new Date();

  const receipts = await getReceipts(now.getFullYear());

  const actualIncome = receipts.reduce(
    (sum, receipt) => sum + (Number(receipt.amount) || 0),
    0
  );

  return <TaxProgressBar currentTotal={actualIncome} />;
}
