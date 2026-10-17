"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type HourQuotaFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function revalidateQuotaPaths() {
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/taxes");
}

export async function upsertHourQuotaAction(
  _prevState: HourQuotaFormState,
  formData: FormData
): Promise<HourQuotaFormState> {
  const sourceId = formData.get("source_id");
  const month = formData.get("month");
  const hoursRaw = formData.get("hours");

  if (typeof sourceId !== "string" || !sourceId) {
    return { status: "error", message: "מקור הכנסה לא תקין." };
  }
  if (typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
    return { status: "error", message: "יש לבחור חודש." };
  }
  const hours = typeof hoursRaw === "string" && hoursRaw !== "" ? Number(hoursRaw) : NaN;
  if (!Number.isFinite(hours) || hours < 0) {
    return { status: "error", message: "יש להזין מספר שעות תקין." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("source_hour_quotas")
    .upsert({ source_id: sourceId, month, hours }, { onConflict: "source_id,month" });

  if (error) {
    return { status: "error", message: `שמירת התקן נכשלה: ${error.message}` };
  }

  revalidateQuotaPaths();
  return { status: "success", message: "התקן החודשי נשמר." };
}

export async function deleteHourQuotaAction(id: string): Promise<HourQuotaFormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("source_hour_quotas").delete().eq("id", id);

  if (error) {
    return { status: "error", message: `מחיקת התקן נכשלה: ${error.message}` };
  }

  revalidateQuotaPaths();
  return { status: "success", message: "התקן החודשי נמחק." };
}
