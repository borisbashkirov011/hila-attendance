"use client";

import { useState } from "react";
import { PAYMENT_TIMING_OPTIONS, type PaymentTiming } from "@/lib/utils/payment-terms";

export type IncomeSourceFormDefaults = {
  name?: string;
  category?: "employee" | "freelance";
  defaultHourlyRate?: number | null;
  paymentTiming?: PaymentTiming;
  paymentDay?: number | null;
};

export default function IncomeSourceFormFields({
  defaults,
  idPrefix = "",
}: {
  defaults?: IncomeSourceFormDefaults;
  idPrefix?: string;
}) {
  const [timing, setTiming] = useState<PaymentTiming>(
    defaults?.paymentTiming ?? "immediate"
  );
  const isImmediate = timing === "immediate";

  return (
    <>
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}name`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          שם מקור ההכנסה
        </label>
        <input
          id={`${idPrefix}name`}
          name="name"
          type="text"
          required
          defaultValue={defaults?.name}
          placeholder="לדוגמה: קליניקה פרטית"
          className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}category`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          סוג העסקה
        </label>
        <select
          id={`${idPrefix}category`}
          name="category"
          required
          defaultValue={defaults?.category ?? ""}
          className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
        >
          <option value="" disabled>
            בחרו סוג העסקה
          </option>
          <option value="employee">שכירה</option>
          <option value="freelance">עצמאית</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`${idPrefix}default_hourly_rate`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          תעריף ברירת מחדל לשעה / פגישה
        </label>
        <input
          id={`${idPrefix}default_hourly_rate`}
          name="default_hourly_rate"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults?.defaultHourlyRate ?? ""}
          placeholder="₪"
          className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${idPrefix}payment_timing`}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            מועד תשלום
          </label>
          <select
            id={`${idPrefix}payment_timing`}
            name="payment_timing"
            required
            value={timing}
            onChange={(event) => setTiming(event.target.value as PaymentTiming)}
            className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base dark:border-white/20"
          >
            {PAYMENT_TIMING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`${idPrefix}payment_day`}
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            יום בחודש
          </label>
          <input
            id={`${idPrefix}payment_day`}
            name="payment_day"
            type="number"
            min="1"
            max="31"
            required={!isImmediate}
            disabled={isImmediate}
            defaultValue={defaults?.paymentDay ?? ""}
            className="h-11 rounded-md border border-black/10 bg-transparent px-3 text-base disabled:opacity-50 dark:border-white/20"
          />
        </div>
      </div>
    </>
  );
}
