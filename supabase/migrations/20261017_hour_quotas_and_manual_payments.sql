-- Run once in Supabase → SQL Editor.

-- 1. Default monthly standard hours (תקן) per income source.
alter table income_sources
  add column if not exists standard_hours numeric;

-- 2. Per-month overrides of the standard hours (e.g. January = 27 due to holidays).
create table if not exists source_hour_quotas (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references income_sources(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'), -- 'YYYY-MM' (work month)
  hours numeric not null check (hours >= 0),
  created_at timestamptz not null default now(),
  unique (source_id, month)
);

-- 3. One-off jobs (UGC etc.): free-text description + 'manual' payment mode.
alter table work_logs
  add column if not exists description text;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'income_sources'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_mode%'
  loop
    execute format('alter table income_sources drop constraint %I', c.conname);
  end loop;
end $$;

alter table income_sources
  add constraint income_sources_payment_mode_check
  check (payment_mode in ('immediate', 'specific_day', 'eom_plus_days', 'manual'));

-- 4. Seed the two known UGC jobs (idempotent).
insert into income_sources (name, category, payment_mode, payment_offset_days, default_hourly_rate, tax_pension_rate, is_active)
select v.name, 'freelance', 'manual', 0, null, 0.3, true
from (values ('סופר פארם'), ('קריאייטורס')) as v(name)
where not exists (select 1 from income_sources s where s.name = v.name);

insert into work_logs (source_id, work_date, description, hours_worked, gross_amount, tax_pension_amount, net_amount, expected_payment_date, status)
select s.id, v.pay_date, v.description, null, v.amount, v.amount * 0.3, v.amount * 0.7, v.pay_date, 'pending'
from (values
  ('סופר פארם', 'UGC', 550::numeric, date '2026-10-15'),
  ('קריאייטורס', 'UGC - בריטה', 400::numeric, date '2026-12-15')
) as v(source_name, description, amount, pay_date)
join income_sources s on s.name = v.source_name
where not exists (
  select 1 from work_logs w
  where w.source_id = s.id and w.expected_payment_date = v.pay_date and w.gross_amount = v.amount
);
