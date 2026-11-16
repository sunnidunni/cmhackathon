import { notificationText } from "../../../convex/lib/notificationText";
import { computeDueAt, isFutureWhen, parseWhen } from "../../../convex/lib/time";

export type ShotDate = { when: string; what: string; confident: boolean };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// tz is Date.getTimezoneOffset(). Formats an instant in the phone's local time without Intl.
function local(ms: number, tz: number) {
  const d = new Date(ms - tz * 60000);
  return { dow: DAYS[d.getUTCDay()], mon: MONTHS[d.getUTCMonth()], day: d.getUTCDate(), h: d.getUTCHours(), m: d.getUTCMinutes(), key: d.toISOString().slice(0, 10) };
}

export const clock = (ms: number, tz: number) => {
  const { h, m } = local(ms, tz);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export const dayLabel = (ms: number, tz: number) => {
  const { dow, mon, day } = local(ms, tz);
  return `${dow}, ${mon} ${day}`;
};

export const whenLabel = (when: string) => {
  const p = parseWhen(when, 0);
  if (!p) return when;
  return `${DAYS[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()]}, ${MONTHS[p.mo - 1]} ${p.d}`;
};

// "today, 9:12 AM" for the same local day, otherwise "Nov 8".
export function savedLabel(takenAt: number, now: number, tz: number) {
  const t = local(takenAt, tz);
  if (t.key === local(now, tz).key) return `today, ${clock(takenAt, tz)}`;
  return `${t.mon} ${t.day}`;
}

// Mirrors the server's pick: the soonest confident date that is still ahead.
export function nextConfidentDate(dates: ShotDate[], now: number, tz: number) {
  const future = dates.filter((d) => d.confident && isFutureWhen(d.when, now, tz));
  future.sort((a, b) => (parseWhen(a.when, tz)?.instant ?? 0) - (parseWhen(b.when, tz)?.instant ?? 0));
  return future[0] ?? null;
}

// The demo world clock: Sun Nov 15, 9:41 AM in the phone's time zone, so fixture reminders stay dated after the demo day.
export const demoNow = (tz: number) => Date.UTC(2026, 10, 15, 9, 41) + tz * 60000;

export const dueParts = (dueAt: number, tz: number) => ({ dueAt, label: `${local(dueAt, tz).dow} ${clock(dueAt, tz)}`, day: dayLabel(dueAt, tz), clock: clock(dueAt, tz) });

// The backend schedules 9:00 local the day before (computeDueAt); this only previews it. A reminder that is already
// scheduled keeps its saved instant (existingDueAt) instead of being recomputed in the phone's current time zone.
export function defaultReminder(dates: ShotDate[], now: number, tz: number, existingDueAt?: number) {
  const date = nextConfidentDate(dates, now, tz);
  if (!date) return null;
  return { date, ...dueParts(existingDueAt ?? computeDueAt(date.when, now, tz), tz) };
}

export function previewText(shot: { title: string; category: string; amount: string | null }, date: ShotDate, dueAt: number, tz: number) {
  return notificationText({ title: shot.title || "screenshot", category: shot.category, when: date.when, at: dueAt, tz, amount: shot.amount ?? undefined, what: date.what });
}
