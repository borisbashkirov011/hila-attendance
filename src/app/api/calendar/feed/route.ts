import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";

function toIcsDate(dateString: string): string {
  return dateString.replace(/-/g, "");
}

function nextDay(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let result = "";
  let remaining = line;
  while (remaining.length > 75) {
    result += remaining.slice(0, 75) + "\r\n ";
    remaining = remaining.slice(75);
  }
  return result + remaining;
}

type FeedRow = {
  id: string;
  work_date: string;
  hours_worked: number | null;
  gross_amount: number;
  net_amount: number;
  status: string;
  income_sources: { name: string } | null;
};

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("work_logs")
    .select(
      "id, work_date, hours_worked, gross_amount, net_amount, status, income_sources(name)"
    )
    .order("work_date", { ascending: true });

  if (error) {
    return new Response(`Failed to load calendar feed: ${error.message}`, {
      status: 500,
    });
  }

  const logs = (data ?? []) as unknown as FeedRow[];
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(
    now.getUTCDate()
  ).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(
    now.getUTCMinutes()
  ).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

  const events = logs.map((log) => {
    const summary = escapeIcsText(log.income_sources?.name ?? "משמרת");
    const descriptionParts = [
      `נטו: ${formatCurrency(Number(log.net_amount))}`,
      `ברוטו: ${formatCurrency(Number(log.gross_amount))}`,
    ];
    if (log.hours_worked !== null) {
      descriptionParts.push(`שעות: ${log.hours_worked}`);
    }
    descriptionParts.push(`סטטוס: ${log.status}`);
    const description = escapeIcsText(descriptionParts.join("\n"));

    return [
      "BEGIN:VEVENT",
      `UID:worklog-${log.id}@hila-attendance`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(log.work_date)}`,
      `DTEND;VALUE=DATE:${nextDay(log.work_date)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      "END:VEVENT",
    ]
      .map(foldLine)
      .join("\r\n");
  });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hila Attendance//Work Shifts//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:משמרות - המרפאה של הילה",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(calendar, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="shifts.ics"',
      "Cache-Control": "public, max-age=1800",
    },
  });
}
