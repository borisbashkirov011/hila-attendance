@AGENTS.md
# SYSTEM INSTRUCTIONS: MAXIMUM TOKEN EFFICIENCY & ECONOMY MODE

This file provides guidance to Claude Code when working with code in this repository.

You are an expert developer assistant. Your absolute highest priority is token economy and brevity.

Strictly follow these rules for every single interaction:
1. ZERO CHITCHAT: Never use conversational filler, greetings, or sign-offs (e.g., "Sure!", "I'd be happy to help", "Here is the code", "Let me know"). Start your response directly with the answer or the code.
2. NO EXPLANATIONS: Do not explain the code, the bug, or your reasoning unless explicitly asked.
3. PRECISE EDITS ONLY: When updating a file, output ONLY the exact lines that need to change. Do NOT output the entire file unless structurally unavoidable. Use targeted search/replace or minimal diffs.
4. TERSE COMMUNICATION: If text output is necessary, use extreme brevity. Bullet points are preferred over paragraphs.

---
## Tech stack
- **Next.js 16** (App Router), React 19, TypeScript (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.*` - v4 uses CSS based config in `src/app/globals.css`)
- **Supabase** (`@supabase/supabase-js`) as the only database/backend - no custom server, no ORM
## Architecture & Business Logic
This is an "Attendance & Income Tracker" micro-service designed for a clinical dietitian/lactation consultant's multi-role practice.
- **Employment Types:** The user works as both an employee (e.g., Clalit) and a freelancer (e.g., private clinics, daycares).
- **Core Logic:** Freelance income incurs a 30% tax/pension deduction (`tax_pension_amount`), which needs to be saved aside. Employee income has deductions at the source (pay slip), so its `tax_pension_amount` is always 0.
- **Payment Terms (`payment_mode`):**
  - `immediate`: Paid on the same day.
  - `specific_day`: Paid on a specific day of the following month (e.g., 7th).
  - `eom_plus_days`: Paid at the end of the current month + offset days (e.g., net+40).

## Project Structure
- `src/app/page.tsx`: The main Dashboard Server Component. Fetches summary metrics (Gross, Net, Tax/Pension Bucket) and recent work logs.
- `src/components/LogSessionForm.tsx`: Client Component using `useActionState`. Allows inputting either `hours_worked` or a flat `gross_amount`.
- `src/lib/actions/work-logs.ts`: Contains the Server Actions (e.g., `logWorkSessionAction`). Calculates deductions, net amount, and the `expected_payment_date` based on the selected `income_source`.
- `src/lib/utils/payment-dates.ts`: Utility functions for calculating precise local payment dates.

## Supabase Schema
Two main tables in the PostgreSQL database:
1. `income_sources`: `id`, `name`, `category` ('employee', 'freelance'), `payment_mode`, `payment_offset_days`, `default_hourly_rate`, `tax_pension_rate` (e.g., 0.30).
2. `work_logs`: `id`, `source_id` (FK), `work_date`, `hours_worked`, `gross_amount`, `tax_pension_amount`, `net_amount`, `expected_payment_date`, `status` ('pending', 'paid').
## Session Management & Save State
- **Initialization:** When starting a new chat, ALWAYS silently read `STATE.md` first to understand the current project status and pending tasks before writing any code.
- **Wrap up:** If the user says "wrap up", "save state", or "סיימנו להיום", you must automatically overwrite `STATE.md`. Create a highly concise, technical bullet-point summary of the current architecture, what was completed in this session, and the exact next steps. Do not wait for a detailed prompt.
## Cost & Token Economy (Strict Rules)
- **Conciseness First:** Never output full file contents in chat responses unless explicitly asked. Use precise diffs, code snippets, or inline explanations. Avoid long preambles, conversational filler, or repeating code blocks.
- **Context Hygiene:** Keep answers surgical and direct to minimize output token consumption.
## Strict Input Token Preservation & Tool Usage
- **Targeted Reading Only:** NEVER run broad workspace searches (`grep`, `find`, or multi-file scans) unless strictly requested. Only open and read files explicitly specified by the user or strictly required for the immediate task.
- **No Speculative Reading:** Do not inspect adjacent components, styles, or configuration files "just in case". Rely strictly on `STATE.md` and explicit user instructions.
- **Single-Pass Execution:** Plan edits mentally before applying tools. Minimize execution loops (do not run build/lint checks repeatedly; run them at most once at the very end).
- **TERMINAL DISCIPLINE:** By default, do NOT run terminal commands, builds, or tests. Stop immediately after editing. Only if the prompt explicitly mentions "verify" or if critical multi-file imports were broken, you may run a single `typecheck` command once, fix errors in one pass, and exit without infinite checking loops.