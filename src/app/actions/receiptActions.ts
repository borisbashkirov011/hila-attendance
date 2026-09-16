"use server";

import { createClient } from "@/lib/supabase/server";

export type ReceiptData = {
  receipt_date: string; // 'YYYY-MM-DD'
  client_type: string;
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

  const { error } = await supabase.from("receipts").insert(data);

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
