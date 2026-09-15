type IncomeSourceOption = {
  id: string;
  name: string;
};

export type WorkLogFormDefaults = {
  sourceId?: string;
  workDate?: string;
  hoursWorked?: number | null;
  grossAmount?: number | null;
};

export default function WorkLogFormFields({
  incomeSources,
  defaults,
  idPrefix = "",
}: {
  incomeSources: IncomeSourceOption[];
  defaults?: WorkLogFormDefaults;
  idPrefix?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}source_id`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          מקור הכנסה
        </label>
        <select
          id={`${idPrefix}source_id`}
          name="source_id"
          required
          defaultValue={defaults?.sourceId ?? ""}
          className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
        >
          <option value="" disabled>
            בחרו מקור הכנסה
          </option>
          {incomeSources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}work_date`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          תאריך
        </label>
        <input
          id={`${idPrefix}work_date`}
          name="work_date"
          type="date"
          required
          defaultValue={defaults?.workDate}
          className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${idPrefix}hours_worked`}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            שעות עבודה
          </label>
          <input
            id={`${idPrefix}hours_worked`}
            name="hours_worked"
            type="number"
            step="0.25"
            min="0"
            placeholder="לדוגמה: 3.5"
            defaultValue={defaults?.hoursWorked ?? undefined}
            className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${idPrefix}gross_amount`}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            סכום ברוטו
          </label>
          <input
            id={`${idPrefix}gross_amount`}
            name="gross_amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="לפי תעריף שעתי"
            defaultValue={defaults?.grossAmount ?? undefined}
            className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        יש להזין שעות עבודה או סכום ברוטו (או את שניהם).
      </p>
    </>
  );
}
