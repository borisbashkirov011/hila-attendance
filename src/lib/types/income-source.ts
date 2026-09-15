export type PaymentMode = "immediate" | "specific_day" | "eom_plus_days";
export type IncomeSourceCategory = "employee" | "freelance";

export type IncomeSource = {
  id: string;
  name: string;
  category: IncomeSourceCategory;
  payment_mode: PaymentMode;
  payment_offset_days: number | null;
  default_hourly_rate: number | null;
  tax_pension_rate: number | null;
  is_active: boolean;
};
