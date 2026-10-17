export type PaymentMode = "immediate" | "specific_day" | "eom_plus_days" | "manual";
export type IncomeSourceCategory = "employee" | "freelance";

export type IncomeSource = {
  id: string;
  name: string;
  category: IncomeSourceCategory;
  payment_mode: PaymentMode;
  payment_offset_days: number | null;
  default_hourly_rate: number | null;
  tax_pension_rate: number | null;
  standard_hours: number | null;
  is_active: boolean;
};

export type IncomeSourceOption = {
  id: string;
  name: string;
  payment_mode?: PaymentMode;
};

export const INCOME_SOURCE_COLUMNS =
  "id, name, category, payment_mode, payment_offset_days, default_hourly_rate, tax_pension_rate, standard_hours, is_active";

export type HourQuotaOverride = {
  id: string;
  source_id: string;
  month: string; // 'YYYY-MM'
  hours: number;
};
