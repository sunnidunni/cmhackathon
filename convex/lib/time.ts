// tzOffsetMinutes is Date.getTimezoneOffset() from the phone: UTC minus local, in minutes.
export const localDay = (ms: number, tz: number) => new Date(ms - tz * 60000).toISOString().slice(0, 10);

// A phone's time zone by name, such as "America/Los_Angeles". Unlike an offset, it knows about clock changes.
export function isTimeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

// The calendar day in `zone` at the instant `ms`, as YYYY-MM-DD.
export function dayInZone(ms: number, zone: string) {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: zone });
}

// Minutes `zone` is behind UTC at the instant `ms`: the same number Date.getTimezoneOffset() gives on a phone there.
export function offsetInZone(ms: number, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((Math.floor(ms / 1000) * 1000 - wall) / 60000);
}

// The instant of a wall-clock time in `zone`.
export function wallToInstant(y: number, mo: number, d: number, hh: number, mm: number, zone: string) {
  const asUtc = Date.UTC(y, mo - 1, d, hh, mm);
  const first = asUtc + offsetInZone(asUtc, zone) * 60000;
  // Around a clock change the offset at the first guess can differ from the offset at the answer. A second pass settles it.
  return asUtc + offsetInZone(first, zone) * 60000;
}

const FULL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;

// null for anything that is not a real calendar date and time, such as month 13 or February 31.
export function parseWhen(when: string, tz: number) {
  const m = FULL.exec(when);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const hasTime = m[4] !== undefined;
  const [hh, mm] = hasTime ? [Number(m[4]), Number(m[5])] : [0, 0];
  const utc = new Date(Date.UTC(y, mo - 1, d, hh, mm));
  if (utc.getUTCMonth() !== mo - 1 || utc.getUTCDate() !== d || hh > 23 || mm > 59) return null;
  return { y, mo, d, hasTime, hh, mm, instant: utc.getTime() + tz * 60000, day: when.slice(0, 10) };
}

export function isFutureWhen(when: string, now: number, tz: number) {
  const p = parseWhen(when, tz);
  if (!p) return false;
  return p.hasTime ? p.instant >= now : p.day >= localDay(now, tz);
}

// 9:00 local the day before; one hour before if the date is today; never in the past.
// tz is the phone's offset right now. With `zone` (the phone's time zone name) the reminder lands on the right
// wall-clock time even when the clocks change between now and then; without it, today's offset is assumed.
export function computeDueAt(when: string, now: number, tz: number, zone?: string) {
  const p = parseWhen(when, tz);
  if (!p) throw new Error("Not a full date");
  const at = (d: number, hh: number, mm: number) => (zone ? wallToInstant(p.y, p.mo, d, hh, mm, zone) : Date.UTC(p.y, p.mo - 1, d, hh, mm) + tz * 60000);
  const today = zone ? dayInZone(now, zone) : localDay(now, tz);
  let due: number;
  if (p.day === today) due = p.hasTime ? at(p.d, p.hh, p.mm) - 3600000 : now + 60000;
  else due = at(p.d - 1, 9, 0);
  return Math.max(due, now + 60000);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "today", "tomorrow", or "on Thu, Nov 20", relative to the local day of `at`.
export function dayPhrase(when: string, at: number, tz: number) {
  const p = parseWhen(when, tz);
  if (!p) return "soon";
  const base = localDay(at, tz);
  if (p.day === base) return "today";
  const next = localDay(at + 86400000, tz);
  if (p.day === next) return "tomorrow";
  return `on ${DAYS[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()]}, ${MONTHS[p.mo - 1]} ${p.d}`;
}

export function clockPhrase(when: string, tz: number) {
  const p = parseWhen(when, tz);
  if (!p || !p.hasTime) return null;
  const h = p.hh % 12 === 0 ? 12 : p.hh % 12;
  return `${h}:${String(p.mm).padStart(2, "0")} ${p.hh < 12 ? "AM" : "PM"}`;
}

// "Monday, 2026-11-16": the person's day, for a model that otherwise has no idea what today is.
export function todayPhrase(now: number, zone: string) {
  return `${new Date(now).toLocaleDateString("en-US", { timeZone: zone, weekday: "long" })}, ${dayInZone(now, zone)}`;
}
