export type InsightShot = { _id: string; takenAt: number; category: string; title: string };

export type Insight = { id: "total" | "room" | "weekday" | "day" | "oldest" | "todos" | "reminders"; text: string; shotId?: string };

type Input = { items: InsightShot[]; now: number; tzOffsetMinutes: number; openTodos: number; reminders: number };

const DAY = 86400000;
const MIN_SHOTS = 5;
const ROOM_ORDER = ["deadlines", "chats", "money", "ideas", "unsorted"];
const ROOM_NAMES: Record<string, string> = { deadlines: "Deadlines", chats: "Chats", money: "Money", ideas: "Ideas", unsorted: "Unsorted" };
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const localDay = (ts: number, tzOffsetMinutes: number) => Math.floor((ts - tzOffsetMinutes * 60000) / DAY);
const weekdayOf = (day: number) => (((day + 4) % 7) + 7) % 7;
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function computeInsights({ items, now, tzOffsetMinutes, openTodos, reminders }: Input): Insight[] {
  if (items.length < MIN_SHOTS) return [];
  const out: Insight[] = [];
  const total = items.length;
  const today = localDay(now, tzOffsetMinutes);
  const days = items.map((s) => localDay(s.takenAt, tzOffsetMinutes));

  const lastWeek = days.filter((d) => d >= today - 6 && d <= today).length;
  out.push({ id: "total", text: `${total} screenshots in all, ${lastWeek} in the last 7 days.` });

  const byRoom = new Map<string, number>();
  for (const s of items) byRoom.set(s.category, (byRoom.get(s.category) ?? 0) + 1);
  const rooms = [...byRoom.entries()].sort((a, b) => b[1] - a[1] || ROOM_ORDER.indexOf(a[0]) - ROOM_ORDER.indexOf(b[0]));
  const [room, roomCount] = rooms[0];
  out.push({ id: "room", text: `${ROOM_NAMES[room] ?? "Unsorted"} is your biggest room: ${roomCount} of ${total}, ${Math.round((roomCount / total) * 100)}%.` });

  const byWeekday = new Array<number>(7).fill(0);
  const byDay = new Map<number, number>();
  for (const d of days) {
    byWeekday[weekdayOf(d)] += 1;
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const topWeekday = WEEKDAY_ORDER.reduce((best, w) => (byWeekday[w] > byWeekday[best] ? w : best), WEEKDAY_ORDER[0]);
  out.push({ id: "weekday", text: `You screenshot most on ${WEEKDAYS[topWeekday]}s: ${byWeekday[topWeekday]} of ${total}.` });

  const [topDay, topDayCount] = [...byDay.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
  if (topDayCount > 1) {
    const date = new Date(topDay * DAY);
    out.push({
      id: "day",
      text: `Your busiest day was ${WEEKDAYS[weekdayOf(topDay)].slice(0, 3)}, ${MONTHS[date.getUTCMonth()].slice(0, 3)} ${date.getUTCDate()}: ${topDayCount} screenshots.`,
    });
  }

  const oldest = items.reduce((a, b) => (b.takenAt < a.takenAt ? b : a));
  const oldestDate = new Date(localDay(oldest.takenAt, tzOffsetMinutes) * DAY);
  const nowYear = new Date(today * DAY).getUTCFullYear();
  const since = oldestDate.getUTCFullYear() === nowYear ? MONTHS[oldestDate.getUTCMonth()] : `${MONTHS[oldestDate.getUTCMonth()]} ${oldestDate.getUTCFullYear()}`;
  out.push({ id: "oldest", text: `You've had this one since ${since}${oldest.title ? `: ${oldest.title}` : ""}.`, shotId: oldest._id });

  if (openTodos > 0) out.push({ id: "todos", text: `${openTodos} ${plural(openTodos, "thing", "things")} to do came out of your screenshots.` });
  if (reminders > 0) out.push({ id: "reminders", text: `${reminders} ${plural(reminders, "reminder is", "reminders are")} set.` });
  return out;
}
