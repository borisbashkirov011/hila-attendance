# הקשר פרויקט: אפליקציית נוכחות והכנסות של הילה

> מסמך הקשר מלא לפרויקט Claude. עדכני ל-08.11.2026.
> ריפו: `borisbashkirov011/hila-attendance` (ענף ראשי `main`), פריסה: Vercel (מתעדכן אוטומטית בכל מיזוג ל-`main`).

---

## 1. מה האפליקציה עושה

אפליקציית ווב אישית (מותאמת לנייד, עברית, RTL) למעקב אחרי משמרות, שעות והכנסות של הילה, דיאטנית קלינית ויועצת הנקה שעובדת במקביל:
- **כשכירה**: למשל כללית. ניכויים במקור בתלוש, ולכן אין הפרשה.
- **כעצמאית (עוסק פטור)**: קליניקות פרטיות, מעונות, עבודות UGC. מפרישים 30% בצד למס ולפנסיה.

המטרה: לדעת כמה כסף ייכנס, מתי, ומאיפה. וגם כמה להפריש, כמה קבלות הוצאו, כמה הוצאות מוכרות יש, וכמה נשאר עד תקרת עוסק פטור.

**המשתמשים:** הילה, ובן הזוג שלה שמנהל את הפיתוח מול Claude. התקשורת בעברית.

---

## 2. כללי עסק (הכי חשוב)

### 2.1 סוגי העסקה (`category`)
| ערך | תצוגה | `tax_pension_amount` |
|---|---|---|
| `employee` | שכירה | תמיד 0 |
| `freelance` | עצמאית | 30% מהברוטו (`tax_pension_rate` = 0.3) |

`net_amount = gross_amount - tax_pension_amount`

### 2.2 מועדי תשלום (`payment_mode`, enum בשם `payment_mode_type` ב-Postgres)
| ערך | תצוגה ב-UI | חישוב `expected_payment_date` |
|---|---|---|
| `immediate` | מיידי | יום העבודה |
| `specific_day` | בחודש העוקב (יום X) | יום `payment_offset_days` בחודש שאחרי חודש העבודה |
| `eom_plus_days` | בעוד חודשיים (יום X) | יום `payment_offset_days` בחודש שאחרי הבא |
| `manual` | תאריך ידני לכל עבודה | נקבע ידנית בכל רישום (עבודות חד-פעמיות כמו UGC) |

היום נחתך לאורך החודש: 31 בפברואר הופך ל-28/29 בפברואר.

### 2.3 שעות תקן ושעות מעבר לתקן
- לכל מקור הכנסה יכולות להיות **שעות תקן חודשיות** כברירת מחדל (`income_sources.standard_hours`, למשל 40).
- אפשר לדרוס את התקן לחודש מסוים (טבלה `source_hour_quotas`, למשל ינואר 27 בגלל החגים, ספטמבר 2026 17).
- **שעות עד התקן** משולמות ב-`expected_payment_date` הרגיל. **שעות מעבר לתקן** משולמות **חודש אחרי** (באותו יום).
- הפיצול מחושב **בזמן קריאה** ולא נשמר ב-DB (`src/lib/utils/payment-schedule.ts`). המשמרות של חודש ממוינות לפי תאריך, והשעות נצברות. משמרת שחוצה את התקן מתפצלת יחסית בין שני התשלומים.
- דוגמה מאומתת (כללית, תשלום ב-10 לחודש העוקב, 54 ₪ לשעה):
  - ספטמבר: תקן 17, עבדה 34 שעות. 17 שעות משולמות ב-10.10, ו-17 שעות ב-10.11.
  - אוקטובר: תקן 40, עבדה 55 שעות. 40 שעות משולמות ב-10.11, ו-15 שעות ב-10.12.
- **סכומי הדשבורד ודף הפירוט חייבים להשתמש ב-`getPaymentEntries`**, לא ב-`expected_payment_date` הגולמי.

