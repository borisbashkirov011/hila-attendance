import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Receipt = {
  id: string;
  receipt_date: string;
  source_id: string;
  client_type: string;
  for_month: string; // 'YYYY-MM'
  expected_payment_month: string; // 'YYYY-MM'
  amount: number;
  file_url: string | null;
};

// Receipts whose work month (`for_month`) falls in `year`. Cached per request.
export const getReceiptsForYear = cache(async (year: number): Promise<Receipt[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .gte("for_month", `${year}-01`)
    .lte("for_month", `${year}-12`)
    .order("receipt_date", { ascending: false });

  if (error) {
    console.error("getReceiptsForYear error:", error);
    return [];
  }
  return data ?? [];
});

// Receipts expected to be paid in `month` ('YYYY-MM').
export const getReceiptsForPaymentMonth = cache(
  async (month: string): Promise<Receipt[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("expected_payment_month", month);

    if (error) {
      console.error("getReceiptsForPaymentMonth error:", error);
      return [];
    }
    return data ?? [];
  }
);
