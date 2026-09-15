export type WorkLog = {
  id: string;
  source_id: string;
  work_date: string;
  hours_worked: number | null;
  gross_amount: number;
  net_amount: number;
  status: string;
  income_sources: { name: string } | null;
};
