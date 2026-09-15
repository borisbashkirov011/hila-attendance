# Project State — Hila Attendance & Income Tracker

Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 + Supabase.
Entire UI is Hebrew / RTL (`<html lang="he" dir="rtl">` in `src/app/layout.tsx`).

## Database (Supabase, already exists — not managed by this repo)

- `income_sources`: `id, name, category ('employee'|'freelance'), payment_mode ('immediate'|'specific_day'|'eom_plus_days'), payment_offset_days, default_hourly_rate, tax_pension_rate, is_active`
- `work_logs`: `id, source_id, work_date, hours_worked, gross_amount, tax_pension_amount, net_amount, expected_payment_date, status ('pending'|'paid'), created_at`
- `tax_pension_amount` is only nonzero for `category = 'freelance'` sources (hardcoded 0.30 rate server-side; not exposed in the UI). Employees always 0.

## Pages / Routes

- `/` — Dashboard (`src/app/page.tsx`): boutique-styled greeting ("היי הילה ✨"), `FinancialSummaryCards` (current + next month by `expected_payment_date`, now with employee/freelance income split bar + hours/avg-hourly-rate pills), `UpcomingShifts`, `QuickAddModal` FAB.
- `/schedule` — Shift calendar (`src/app/schedule/page.tsx` + `CalendarClient.tsx`): month grid. Clicking **any** day (empty or not) opens a Daily Summary modal listing that day's shifts with edit (✏️) / delete (🗑️) buttons and an "הוספת משמרת" button that opens `LogSessionForm` pre-filled with the date. `LogSessionForm` now supports both add and edit mode (`existingLog` prop switches it to `updateWorkLogAction`). `WorkLogEditModal.tsx` was deleted (superseded, confirmed orphaned).
- `/settings` — `IncomeSourceManager` CRUD, plus a new pastel card with `CalendarSyncButton` ("הוספת משמרות ליומן באייפון") + helper text explaining the one-time iPhone Calendar sync.
- `/taxes` — Tax/social breakdown page, unchanged this session.
- `/api/calendar/feed` (`route.ts`) — **new**: public GET endpoint emitting a valid RFC 5545 `.ics` feed of all `work_logs` (all-day VEVENTs, folded lines, `text/calendar` content-type, `Cache-Control: public, max-age=1800`). No auth — anyone with the URL can read shift data; user hasn't flagged this as a concern yet but worth surfacing if data becomes sensitive.

## Design system (established across several sessions this cycle)

- Global look: iOS-native/boutique pastel aesthetic. Body font is Google **Rubik** (`src/app/layout.tsx`, applied via CSS var + inline `fontFamily` since Tailwind v4 has no `tailwind.config.*`). Background is warm cream (`#FBF6EF`) with two large blurred decorative blobs (rose top-end, purple bottom-start), `overflow-x-hidden`.
- Accent color: **dusty rose** (`rose-400`/`rose-500`) for primary actions (FAB, submit buttons, active nav state) — replaced an earlier iOS-blue (`#007AFF`) pass.
- Cards: `bg-white` or pastel gradients (`from-rose-100/80 via-orange-50/60 to-rose-50/80` for "current," `from-purple-100/70 via-slate-50 to-indigo-50/70` for "next"), `rounded-3xl`, `shadow-sm`, no heavy borders. Pill badges (`rounded-full bg-white/70`) for secondary stats.
- `NavBar.tsx` — bottom-fixed tab bar on mobile (`fixed bottom-0 ... backdrop-blur-md`), sticky top header on `md:`. SVG icons per tab, active tab = rose pill background + rose text, inactive = `text-[#8E8E93]`.
- Mobile-first responsive pass done across layout/dashboard/calendar: bottom-nav-safe `pb-16` body padding, FAB at `bottom-20 end-4` (clears bottom nav) → `md:bottom-6`, calendar grid uses smaller gaps/text/`min-h-14` cells on mobile, full size at `sm:`.
- Session pattern: user has been issuing **strictly scoped, cost-limited tasks** ("Target files ONLY", "STRICT COST LIMIT: do NOT run tsc/lint/build/terminal commands — write, save, and STOP"). None of this session's work has been typechecked, linted, or built. **Run a full `tsc`/`next build` pass before shipping.**

## Key shared pieces (mostly unchanged from before this session)

- `src/lib/actions/work-logs.ts` — `logWorkSessionAction`, `updateWorkLogAction`, `deleteWorkLogAction`, shared `computeWorkLogFields()`. Revalidates `/` and `/schedule`.
- `src/lib/actions/income-sources.ts` — CRUD + soft-delete, unchanged.
- `src/lib/utils/payment-dates.ts`, `payment-terms.ts`, `shift-status.ts`, `calendar.ts`, `tax-calculations.ts`, `format.ts` — unchanged; see prior session notes if needed, logic not touched recently.
- `src/lib/types/work-log.ts`, `income-source.ts` — shared types, unchanged.
- `src/components/CalendarSyncButton.tsx` — **new**: client button, opens `webcal://` link directly on iOS (detected via UA sniff), otherwise copies the `https://…/api/calendar/feed` URL to clipboard with a small toast.
- `src/components/LogSessionForm.tsx` — now dual-purpose (add/edit), used both standalone (`QuickAddModal`) and inside `CalendarClient`'s daily-summary flow.
- `src/components/FinancialSummaryCards.tsx`, `UpcomingShifts.tsx`, `CalendarClient.tsx`, `NavBar.tsx` — all restyled this session per the design system above; logic mostly unchanged aside from the new income-split/hours calc in the dashboard cards.

## Important gotchas / decisions

1. Dashboard + `/taxes` totals key off **`expected_payment_date`**; the calendar (`/schedule`) and `getShiftStatus` key off `work_date`/today. Don't conflate.
2. `gross_amount` is optional in forms as long as `hours_worked` is given (source needs `default_hourly_rate`).
3. `.env.local` holds real Supabase credentials; never commit it (gitignored).
4. **Nothing from this session has been typechecked/linted/built.** All work was done under explicit "no terminal commands" constraints per-task. First priority next session: run `tsc`, `next lint`, `next build` and fix any fallout (likely candidates: the new `income_sources(category)` join shape in `page.tsx`'s `sumMonthTotals`, and the `.ics` route's Supabase row typing).
5. The `/api/calendar/feed` endpoint is **unauthenticated** — flag to the user before wider rollout if shift/income data should stay private.

## Open items / not yet done

- Full build/typecheck/lint pass (see gotcha #4).
- Confirm `income_sources(category)` Supabase join actually returns `{ category: string } | null` (not an array) at runtime — assumed but unverified.
- No other pending feature requests beyond what's listed above.
