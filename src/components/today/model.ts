import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";
import { computeDueAt, localDay, parseWhen } from "../../../convex/lib/time";
import { psstLine } from "../../design/psst/lines";
import type { KeeperId } from "@/design/psst";

export type TodayData = FunctionReturnType<typeof api.today.get>;
type Card = TodayData["handful"][number];
export type Section = "missed" | "justIn" | "handful" | "thin";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ROOM_NAMES: Record<string, string> = { deadlines: "Deadlines", chats: "Chats", money: "Money", ideas: "Ideas", unsorted: "Unsorted" };
const KEEPER_NAME: Record<KeeperId, string> = { tock: "Tock", murmur: "Murmur", penny: "Penny", mote: "Mote" };
const ROOM_KEEPER: Record<string, KeeperId> = { deadlines: "tock", chats: "murmur", money: "penny", ideas: "mote", unsorted: "mote" };
const NOUNS = ["sign-up", "booking", "appointment", "receipt", "ticket", "invoice", "flyer", "reservation", "schedule"];

export type Item = {
  id: string;
  section: Section;
  keeper: KeeperId;
  roomName: string;
  title: string;
  imageUrl: string | null;
  date: Card["date"];
  line: string | null;
  takenAt: number;
  reminder: Card["reminder"];
  actions: Card["actions"];
  handled: boolean;
};

export const clockLabel = (ms: number, tz: number) => {
  const d = new Date(ms - tz * 60000);
  const h = d.getUTCHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function dateLabel(when: string): string {
  const p = parseWhen(when, 0);
  if (!p) return when;
  const base = `${DAYS[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()]}, ${MONTHS[p.mo - 1]} ${p.d}`;
  if (!p.hasTime) return base;
  return `${base}, ${p.hh % 12 === 0 ? 12 : p.hh % 12}:${String(p.mm).padStart(2, "0")} ${p.hh < 12 ? "AM" : "PM"}`;
}

// "Mon 9:00 AM" inside the next week, "Nov 30, 9:00 AM" after that.
export function whenLabel(ms: number, now: number, tz: number): string {
  const d = new Date(ms - tz * 60000);
  const days = (Date.parse(localDay(ms, tz)) - Date.parse(localDay(now, tz))) / 86400000;
  const day = days < 7 ? DAYS[d.getUTCDay()] : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()},`;
  return `${day} ${clockLabel(ms, tz)}`;
}

export const remindLabel = (item: Item, now: number, tz: number): string | null =>
  item.date ? whenLabel(computeDueAt(item.date.when, now, tz), now, tz) : null;

function noun(title: string): string | null {
  const last = title.trim().split(/\s+/).pop()?.toLowerCase() ?? "";
  return NOUNS.includes(last) ? last : null;
}

const noBreak = (s: string) => s.replace(/-/g, "\u2060-\u2060");

// Fixed templates, never model-written. The noun comes from the title's last word.
export function headline(item: Item, now: number, tz: number): { name: string; rest: string } {
  const name = KEEPER_NAME[item.keeper];
  const n = noun(item.title);
  const when = item.date ? parseWhen(item.date.when, tz) : null;
  const dow = when ? DAYS_LONG[new Date(Date.UTC(when.y, when.mo - 1, when.d)).getUTCDay()] : null;
  const days = when ? Math.round((Date.parse(when.day) - Date.parse(localDay(now, tz))) / 86400000) : null;
  const closes = days === null ? "" : days === 0 ? "today" : days === 1 ? "tomorrow" : days < 7 ? dow! : `${MONTHS[when!.mo - 1]} ${when!.d}`;
  if (item.section === "missed") return { name, rest: `reminded you about ${n ? `the ${n}` : "this one"}.` };
  if (item.section === "justIn") {
    if (n && closes) return { name, rest: noBreak(`filed a ${n} that closes ${closes}.`) };
    return { name, rest: closes ? `filed one that's due ${closes}.` : `filed a new one in ${item.roomName}.` };
  }
  if (item.section === "thin") return { name, rest: "kept one worth another look." };
  if (n && dow && days !== null && days < 7) return { name, rest: noBreak(`found your ${dow} ${n}.`) };
  if (closes) return { name, rest: `has one for ${closes}.` };
  return { name, rest: "has one for you." };
}

const weekdayOf = (when: string) => {
  const p = parseWhen(when, 0);
  return p ? DAYS_LONG[new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay()] : "soon";
};

// The keeper's line, from the kit's line bank and the card's own title and date. Null when the bank has nothing true to say.
function lineOf(c: Card, section: Section, keeper: KeeperId): string | null {
  const weekday = c.date ? weekdayOf(c.date.when) : null;
  if (section === "missed") return psstLine("system.reminder.fired");
  if (keeper === "tock" && weekday) return c.reminder?.state === "scheduled" ? psstLine("tock.handful.set", { weekday }) : psstLine("tock.handful.dated", { title: c.title, weekday });
  if (keeper === "murmur") return psstLine("murmur.handful", { title: c.title });
  if (section === "thin" && keeper === "mote") return psstLine("mote.thinday", { title: c.title, date: `${MONTHS[new Date(c.takenAt).getMonth()]} ${new Date(c.takenAt).getDate()}` });
  return null;
}

export type LineFallback = (title: string) => string | null;

