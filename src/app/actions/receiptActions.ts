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

export async function uploadReceiptFile(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("לא נבחר קובץ");
  }

  const filePath = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("receipts")
    .upload(filePath, file);

  if (error) {
    throw new Error(`שגיאה בהעלאת הקובץ: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("receipts").getPublicUrl(filePath);

  return publicUrl;
}

export async function addReceipt(data: ReceiptData) {
  const supabase = await createClient();

  const { data: source, error: sourceError } = await supabase
    .from("income_sources")
    .select("name, payment_mode, payment_offset_days")
    .eq("id", data.source_id)
    .single();

  if (sourceError || !source) {
    throw new Error(`מקור ההכנסה לא נמצא: ${sourceError?.message ?? "not found"}`);
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
    throw new Error(`שגיאה בשמירת הקבלה: ${error.message}`);
  }
}

export async function getReceipts(year: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .gte("for_month", `${year}-01`)
    .lte("for_month", `${year}-12`)
    .order("receipt_date", { ascending: false });

  if (error) {
    throw new Error(`שגיאה בטעינת קבלות: ${error.message}`);
  }

  return data;
}
