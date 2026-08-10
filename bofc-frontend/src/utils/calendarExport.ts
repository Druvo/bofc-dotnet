// "Add to calendar" - pure client-side, no backend involved. Produces a
// downloadable .ics file plus a Google Calendar prefill link for any event
// with a start/end time.

export interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  /** Defaults to start + 2h when omitted (typical match duration). */
  end?: Date;
}

const toICSDate = (d: Date): string =>
  d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

const escapeICSText = (s: string): string =>
  s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

const resolveEnd = (event: CalendarEventInput): Date =>
  event.end ?? new Date(event.start.getTime() + 2 * 60 * 60 * 1000);

export function buildICS(event: CalendarEventInput): string {
  const end = resolveEnd(event);
  const uid = `${event.start.getTime()}-${Math.random().toString(36).slice(2)}@bofc`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BOFC//Match Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(event.start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeICSText(event.description)}` : null,
    event.location ? `LOCATION:${escapeICSText(event.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return lines.join("\r\n");
}

export function downloadICS(event: CalendarEventInput, filename = "bofc-match.ics"): void {
  const blob = new Blob([buildICS(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(event: CalendarEventInput): string {
  const end = resolveEnd(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toICSDate(event.start)}/${toICSDate(end)}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