export function toItem(c: Card, section: Section, fallback?: LineFallback): Item {
  const keeper = ROOM_KEEPER[c.category] ?? "mote";
  return {
    id: c._id,
    section,
    keeper,
    roomName: ROOM_NAMES[c.category] ?? "Unsorted",
    title: c.title,
    imageUrl: c.imageUrl,
    date: c.date,
    line: lineOf(c, section, keeper) ?? fallback?.(c.title) ?? null,
    takenAt: c.takenAt,
    reminder: c.reminder,
    actions: c.actions,
    handled: c.reminder?.state === "scheduled",
  };
}

export function buildItems(today: TodayData, fallback?: LineFallback): Item[] {
  const seen = new Set<string>();
  const out: Item[] = [];
  const add = (cards: Card[], section: Section) => {
    for (const c of cards) {
      if (seen.has(c._id)) continue;
      seen.add(c._id);
      out.push(toItem(c, section, fallback));
    }
  };
  add(today.justIn, "justIn");
  add(today.missed, "missed");
  add(today.handful, "handful");
  if (today.thin) add([today.thin], "thin");
  return out;
}

export type Screen =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "reading"; pending: number; rows: Item[] }
  | { kind: "focus"; focus: Item; position: number; total: number; rows: Item[] }
  | { kind: "done"; rows: Item[] };

export function buildScreen(today: TodayData | undefined, skipped: ReadonlySet<string>, fallback?: LineFallback): { screen: Screen; items: Item[] } {
  if (!today) return { screen: { kind: "loading" }, items: [] };
  const items = buildItems(today, fallback).filter((i) => !skipped.has(i.id));
  const focus = items.find((i) => !i.handled && i.section !== "thin") ?? items.find((i) => !i.handled);
  const waitingJustIn = !items.some((i) => i.section === "justIn" && !i.handled);
  if (today.reading.pending > 0 && waitingJustIn) return { screen: { kind: "reading", pending: today.reading.pending, rows: items.slice(0, 3) }, items };
  if (focus) {
    const rows = items.filter((i) => i !== focus).slice(0, 2);
    return { screen: { kind: "focus", focus, position: items.indexOf(focus) + 1, total: items.length, rows }, items };
  }
  if (items.length === 0 && today.reading.total === 0) return { screen: { kind: "empty" }, items };
  return { screen: { kind: "done", rows: items.slice(0, 3) }, items };
}

export function captionFor(screen: Extract<Screen, { kind: "focus" }>): string {
  const { focus, position, total } = screen;
  return focus.section === "justIn" ? `Just in · ${position} of ${total} today` : `Today's handful · ${position} of ${total}`;
}

export function actionsFor(item: Item, now: number, tz: number) {
  const label = remindLabel(item, now, tz);
  const doneLabel = item.keeper === "penny" ? "Already paid" : noun(item.title) === "sign-up" ? "Already signed up" : "Already done";
  const sameDay = item.date ? localDay(computeDueAt(item.date.when, now, tz), tz) === item.date.when.slice(0, 10) : false;
  const when = sameDay ? "an hour before" : "the day before";
  const closes = item.section === "justIn" && noun(item.title) === "sign-up" ? " it closes" : "";
  const tail = item.keeper === "penny" ? "Psst never pays or moves money." : "You can snooze or turn reminders off.";
  if (item.actions.primary === "remind" && label)
    return {
      primary: `Remind me ${label}`,
      primaryKind: "remind" as const,
      secondary: doneLabel,
      secondaryKind: "done" as const,
      note: `We'll remind you once, ${when}${closes}. ${tail}`,
    };
  if (item.actions.primary === "see")
    return { primary: "See it", primaryKind: "see" as const, secondary: doneLabel, secondaryKind: "done" as const, note: "Opens the screenshot. Nothing changes until you decide." };
  if (item.actions.primary === "done")
    return {
      primary: "Done",
      primaryKind: "done" as const,
      secondary: "Change reminder",
      secondaryKind: "remind" as const,
      note: item.reminder ? `Reminder set · ${whenLabel(item.reminder.dueAt, now, tz)}. Done takes it off today.` : "Done takes it off today.",
    };
  return {
    primary: `Keep in ${item.roomName}`,
    primaryKind: "keep" as const,
    secondary: "Not today",
    secondaryKind: "skip" as const,
    note: "No reminder, no second ping. It stays in its room.",
  };
}

export type ReminderRow = TodayData["reminders"][number];

// Scheduled reminders already shown as a handled handful row are not listed twice.
export const extraReminders = (today: TodayData, items: Item[]): ReminderRow[] => today.reminders.filter((r) => !items.some((i) => i.id === r.screenshotId));

export const sourceLine = (item: Item): string => {
  if (item.section === "justIn") return "Read when you opened Psst.";
  const d = new Date(item.takenAt);
  return `Saved ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

export const rowSubtitle = (item: Item, now: number, tz: number): string => {
  if (item.handled && item.reminder) return `Reminder set · ${whenLabel(item.reminder.dueAt, now, tz)}`;
  const d = new Date(item.takenAt);
  const saved = `Saved ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return item.date ? `${saved} · due ${dateLabel(item.date.when).replace(/, \d+:\d+ [AP]M$/, "")}` : saved;
};
