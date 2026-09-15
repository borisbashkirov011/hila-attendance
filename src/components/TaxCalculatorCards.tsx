import { formatCurrency } from "@/lib/utils/format";
import type { TaxBreakdown } from "@/lib/utils/tax-calculations";

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={
          highlight
            ? "text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            : "text-sm font-medium text-zinc-700 dark:text-zinc-300"
        }
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export default function TaxCalculatorCards({
  breakdown,
}: {
  breakdown: TaxBreakdown;
}) {
  const { employee, freelance } = breakdown;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/30">
        <p className="mb-3 text-sm font-semibold text-blue-900 dark:text-blue-200">
          שכירה (תלוש)
        </p>
        <div className="flex flex-col gap-2">
          <Row label="ברוטו" value={employee.gross} highlight />
          <Row label="פנסיה (7%)" value={employee.pension} />
          <Row label="קרן השתלמות (2.5%)" value={employee.kerenHishtalmut} />
          <Row label="ביטוח לאומי (3.5%)" value={employee.bituahLeumi} />
          <hr className="my-1 border-blue-200 dark:border-blue-900/40" />
          <Row label="סה״כ ניכויים" value={employee.totalDeductions} />
          <Row label="נטו לתשלום" value={employee.net} highlight />
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="mb-3 text-sm font-semibold text-amber-900 dark:text-amber-200">
          עצמאית (הפרשות)
        </p>
        <div className="flex flex-col gap-2">
          <Row label="ברוטו" value={freelance.gross} highlight />
          <Row label="להעביר לפנסיה (10%)" value={freelance.pensionTarget} />
          <Row
            label="להעביר לקרן השתלמות (4.5%)"
            value={freelance.kerenHishtalmut}
          />
          <Row label="להעביר לביטוח לאומי (10%)" value={freelance.bituahLeumi} />
          <Row
            label="לשמור למס הכנסה (5.5%)"
            value={freelance.incomeTaxBuffer}
          />
          <hr className="my-1 border-amber-200 dark:border-amber-900/40" />
          <Row label="סה״כ להפריש" value={freelance.totalAllocations} />
          <Row label="נותר בפועל" value={freelance.remainingNet} highlight />
        </div>
      </div>
    </div>
  );
}
