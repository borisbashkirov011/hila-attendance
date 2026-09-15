"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { IncomeSourceCategory, PaymentMode } from "@/lib/types/income-source";

export type IncomeSourceFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function revalidateIncomeSourcePaths() {
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/schedule");
}

type ParsedIncomeSourceInput = {
  name: string;
  category: IncomeSourceCategory;
  default_hourly_rate: number | null;
  payment_mode: PaymentMode;
  payment_offset_days: number | null;
};

function parseIncomeSourceFormData(
  formData: FormData
): { data: ParsedIncomeSourceInput } | { error: string } {
  const name = formData.get("name");
  const category = formData.get("category");
  const rateRaw = formData.get("default_hourly_rate");
  const timing = formData.get("payment_timing");
  const dayRaw = formData.get("payment_day");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "יש להזין שם מקור הכנסה." };
  }
  if (category !== "employee" && category !== "freelance") {
    return { error: "יש לבחור סוג העסקה תקין." };
  }
  if (timing !== "immediate" && timing !== "next_month" && timing !== "two_months") {
    return { error: "יש לבחור מועד תשלום תקין." };
  }

  let paymentMode: PaymentMode;
  let paymentOffsetDays: number;

  if (timing === "immediate") {
    paymentMode = "immediate";
    paymentOffsetDays = 0;
  } else {
    const day = typeof dayRaw === "string" && dayRaw !== "" ? Number(dayRaw) : NaN;
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return { error: "יש להזין יום בחודש תקין (1-31)." };
    }
    paymentMode = timing === "next_month" ? "specific_day" : "eom_plus_days";
    paymentOffsetDays = day;
  }

  let rate: number | null = null;
  if (typeof rateRaw === "string" && rateRaw !== "") {
    rate = Number(rateRaw);
    if (!Number.isFinite(rate) || rate < 0) {
      return { error: "יש להזין תעריף תקין." };
    }
  }

  return {
    data: {
      name: name.trim(),
      category,
      default_hourly_rate: rate,
      payment_mode: paymentMode,
      payment_offset_days: paymentOffsetDays,
    },
  };
}

export async function createIncomeSourceAction(
  _prevState: IncomeSourceFormState,
  formData: FormData
): Promise<IncomeSourceFormState> {
  const parsed = parseIncomeSourceFormData(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("income_sources").insert({
    ...parsed.data,
    tax_pension_rate: parsed.data.category === "freelance" ? 0.3 : 0,
    is_active: true,
  });

  if (error) {
    return { status: "error", message: `יצירת מקור ההכנסה נכשלה: ${error.message}` };
  }

  revalidateIncomeSourcePaths();
  return { status: "success", message: "מקור ההכנסה נוצר בהצלחה." };
}

export async function updateIncomeSourceAction(
  _prevState: IncomeSourceFormState,
  formData: FormData
): Promise<IncomeSourceFormState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { status: "error", message: "מקור הכנסה לא תקין." };
  }

  const parsed = parseIncomeSourceFormData(formData);
  if ("error" in parsed) {
    return { status: "error", message: parsed.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("income_sources")
    .update({
      ...parsed.data,
      tax_pension_rate: parsed.data.category === "freelance" ? 0.3 : 0,
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: `עדכון מקור ההכנסה נכשל: ${error.message}` };
  }

  revalidateIncomeSourcePaths();
  return { status: "success", message: "מקור ההכנסה עודכן בהצלחה." };
}

export async function deleteIncomeSourceAction(
  id: string
): Promise<IncomeSourceFormState> {
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("work_logs")
    .select("id", { count: "exact", head: true })
    .eq("source_id", id);

  if (countError) {
    return {
      status: "error",
      message: `מחיקת מקור ההכנסה נכשלה: ${countError.message}`,
    };
  }

  if (count && count > 0) {
    const { error } = await supabase
      .from("income_sources")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return { status: "error", message: `השבתת מקור ההכנסה נכשלה: ${error.message}` };
    }

    revalidateIncomeSourcePaths();
    return {
      status: "success",
      message: "למקור ההכנסה יש היסטוריית משמרות — הוא הושבת ולא נמחק.",
    };
  }

  const { error } = await supabase.from("income_sources").delete().eq("id", id);

  if (error) {
    return { status: "error", message: `מחיקת מקור ההכנסה נכשלה: ${error.message}` };
  }

  revalidateIncomeSourcePaths();
  return { status: "success", message: "מקור ההכנסה נמחק." };
}

export async function reactivateIncomeSourceAction(
  id: string
): Promise<IncomeSourceFormState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("income_sources")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    return { status: "error", message: `הפעלת מקור ההכנסה נכשלה: ${error.message}` };
  }

  revalidateIncomeSourcePaths();
  return { status: "success", message: "מקור ההכנסה הופעל מחדש." };
}
