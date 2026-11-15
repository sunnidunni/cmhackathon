import { cleanTitle } from "./titles";
import { clockPhrase, dayPhrase } from "./time";

type Kind = "deal" | "due" | "event";

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

// The verb comes from the date's label, never from the model writing a sentence.
function kindOf(what: string | undefined, thing: string): Kind {
  if (!what) return "due";
  if (/\b(deal|offer|sale|discount|promo)\b/i.test(what) && /\b(ends?|expires?|over)\b/i.test(what)) return "deal";
  if (/\b(due|deadline|rsvp|sign-?up|register|payment|pay|closes?|renew)/i.test(what)) return "due";
  if (/\b(event|appointment|flight|departs?|departure|arriv|starts?|begins?|show|concert|party|meeting|reservation|booking|dinner|class|movie|hike|check-?in)/i.test(what)) return "event";
  const a = new Set(words(what));
  const common = words(thing).filter((w) => a.has(w)).length;
  return a.size > 0 && common >= Math.min(2, a.size) ? "event" : "due";
}

// Hand-templated, one voice (Psst). Money is plain with no question, and shows an amount only
// when one was read from the screenshot.
export function notificationText(args: {
  title: string;
  category: string | undefined;
  when: string | null;
  at: number;
  tz: number;
  amount?: string;
  what?: string;
}) {
  const { title, category, when, at, tz, amount, what } = args;
  const thing = cleanTitle(title) || "screenshot";
  if (when === null) return `Psst: your ${thing} is waiting. Want to see it?`;
  const day = dayPhrase(when, at, tz);
  const clock = clockPhrase(when, tz);
  const money = category === "money";
  const tail = money ? (amount ? ` ${amount}.` : "") : " Want to see it?";
  const kind = kindOf(what, thing);
  if (kind === "deal") return `Psst: the ${thing} deal ends ${day}.${tail}`;
  if (kind === "event") return `Psst: ${thing} is ${day}${clock ? ` at ${clock}` : ""}.${tail}`;
  const subject = what && /rsvp/i.test(what) && !/rsvp/i.test(thing) ? `${thing} RSVP` : thing;
  return `Psst: your ${subject} is due ${day === "today" && clock ? `today at ${clock}` : day}.${tail}`;
}