### 2.4 נתונים ידועים על הילה
- כללית: 54 ₪ לשעה ("בחפיפה", ללא פרמיה). תשלום ב-10 לחודש העוקב, תקן ברירת מחדל 40.
- **פרמיה, עדיין לא מומשה:** תחל ב-2027, עד 1,300 ₪ לחודש, משולמת בשוטף+60. אופן החישוב עוד לא ידוע, ומחכים להגדרה מהילה.
- עבודות UGC (עצמאית, `manual`): סופר פארם 550 ₪, תשלום 15.10.2026; קריאייטורס (בריטה) 400 ₪, תשלום 15.12.2026.

### 2.5 מיסים (דף "פירוט", `src/lib/utils/tax-calculations.ts`)
- **שכירה**: פנסיה 7%, קרן השתלמות 2.5%, ביטוח לאומי 3.5%.
- **עצמאית**: פנסיה 10%, קרן השתלמות 4.5%, ביטוח לאומי 10%, מס הכנסה 5.5% (סה"כ 30%).
- **תקרת עוסק פטור**: 120,000 ₪ לשנה. ההתקדמות נמדדת לפי סכום **הקבלות** בשנה, לפי `for_month`.

### 2.6 קבלות והוצאות
- **קבלה** (`receipts`) = הכנסה בפועל מעצמאית. יש לה `for_month` (חודש העבודה) ו-`expected_payment_month`, שמחושב לפי מועד התשלום של המקור. "הכנסות בפועל" בחודש = קבלות שה-`expected_payment_month` שלהן הוא החודש הזה.
- **הוצאה מוכרת** (`expenses`): מוצגת לשנה הנוכחית.
- אפשר לצרף קבצים לשניהם (Supabase Storage, ב-buckets `receipts` ו-`expenses`, קישורים ציבוריים).

---

## 3. מסכים

| נתיב | תיאור |
|---|---|
| `/login` | מסך קוד כניסה. |
| `/` דשבורד | "היי הילה ✨"; סרגל עוסק פטור; כרטיסי חודש נוכחי וחודש הבא (נטו, ברוטו, מיסים, פיצול שכירה/עצמאית, שעות, תעריף ממוצע) לפי תאריך התשלום; משמרות קרובות; שלושה כפתורים צפים: משמרת (ורוד), קבלה (ירוק), הוצאה (צהוב). |
| `/schedule` משמרות | לוח חודשי. לחיצה על יום פותחת רשימת משמרות עם הוספה, עריכה ומחיקה. מעל הלוח: "X/Y שעות תקן" לכל מקור עם תקן. |
| `/taxes` פירוט | בחירת חודש (נוכחי / עוקב (ברירת מחדל) / בעוד חודשיים); כרטיסי מס לשכירה ולעצמאית; "מאיפה הכסף מגיע" לפי מקור (שעות, מתוכן מעבר לתקן, או מספר עבודות; ברוטו ונטו); רשימת קבלות לשנה; הוצאות מוכרות לשנה. |
| `/settings` הגדרות | ניהול מקורות הכנסה (שם, סוג, תעריף, מועד תשלום, יום, שעות תקן); כפתור "תקן לפי חודש"; סנכרון יומן לאייפון; התנתקות. |
| `/api/calendar/feed?token=…` | פיד ICS לכל המשמרות (מנוי webcal). דורש token. |

**מקור הכנסה עם היסטוריה לא נמחק אלא מושבת** (`is_active=false`), ואפשר להפעיל אותו מחדש.

---

## 4. טכנולוגיה

- **Next.js 16** (App Router), **React 19**, **TypeScript strict**. ב-Next 16 יש שינויים: `middleware` נקרא עכשיו **`proxy`** (`src/proxy.ts`), ו-`searchParams`/`cookies()` הם async. התיעוד נמצא ב-`node_modules/next/dist/docs/`.
- **Tailwind CSS v4** דרך `@tailwindcss/postcss`, בלי `tailwind.config` (ההגדרות ב-`src/app/globals.css`).
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) הוא ה-backend היחיד. אין ORM ואין שרת נפרד.
- `lucide-react` לאייקונים, ופונט Rubik.

