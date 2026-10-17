import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Expense = {
  id: string;
  expense_date: string;
  supplier_name: string;
  amount: number;
  file_url: string | null;
};

// Expenses dated within `year`. Cached per request.
export const getExpensesForYear = cache(async (year: number): Promise<Expense[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("expense_date", `${year}-01-01`)
    .lte("expense_date", `${year}-12-31`)
    .order("expense_date", { ascending: false });

  if (error) {
    console.error("getExpensesForYear error:", error);
    return [];
  }
  return data ?? [];
});
