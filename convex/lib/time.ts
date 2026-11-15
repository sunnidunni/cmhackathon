// tzOffsetMinutes is Date.getTimezoneOffset() from the phone: UTC minus local, in minutes.
export const localDay = (ms: number, tz: number) => new Date(ms - tz * 60000).toISOString().slice(0, 10);

const FULL = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;

export function parseWhen(when: string, tz: number) {
  const m = FULL.exec(when);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const hasTime = m[4] !== undefined;
  const instant = Date.UTC(y, mo - 1, d, hasTime ? Number(m[4]) : 0, hasTime ? Number(m[5]) : 0) + tz * 60000;
  return { y, mo, d, hasTime, hh: hasTime ? Number(m[4]) : 0, mm: hasTime ? Number(m[5]) : 0, instant, day: when.slice(0, 10) };
}

export function isFutureWhen(when: string, now: number, tz: number) {
  const p = parseWhen(when, tz);
  if (!p) return false;
  return p.hasTime ? p.instant >= now : p.day >= localDay(now, tz);
}

// 9:00 local the day before; one hour before if the date is today; never in the past.
export function computeDueAt(when: string, now: number, tz: number) {
  const p = parseWhen(when, tz);
  if (!p) throw new Error("Not a full date");
  const today = localDay(now, tz);
  let due: number;
  if (p.day === today) due = p.hasTime ? p.instant - 3600000 : now + 60000;
  else due = Date.UTC(p.y, p.mo - 1, p.d - 1, 9, 0) + tz * 60000;
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