### 4.1 מבנה קוד
```
src/
  proxy.ts                      # שער קוד: מפנה ל-/login בלי עוגייה תקינה
  app/
    layout.tsx                  # RTL, Rubik, רקע קרם, NavBar
    page.tsx                    # דשבורד
    login/page.tsx
    schedule/page.tsx
    taxes/page.tsx              # "פירוט"
    settings/page.tsx
    api/calendar/feed/route.ts
    actions/receiptActions.ts   # Server Actions לקבלות (+ העלאת קבצים)
    actions/expenseActions.ts   # Server Actions להוצאות
  lib/
    auth.ts                     # AUTH_COOKIE, computeAuthToken, isValidPasscode
    actions/                    # Server Actions: work-logs, income-sources, hour-quotas, auth
    data/                       # קריאות עם React cache: receipts, expenses, payment-schedule
    utils/
      payment-dates.ts          # calculateExpectedPaymentDate, addMonthsClamped, toDateOnlyString
      payment-schedule.ts       # buildPaymentEntries: פיצול תקן ומעבר לתקן
      payment-terms.ts          # מיפוי בין payment_mode ל-UI
      tax-calculations.ts, format.ts (formatCurrency/formatDate he-IL), calendar.ts, shift-status.ts
    types/income-source.ts      # IncomeSource, IncomeSourceOption, INCOME_SOURCE_COLUMNS, HourQuotaOverride
    types/work-log.ts
  components/                   # LogSessionForm, WorkLogFormFields, CalendarClient, DashboardQuickActions,
                                # FinancialSummaryCards, IncomeSourceBreakdown, IncomeSourceManager,
                                # IncomeSourceFormModal/Fields, HourQuotaModal, MonthPicker, MonthToggle,
                                # AddReceiptModal, ReceiptRow, AddExpenseModal, TaxCalculatorCards,
                                # TaxProgressBar, IncomeSummaryWidget, UpcomingShifts, NavBar, LoginForm, ...
supabase/migrations/            # SQL שמריצים ידנית ב-Supabase SQL Editor
```

---

## 5. מסד נתונים (Supabase / Postgres)

| טבלה | עמודות |
|---|---|
| `income_sources` | `id, name, category ('employee'/'freelance'), payment_mode (enum payment_mode_type), payment_offset_days, default_hourly_rate, tax_pension_rate, standard_hours, is_active` |
| `work_logs` | `id, source_id (FK), work_date, description, hours_worked, gross_amount, tax_pension_amount, net_amount, expected_payment_date, status ('pending'/'paid'), created_at` |
| `source_hour_quotas` | `id, source_id (FK, cascade), month ('YYYY-MM'), hours, created_at`, ייחודי לכל צירוף `(source_id, month)` |
| `receipts` | `id, receipt_date, source_id, client_type (שם המקור), for_month ('YYYY-MM'), expected_payment_month ('YYYY-MM'), amount, file_url` |
| `expenses` | `id, expense_date, supplier_name, amount, file_url` |

**חשוב:**
- המיגרציות **לא רצות אוטומטית**. כותבים קובץ ב-`supabase/migrations/` והמשתמש מריץ אותו ידנית ב-SQL Editor.
- `payment_mode` הוא **enum**. ערך חדש מוסיפים עם `alter type payment_mode_type add value if not exists '...'`. אי אפשר להשתמש בו באותה הרצה, אז צריך שתי הרצות נפרדות.
- **RLS כבוי.** האפליקציה ניגשת עם המפתח הציבורי (anon), בלי משתמש מחובר. כשיוצרים טבלה, Supabase שואל על RLS: בוחרים "Run without RLS", אחרת האפליקציה לא תוכל לגשת אליה.
- בשאילתות עם join (`income_sources(name)`) מקבלים אובייקט אחד ולא מערך, ולכן משתמשים ב-`as unknown as Type`.

---

## 6. אבטחה וגישה

- **קוד כניסה**: `src/proxy.ts` חוסם כל דף, כולל Server Actions, בלי עוגייה `hila_auth` תקינה.
  - הקוד מוגדר במשתנה סביבה `APP_PASSCODE` (ברירת מחדל בקוד: 1412).
  - העוגייה = SHA-256 של `passcode:AUTH_SECRET`, `httpOnly`, תקפה לשנה.
  - קוד שגוי גורם להשהיה של שנייה.
  - שינוי של `APP_PASSCODE` או של `AUTH_SECRET` מנתק את כולם.
