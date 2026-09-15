"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateExpectedPaymentDate,
  toDateOnlyString,
} from "@/lib/utils/payment-dates";

export type LogWorkSessionInput = {
  sourceId: string;
  workDate: string; // 'YYYY-MM-DD'
  hoursWorked?: number;
  grossAmount?: number; // overrides hoursWorked * default_hourly_rate
};

function revalidateWorkLogPaths() {
  revalidatePath("/");
  revalidatePath("/schedule");
}

async function computeWorkLogFields(
  supabase: SupabaseClient,
  input: LogWorkSessionInput
) {
  const { data: source, error: sourceError } = await supabase
    .from("income_sources")
    .select(
      "id, category, payment_mode, payment_offset_days, default_hourly_rate, tax_pension_rate"
    )
    .eq("id", input.sourceId)
    .single();

  if (sourceError || !source) {
    throw new Error(`מקור ההכנסה לא נמצא: ${sourceError?.message ?? "not found"}`);
  }

  let grossAmount = input.grossAmount;
  if (grossAmount === undefined) {
    if (input.hoursWorked === undefined || source.default_hourly_rate === null) {
      throw new Error(
        "יש להזין סכום ברוטו, או שעות עבודה עם תעריף שעתי מוגדר למקור ההכנסה."
      );
    }
    grossAmount = input.hoursWorked * source.default_hourly_rate;
  }

  const taxPensionAmount =
    source.category === "freelance"
      ? grossAmount * source.tax_pension_rate
      : 0;
  const netAmount = grossAmount - taxPensionAmount;

  const [year, month, day] = input.workDate.split("-").map(Number);
  const workDate = new Date(year, month - 1, day);
  const expectedPaymentDate = calculateExpectedPaymentDate(
    workDate,
    source.payment_mode,
    source.payment_offset_days
  );

  return {
    source_id: input.sourceId,
    work_date: input.workDate,
    hours_worked: input.hoursWorked ?? null,
    gross_amount: grossAmount,
    tax_pension_amount: taxPensionAmount,
    net_amount: netAmount,
    expected_payment_date: toDateOnlyString(expectedPaymentDate),
  };
}

export async function logWorkSession(input: LogWorkSessionInput) {
  const supabase = await createClient();
  const fields = await computeWorkLogFields(supabase, input);

  const { data, error } = await supabase
    .from("work_logs")
    .insert(fields)
    .select()
    .single();

  if (error) {
    throw new Error(`שמירת המשמרת נכשלה: ${error.message}`);
  }

  return data;
}

export async function updateWorkLog(id: string, input: LogWorkSessionInput) {
  const supabase = await createClient();
  const fields = await computeWorkLogFields(supabase, input);

  const { data, error } = await supabase
    .from("work_logs")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`עדכון המשמרת נכשל: ${error.message}`);
  }

  return data;
}

export type WorkLogFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function parseWorkLogFormData(
  formData: FormData
): { data: LogWorkSessionInput } | { error: string } {
  const sourceId = formData.get("source_id");
  const workDate = formData.get("work_date");
  const hoursWorkedRaw = formData.get("hours_worked");
  const grossAmountRaw = formData.get("gross_amount");

  if (typeof sourceId !== "string" || !sourceId) {
    return { error: "יש לבחור מקור הכנסה." };
  }
  if (typeof workDate !== "string" || !workDate) {
    return { error: "יש לבחור תאריך." };
  }

  const grossAmount =
    typeof grossAmountRaw === "string" && grossAmountRaw !== ""
      ? Number(grossAmountRaw)
      : undefined;
  if (grossAmount !== undefined && (!Number.isFinite(grossAmount) || grossAmount <= 0)) {
    return { error: "יש להזין סכום ברוטו תקין." };
  }

  const hoursWorked =
    typeof hoursWorkedRaw === "string" && hoursWorkedRaw !== ""
      ? Number(hoursWorkedRaw)
      : undefined;
  if (hoursWorked !== undefined && (!Number.isFinite(hoursWorked) || hoursWorked <= 0)) {
    return { error: "יש להזין מספר שעות תקין." };
  }

  if (grossAmount === undefined && hoursWorked === undefined) {
    return { error: "יש להזין שעות עבודה או סכום ברוטו." };
  }

  return { data: { sourceId, workDate, hoursWorked, grossAmount } };
}

export async function logWorkSessionAction(
  _prevState: WorkLogFormState,
  formData: FormData
): Promise<WorkLogFormState> {
  const parsed = parseWorkLogFormData(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }

  try {
    await logWorkSession(parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "שמירת המשמרת נכשלה.",
    };
  }

  revalidateWorkLogPaths();
  return { status: "success", message: "המשמרת נשמרה בהצלחה." };
}

export async function updateWorkLogAction(
  _prevState: WorkLogFormState,
  formData: FormData
): Promise<WorkLogFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { status: "error", message: "רשומה לא תקינה." };
  }

  const parsed = parseWorkLogFormData(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }

  try {
    await updateWorkLog(id, parsed.data);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "עדכון המשמרת נכשל.",
    };
  }

  revalidateWorkLogPaths();
  return { status: "success", message: "המשמרת עודכנה בהצלחה." };
}

export async function deleteWorkLogAction(id: string): Promise<WorkLogFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("work_logs").delete().eq("id", id);

  if (error) {
    return { status: "error", message: `מחיקת המשמרת נכשלה: ${error.message}` };
  }

  revalidateWorkLogPaths();
  return { status: "success", message: "המשמרת נמחקה." };
}
