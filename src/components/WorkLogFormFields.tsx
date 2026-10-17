"use client";

import { useState } from "react";
import type { IncomeSourceOption } from "@/lib/types/income-source";

export type WorkLogFormDefaults = {
  sourceId?: string;
  workDate?: string;
  hoursWorked?: number | null;
  grossAmount?: number | null;
  paymentDate?: string | null;
  description?: string | null;
};

const inputClassName =
  "h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20";
const labelClassName = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function WorkLogFormFields({
  incomeSources,
  defaults,
  idPrefix = "",
}: {
  incomeSources: IncomeSourceOption[];
  defaults?: WorkLogFormDefaults;
  idPrefix?: string;
}) {
  const [sourceId, setSourceId] = useState(defaults?.sourceId ?? "");
  const isManual =
    incomeSources.find((source) => source.id === sourceId)?.payment_mode === "manual";

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}source_id`} className={labelClassName}>
          מקור הכנסה
        </label>
        <select
          id={`${idPrefix}source_id`}
          name="source_id"
          required
          value={sourceId}
          onChange={(event) => setSourceId(event.target.value)}
          className={inputClassName}
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
        <label htmlFor={`${idPrefix}work_date`} className={labelClassName}>
          תאריך
        </label>
        <input
          id={`${idPrefix}work_date`}
          name="work_date"
          type="date"
          required
          defaultValue={defaults?.workDate}
          className={inputClassName}
        />
      </div>

      {isManual && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}payment_date`} className={labelClassName}>
              תאריך תשלום
            </label>
            <input
              id={`${idPrefix}payment_date`}
              name="payment_date"
              type="date"
              required
              defaultValue={defaults?.paymentDate ?? undefined}
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${idPrefix}description`} className={labelClassName}>
              תיאור
            </label>
            <input
              id={`${idPrefix}description`}
              name="description"
              type="text"
              placeholder="לדוגמה: UGC בריטה"
              defaultValue={defaults?.description ?? undefined}
              className={inputClassName}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}hours_worked`} className={labelClassName}>
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
            className={inputClassName}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${idPrefix}gross_amount`} className={labelClassName}>
            סכום ברוטו
          </label>
          <input
            id={`${idPrefix}gross_amount`}
            name="gross_amount"
            type="number"
            step="0.01"
            min="0"
            required={isManual}
            placeholder={isManual ? "₪" : "לפי תעריף שעתי"}
            defaultValue={defaults?.grossAmount ?? undefined}
            className={inputClassName}
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {isManual
          ? "עבודה חד-פעמית: יש להזין סכום ותאריך תשלום."
          : "יש להזין שעות עבודה או סכום ברוטו (או את שניהם)."}
      </p>
    </>
  );
}
