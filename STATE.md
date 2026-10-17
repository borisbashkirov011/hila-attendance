# Project State — Hila Attendance & Income Tracker

Next.js 16 (App Router, `src/proxy.ts` instead of middleware) + React 19 + TS strict + Tailwind v4 + Supabase. UI Hebrew/RTL.

## Database (Supabase, not managed by repo)
- `income_sources`: `id, name, category, payment_mode, payment_offset_days, default_hourly_rate, tax_pension_rate, is_active`
- `work_logs`: `id, source_id, work_date, hours_worked, gross_amount, tax_pension_amount, net_amount, expected_payment_date, status, created_at`
- `receipts`: `id, receipt_date, source_id, client_type, for_month (YYYY-MM), expected_payment_month (YYYY-MM), amount, file_url` — storage bucket `receipts` (public URLs)
- `expenses`: `id, expense_date, supplier_name, amount, file_url` — storage bucket `expenses` (public URLs)

## Auth
- Passcode gate: `src/proxy.ts` redirects to `/login` unless cookie `hila_auth` == SHA-256(`passcode:AUTH_SECRET`). Passcode = env `APP_PASSCODE` (fallback `1412`); `AUTH_SECRET` env optional (fallback constant). Changing either logs everyone out.
- `/login` (`LoginForm` + `loginAction`, 1s delay on wrong code). Logout button on `/settings`.
- `/api/calendar/feed?token=<same token>` — 401 without it. Settings page builds the URL server-side. Old iPhone subscriptions (no token) must be re-added.

## Routes
- `/` dashboard: `IncomeSummaryWidget` (osek patur bar), `FinancialSummaryCards` (by `expected_payment_date`), `UpcomingShifts`, `DashboardQuickActions` (shift/receipt/expense FABs). Single `income_sources` query.
- `/schedule` calendar grid + daily modal (add/edit/delete shifts).
- `/taxes` 3-way month toggle (default next); tax breakdown; actual income = receipts with `expected_payment_month` = target month; receipts + expenses lists for current year. All queries in one `Promise.all`.
- `/settings` income sources CRUD, calendar sync, logout.

## Code layout
- Mutations: `src/lib/actions/{work-logs,income-sources,auth}.ts`, `src/app/actions/{receiptActions,expenseActions}.ts` (validated inputs).
- Reads: `src/lib/data/{receipts,expenses}.ts` (React `cache`, not server actions).
- Utils: `payment-dates.ts` (day clamped to month length), `format.ts` (`formatCurrency` used everywhere for ₪).

## Done this session
- Passcode login (1412) + token-protected calendar feed.
- Fixes: receipt edit now saves new file (old file removed); expenses filtered to current year; dashboard shift modal closes on save; payment day 29–31 no longer overflows; `/taxes` actual income no longer misses cross-year receipts.
- Removed orphans `QuickAddModal`, `IncomeSummaryCards`; modals show inline errors instead of `alert`.
- Verified: `tsc`, `eslint`, `next build` clean; login/logout/feed-401 smoke-tested with Playwright.

## Next steps / open
- Supabase side: enable RLS / make storage buckets private (files reachable by public URL; anon key is in the client bundle).
- Set `APP_PASSCODE` + `AUTH_SECRET` env vars in deployment.
- No expense edit/delete yet.
- Gotcha: never pass functions from Server → Client components.
