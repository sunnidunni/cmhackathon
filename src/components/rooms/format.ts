export type Category = "deadlines" | "chats" | "money" | "ideas" | "unsorted";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseWhen(when: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(when);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const hh = m[4] === undefined ? null : Number(m[4]);
  const mm = m[5] === undefined ? null : Number(m[5]);
  return { y, mo, d, hh, mm, dow: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
}

const clock = (hh: number, mm: number) => `${hh % 12 === 0 ? 12 : hh % 12}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;

export const countLabel = (n: number) => `${n} ${n === 1 ? "screenshot" : "screenshots"}`;

// "Fri, Nov 20", or "Tue, Nov 17, 3:00 PM" when the date carries a time.
export function dateLabel(when: string): string {
  const p = parseWhen(when);
  if (!p) return when;
  const day = `${DAYS[p.dow]}, ${MONTHS[p.mo - 1]} ${p.d}`;
  return p.hh !== null && p.mm !== null ? `${day}, ${clock(p.hh, p.mm)}` : day;
}

export const monthDay = (when: string) => {
  const p = parseWhen(when);
  return p ? `${MONTHS[p.mo - 1]} ${p.d}` : when;
};

export const weekdayName = (when: string) => {
  const p = parseWhen(when);
  return p ? DAYS_FULL[p.dow] : when;
};

const ymdKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const whenKey = (when: string) => {
  const p = parseWhen(when);
  return p ? p.y * 10000 + p.mo * 100 + p.d : null;
};

// "Thu 9:00 AM", plus " (day before)" when the reminder is the calendar day before the date.
export function reminderLabel(dueAt: number, when?: string | null): string {
  const due = new Date(dueAt);
  const base = `${DAYS[due.getDay()]} ${clock(due.getHours(), due.getMinutes())}`;
  const p = when ? parseWhen(when) : null;
  if (!p) return base;
  const dayBefore = new Date(p.y, p.mo - 1, p.d - 1);
  return ymdKey(due) === ymdKey(dayBefore) ? `${base} (day before)` : base;
}

// The default the filled button offers: 9:00 AM the day before. null when that moment has passed.
export function defaultReminder(when: string, now: Date = new Date()) {
  const p = parseWhen(when);
  if (!p) return null;
  const at = new Date(p.y, p.mo - 1, p.d - 1, 9, 0);
  if (at.getTime() <= now.getTime()) return null;
  return { short: `${DAYS[at.getDay()]} 9:00 AM`, long: `${DAYS[at.getDay()]}, ${MONTHS[at.getMonth()]} ${at.getDate()} at 9:00 AM` };
}

export const daysFromToday = (when: string, now: Date = new Date()) => {
  const p = parseWhen(when);
  if (!p) return null;
  const a = Date.UTC(p.y, p.mo - 1, p.d);
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
};

export type RoomItem = {
  id: string;
  title: string;
  date: string | null;
  imageUrl: string | null;
  lineKey: string | null;
  takenAt: number;
};

export const roomHeadline = (category: Category): string =>
  ({
    deadlines: "Tock keeps your deadlines.",
    chats: "Murmur keeps your chats.",
    money: "Penny Pocket keeps your money.",
    ideas: "Mote keeps your ideas.",
    unsorted: "These didn't fit a room.",
  })[category];

// The keeper's one line in the room header, built only from what the room's rows actually hold.
export function roomLine(category: Category, items: Pick<RoomItem, "date" | "takenAt">[], now: Date = new Date()): string {
  const n = items.length;
  const today = ymdKey(now);
  const upcoming = items
    .map((i) => i.date)
    .filter((d): d is string => d !== null && (whenKey(d) ?? 0) >= today)
    .sort();
  if (category === "deadlines") {
    const dated = items.filter((i) => i.date !== null).length;
    const lead = `${dated} ${dated === 1 ? "thing" : "things"} with a date.`;
    return upcoming[0] ? `${lead} The soonest is ${weekdayName(upcoming[0])}.` : lead;
  }
  if (category === "chats") return `${n} ${n === 1 ? "conversation" : "conversations"} kept. Not a word repeated.`;
  if (category === "money") {
    const lead = countLabel(n) + ".";
    return upcoming[0] ? `${lead} The next one is due ${dateLabel(upcoming[0]).replace(/, \d+:\d+ [AP]M$/, "")}.` : lead;
  }
  if (category === "ideas") {
    const oldest = items.reduce((m, i) => Math.min(m, i.takenAt), Infinity);
    const d = new Date(oldest);
    return `${n} ${n === 1 ? "idea" : "ideas"} saved. The oldest has waited since ${MONTHS[d.getMonth()]} ${d.getDate()}.`;
  }
  return "Too blurry or too bare for the keepers. You decide where each one goes.";
}