- **פיד היומן** פתוח ב-proxy אבל דורש `?token=` זהה לערך העוגייה. הקישור נבנה בשרת בדף ההגדרות.
- **משתני סביבה ב-Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `APP_PASSCODE`, `AUTH_SECRET`. שינוי במשתנה דורש Redeploy.
- **פערים ידועים**:
  - המפתח הציבורי (anon) נמצא בקוד של הדפדפן, ו-RLS כבוי, כך שמי שמשיג אותו ניגש לטבלאות ישירות.
  - קבצי הקבלות וההוצאות נגישים בקישור ציבורי.
  - הפתרון העתידי: כל הגישה ל-Supabase דרך השרת, הפעלת RLS ו-buckets פרטיים.

---

## 7. עיצוב

- "בוטיק" פסטלי בסגנון iOS: רקע קרם `#FBF6EF` עם שני כתמים מטושטשים (ורוד ושגול). צבע הדגשה dusty rose (`rose-400/500`).
- כרטיסים `rounded-3xl`, `shadow-sm`, גרדיאנטים פסטליים, תגיות `rounded-full bg-white/70`.
- בנייד: סרגל ניווט קבוע בתחתית, כפתורים צפים ב-`bottom-20 end-4`. בדסקטופ: כותרת עליונה.
- כל הטקסט בעברית, ומטבע תמיד דרך `formatCurrency` (he-IL, ₪, בלי אגורות).

---

## 8. מוסכמות ומלכודות

1. **אסור להעביר פונקציה כ-prop** מ-Server Component ל-Client Component: זה מפיל את הדף עם 500. מעבירים ערכים מחושבים, למשל `href` כמחרוזת.
2. **קריאות** נמצאות ב-`src/lib/data/` (React `cache`). **שינויים** ב-Server Actions. אין לשים פונקציות קריאה בקבצי `"use server"`, כי הן הופכות ל-endpoint ציבורי.
3. **סכומים לפי חודש תשלום** מחשבים דרך `getPaymentEntries(start, end)` (כולל פיצול תקן). לוח המשמרות ומצב משמרת (מתוכנן/בוצע) מבוססים על `work_date`. לא לערבב ביניהם.
4. `<input type="month">` לא עובד בספארי ובפיירפוקס בדסקטופ, אז משתמשים ב-`MonthPicker` (רשימות חודש ושנה).
5. שאילתות בדף רצות במקביל (`Promise.all`).
6. `gross_amount` לא חובה אם יש שעות ותעריף. במקור `manual` חובה סכום ותאריך תשלום.
7. בדיקות לפני מיזוג: `npx tsc --noEmit`, `npx eslint src`, `npm run build`. ל-build מקומי צריך משתני Supabase, ומספיקים ערכים פיקטיביים.

## 9. תהליך עבודה עם המשתמש

- המשתמש כותב בעברית ומעדיף תשובות קצרות וענייניות.
- השינויים נעשים בענף, נפתח PR ל-`main`, ו**ממזגים רק אחרי אישור** (squash). המיזוג מעלה את הגרסה ל-Vercel אוטומטית.
- שינוי ב-DB: נותנים SQL מוכן להדבקה, מחכים שהמשתמש יריץ, ורק אז ממזגים קוד שתלוי בו.
- `STATE.md` בריפו מתעדכן בסוף כל סשן.

## 10. משימות פתוחות

- [ ] פרמיה מ-2027 (עד 1,300 ₪, שוטף+60): מחכים לכללי חישוב.
- [ ] אבטחה בצד Supabase: RLS, buckets פרטיים, גישה דרך השרת בלבד.
- [ ] עריכה ומחיקה של הוצאות (קיימת רק הוספה).
- [ ] "תעריף ממוצע" בדשבורד כולל עבודות בלי שעות (UGC), ולכן מנופח. כדאי לשקול לחשב אותו רק ממשמרות עם שעות.
