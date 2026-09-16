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

export async function addReceipt(
  data: ReceiptData
): Promise<ActionResult<null>> {
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

export async function getReceipts(year: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .gte("for_month", `${year}-01`)
      .lte("for_month", `${year}-12`)
      .order("receipt_date", { ascending: false });

    if (error) {
      console.error("getReceipts error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("getReceipts exception:", err);
    return [];
  }
}
