import lines from "../../content/lines.json";

export type Room = "deadlines" | "chats" | "money" | "ideas" | "unsorted";
export const ROOM_ORDER: Room[] = ["deadlines", "chats", "money", "ideas", "unsorted"];

const ROOM_NAMES: Record<Room, string> = {
  deadlines: "Deadlines",
  chats: "Chats",
  money: "Money",
  ideas: "Ideas",
  unsorted: "Unsorted",
};
export const allScreenshotsCount = (rooms: { count: number }[]) => rooms.reduce((sum, r) => sum + r.count, 0);
export const roomName = (room: string) => ROOM_NAMES[room as Room] ?? "Unsorted";

export const EMPTY_BLURB: Record<Room, string> = {
  deadlines: "Screenshots of flyers, bookings and due dates land here.",
  chats: "Screenshots of conversations land here.",
  money: "Receipts, tickets and bills land here.",
  ideas: "Recipes, tips and quotes land here.",
  unsorted: "Anything I can't place yet waits here until you move it.",
};

type Bank = Record<string, { lines: Record<string, string> }>;

export function lineFor(lineKey: string | null | undefined): string | null {
  if (!lineKey) return null;
  const bank = lines as unknown as { rooms: Bank; unsorted: { lines: Record<string, string> } };
  for (const room of Object.values(bank.rooms)) if (room.lines[lineKey]) return room.lines[lineKey];
  return bank.unsorted.lines[lineKey] ?? null;
}

export type DateInfo = { when: string; what: string; confident: boolean };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(when: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(when);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return { y, mo, d, hh: m[4] === undefined ? null : Number(m[4]), mm: m[5] === undefined ? null : Number(m[5]), dow: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
}

export function weekday(when: string): string {
  const p = parts(when);
  return p ? DAYS[p.dow] : when;
}

export function formatWhen(when: string, confident = true): string {
  const p = parts(when);
  if (!p || !confident) return when;
  let out = `${DAYS[p.dow]}, ${MONTHS[p.mo - 1]} ${p.d}`;
  if (p.hh !== null && p.mm !== null) {
    const h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
    out += `, ${h12}:${String(p.mm).padStart(2, "0")} ${p.hh < 12 ? "am" : "pm"}`;
  }
  return out;
}

export type CardActions = { primary: "remind" | "done" | "keep" | "see"; secondary: "done" | "detail" | "delete" };

export function buttonLabel(
  kind: CardActions["primary"] | CardActions["secondary"],
  date: DateInfo | null,
): string {
  switch (kind) {
    case "remind":
      return date ? `Remind ${weekday(date.when)}` : "Remind me";
    case "done":
      return "Done";
    case "keep":
      return "Keep";
    case "see":
      return "See it";
    case "detail":
      return date ? `Reminder set, ${weekday(date.when)}` : "Reminder set";
    case "delete":
      return "Delete";
  }
}

export function cardSubtitle(card: { date: DateInfo | null; takenAt: number }): string {
  if (card.date) return `${formatWhen(card.date.when, card.date.confident)}, ${card.date.what}`;
  const d = new Date(card.takenAt);
  return `Saved ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function reminderCaption(reminder: { state: "scheduled" | "sent" | "dismissed" } | null): string {
  if (reminder?.state === "scheduled") return "Reminder set";
  if (reminder?.state === "sent") return "Reminder sent";
  return "Remind me";
}

export const nudgeSample = (title?: string) => `Psst: your ${title ?? "reminder"} is due tomorrow. Want to see it?`;

export const TOAST_DELETED = "Deleted from Psst. The photo stays on your phone";
