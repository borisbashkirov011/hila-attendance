"use server";

import { createClient } from "@/lib/supabase/server";

export type ExpenseData = {
  expense_date: string; // 'YYYY-MM-DD'
  supplier_name: string;
  amount: number;
  file_url?: string;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function uploadExpenseFile(
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
      .from("expenses")
      .upload(filePath, file);

    if (error) {
      console.error("uploadExpenseFile error:", error);
      return { success: false, error: `שגיאה בהעלאת הקובץ: ${error.message}` };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("expenses").getPublicUrl(filePath);

    return { success: true, data: publicUrl };
  } catch (err) {
    console.error("uploadExpenseFile exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function addExpense(
  data: ExpenseData
): Promise<ActionResult<null>> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.expense_date)) {
    return { success: false, error: "יש לבחור תאריך תקין." };
  }
  if (!data.supplier_name.trim()) {
    return { success: false, error: "יש להזין ספק / תיאור." };
  }
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    return { success: false, error: "יש להזין סכום תקין." };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("expenses").insert({
      expense_date: data.expense_date,
      supplier_name: data.supplier_name.trim(),
      amount: data.amount,
      file_url: data.file_url,
    });

    if (error) {
      console.error("addExpense insert error:", error);
      return { success: false, error: `שגיאה בשמירת ההוצאה: ${error.message}` };
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("addExpense exception:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
