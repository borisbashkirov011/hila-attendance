"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calculateExpectedPaymentDate,
  toDateOnlyString,
} from "@/lib/utils/payment-dates";

export type ReceiptData = {
  receipt_date: string; // 'YYYY-MM-DD'
  source_id: string;
  for_month: string; // 'YYYY-MM'
  amount: number;
  file_url?: string;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function uploadReceiptFile(
  formData: FormData
): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient();
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "לא נבחר קובץ" };
    }

    const ext = file.name.split(".").pop();
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
    const filePath = safeName;

    const { error } = await supabase.storage
      .from("receipts")
      .upload(filePath, file);

    if (error) {
      console.error("uploadReceiptFile error:", error);
      return { success: false, error: `שגיאה בהעלאת הקובץ: ${error.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(filePath);

    return { success: true, data: publicUrl };
  } catch (err) {
    console.error("uploadReceiptFile exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "שגיאה לא ידועה בהעלאת הקובץ",
    };
  }
}

function validateReceiptFields(data: ReceiptUpdateData): string | null {
  if (data.receipt_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.receipt_date)) {
    return "יש לבחור תאריך תקין.";
  }
  if (data.for_month !== undefined && !/^\d{4}-\d{2}$/.test(data.for_month)) {
    return "יש לבחור חודש תקין.";
  }
  if (data.source_id !== undefined && !data.source_id) {
    return "יש לבחור לקוח.";
  }
  if (data.amount !== undefined && (!Number.isFinite(data.amount) || data.amount <= 0)) {
    return "יש להזין סכום תקין.";
  }
  return null;
}

async function removeReceiptFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fileUrl: string
) {
  const filePath = fileUrl.split("/receipts/").pop();
  if (filePath) {
    await supabase.storage.from("receipts").remove([filePath]);
  }
}

export async function addReceipt(
  data: ReceiptData
): Promise<ActionResult<null>> {
  const validationError = validateReceiptFields(data);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const supabase = await createClient();

    const { data: source, error: sourceError } = await supabase
      .from("income_sources")
      .select("name, payment_mode, payment_offset_days")
      .eq("id", data.source_id)
      .single();

    if (sourceError || !source) {
      console.error("addReceipt sourceError:", sourceError);
      return {
        success: false,
        error: `מקור ההכנסה לא נמצא: ${sourceError?.message ?? "not found"}`,
      };
    }

    const [forYear, forMonth] = data.for_month.split("-").map(Number);
    const forMonthDate = new Date(forYear, forMonth - 1, 1);
    const expectedPaymentDate = calculateExpectedPaymentDate(
      forMonthDate,
      source.payment_mode,
      source.payment_offset_days
    );
    const expectedPaymentMonth = toDateOnlyString(expectedPaymentDate).slice(0, 7);

    const { error } = await supabase.from("receipts").insert({
      receipt_date: data.receipt_date,
      source_id: data.source_id,
      client_type: source.name,
      for_month: data.for_month,
      expected_payment_month: expectedPaymentMonth,
      amount: data.amount,
      file_url: data.file_url,
    });

    if (error) {
      console.error("addReceipt insert error:", error);
      return { success: false, error: `שגיאה בשמירת הקבלה: ${error.message}` };
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("addReceipt exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "שגיאה לא ידועה בשמירת הקבלה",
    };
  }
}

export async function deleteReceipt(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient();

    const { data: receipt } = await supabase
      .from("receipts")
      .select("file_url")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("receipts").delete().eq("id", id);

    if (error) {
      console.error("deleteReceipt error:", error);
      return { success: false, error: `שגיאה במחיקת הקבלה: ${error.message}` };
    }

    if (receipt?.file_url) {
      await removeReceiptFile(supabase, receipt.file_url);
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("deleteReceipt exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "שגיאה לא ידועה במחיקת הקבלה",
    };
  }
}

export type ReceiptUpdateData = {
  receipt_date?: string;
  source_id?: string;
  for_month?: string;
  amount?: number;
  file_url?: string;
};

export async function updateReceipt(
  id: string,
  data: ReceiptUpdateData
): Promise<ActionResult<null>> {
  const validationError = validateReceiptFields(data);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = { ...data };

    const { data: existing, error: existingError } = await supabase
      .from("receipts")
      .select("source_id, for_month, file_url")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      console.error("updateReceipt existingError:", existingError);
      return {
        success: false,
        error: `הקבלה לא נמצאה: ${existingError?.message ?? "not found"}`,
      };
    }

    if (data.source_id || data.for_month) {

      const sourceId = data.source_id ?? existing.source_id;
      const forMonth = data.for_month ?? existing.for_month;

      const { data: source, error: sourceError } = await supabase
        .from("income_sources")
        .select("name, payment_mode, payment_offset_days")
        .eq("id", sourceId)
        .single();

      if (sourceError || !source) {
        console.error("updateReceipt sourceError:", sourceError);
        return {
          success: false,
          error: `מקור ההכנסה לא נמצא: ${sourceError?.message ?? "not found"}`,
        };
      }

      const [forYear, forMonthNum] = forMonth.split("-").map(Number);
      const forMonthDate = new Date(forYear, forMonthNum - 1, 1);
      const expectedPaymentDate = calculateExpectedPaymentDate(
        forMonthDate,
        source.payment_mode,
        source.payment_offset_days
      );

      updatePayload.client_type = source.name;
      updatePayload.expected_payment_month = toDateOnlyString(
        expectedPaymentDate
      ).slice(0, 7);
    }

    const { error } = await supabase
      .from("receipts")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("updateReceipt error:", error);
      return { success: false, error: `שגיאה בעדכון הקבלה: ${error.message}` };
    }

    // A new file replaced the old one — drop the old file from storage.
    if (data.file_url && existing.file_url && existing.file_url !== data.file_url) {
      await removeReceiptFile(supabase, existing.file_url);
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("updateReceipt exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "שגיאה לא ידועה בעדכון הקבלה",
    };
  }
}
