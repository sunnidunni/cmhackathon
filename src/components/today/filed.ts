import { parseWhen } from "../../../convex/lib/time";
import { psstLine } from "../../design/psst/lines";
import type { Item } from "./model";

const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CLOSES = /\b(sign-?up|closes?|due|deadline|register|registration)\b/i;

// Just-in items the person has not been told about yet. The first call seeds the seen set, so opening Today never toasts.
export function freshJustIn(items: Item[], seen: ReadonlySet<string>): Item[] {
  return items.filter((i) => i.section === "justIn" && !i.handled && !seen.has(i.id));
}

// The spec's one-line toast. A predicate ("closes", "is on", "is due") only appears when the screenshot has a verified date.
export function filedLine(item: Item): string {
  if (item.roomName === "Unsorted") return psstLine("system.filed.unsorted");
  if (item.keeper === "mote") return psstLine("mote.filed", { title: item.title });
  const when = item.date ? parseWhen(item.date.when, 0) : null;
  if (!item.date || !when) return psstLine("system.filed.room", { room: item.roomName });
  const weekday = DAYS_LONG[new Date(Date.UTC(when.y, when.mo - 1, when.d)).getUTCDay()]!;
  if (item.keeper === "penny") return psstLine("penny.filed", { title: item.title, date: `${MONTHS[when.mo - 1]} ${when.d}` });
  if (item.keeper === "murmur") return psstLine("murmur.filed", { title: item.title, weekday });
  return psstLine(CLOSES.test(`${item.title} ${item.date.what}`) ? "tock.filed" : "tock.filed.on", { title: item.title, weekday });
}
