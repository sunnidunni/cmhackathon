import type { ActScenario, ActStep } from "./types";

export type DetectInput = {
  id: string;
  title: string;
  summary: string;
  text?: string | null;
  room: "deadlines" | "chats" | "money" | "ideas" | "unsorted";
  dates: { when: string; what: string; confident: boolean }[];
  savedAt: string | number;
  amount?: string | null;
  image?: number | string | null;
};

type Parts = { y: number; m: number; d: number; h: number | null; min: number };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MINUTE = 60000;

function parse(when: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{1,2}):(\d{2}))?/.exec(when);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3], h: m[4] === undefined ? null : +m[4], min: m[5] === undefined ? 0 : +m[5] };
}

const instant = (p: Parts) => new Date(p.y, p.m - 1, p.d, p.h ?? 23, p.min).getTime();
const fmtDay = (p: Parts) => MONTHS[p.m - 1] + " " + p.d;
const fmtClock = (h: number, min: number) => (h % 12 || 12) + ":" + String(min).padStart(2, "0") + " " + (h < 12 ? "AM" : "PM");
const fmtWhen = (p: Parts) => (p.h === null ? fmtDay(p) : fmtDay(p) + ", " + fmtClock(p.h, p.min));

function shift(p: Parts, minutes: number): Parts {
  const t = new Date(instant(p) + minutes * MINUTE);
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate(), h: t.getHours(), min: t.getMinutes() };
}

function savedLabel(savedAt: string | number, now: Date) {
  const t = new Date(savedAt);
  if (Number.isNaN(t.getTime())) return "earlier";
  if (t.toDateString() === now.toDateString()) return "today, " + fmtClock(t.getHours(), t.getMinutes());
  return MONTHS[t.getMonth()] + " " + t.getDate();
}

function clock12(raw: string): { h: number; min: number } | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s?([AP])M$/i.exec(raw.trim());
  if (!m) return null;
  return { h: (+m[1] % 12) + (m[3].toUpperCase() === "P" ? 12 : 0), min: m[2] ? +m[2] : 0 };
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase());

function senderOf(shot: DetectInput): string | null {
  const fromText = /^([A-Z][A-Za-z'’-]+(?: [A-Z][A-Za-z'’-]+)?)\.\s/.exec(shot.text ?? "");
  if (fromText) return fromText[1];
  const fromSummary = /^([A-Z][a-z]+) (?:asks|asked|wants|needs|is asking|texts|messages|wonders)\b/.exec(shot.summary);
  return fromSummary ? fromSummary[1] : null;
}

const CHAT_ASK = /\b(?:can|could|would|will) you(?: please)?(?: also)? (order|buy|bring|grab|pick up)\s+([^.?!\n]{2,60})/i;
const CHAT_PLEASE = /\bplease (order|buy|bring|grab|pick up)\s+([^.?!\n]{2,60})/i;
const SUMMARY_ASK = /\basks?(?: you)? (?:if you can |to |for you to )(order|buy|bring|grab|pick up)\s+([^.?!\n]{2,60})/i;
const ANSWERED = /\b(on it|got it|sure thing|will do|i'll|i will|yep|yes|okay|ok|no|nope|sorry|unable|not able)\b|can['’]?t|cannot|won['’]?t/i;

function chatRequest(shot: DetectInput, saved: string): ActScenario | null {
  if (shot.room !== "chats") return null;
  const text = shot.text ?? "";
  const inText = CHAT_ASK.exec(text) ?? CHAT_PLEASE.exec(text);
  const asked = inText ?? SUMMARY_ASK.exec(shot.summary);
  if (!asked) return null;
  if (inText && ANSWERED.test(text.slice(inText.index + inText[0].length))) return null;
  const who = senderOf(shot);
  if (!who) return null;
  const verb = asked[1].toLowerCase();
  const phrase = asked[2].trim().replace(/\s+/g, " ");
  const asker: Record<string, string> = { me: "them", my: "their" };
  const reply: Record<string, string> = { me: "you", my: "your", your: "my" };
  const swap = (map: Record<string, string>) => phrase.replace(/\b(me|my|your)\b/gi, (w) => map[w.toLowerCase()] ?? w);
  const body = "Yes, I can " + verb + " " + swap(reply) + ".";
  const steps: ActStep[] = [{ kind: "draft-message", to: who, via: "Messages", body }];
  return {
    id: "real:chat:" + shot.id,
    keeper: "murmur",
    source: { shotId: shot.id, image: shot.image ?? null, title: shot.title },
    noticed: who + " asked you to " + verb + " " + swap(asker) + ".",
    why: "From a screenshot saved " + saved + ". The message asks you to bring or buy something.",
    ready: "I wrote a reply to " + who + ". Psst can't send it yet.",
    cta: "Review the reply",
    steps,
    confirm: {
      title: "Send this to " + who + "?",
      lines: ["To: " + who + ", Messages", "\"" + body + "\""],
      button: "Send to " + who,
    },
    done: "Nothing was sent.",
  };
}

const DELAY_WORDS = /\b(delayed|delay|rescheduled|pushed back|now (?:departs|departing|boarding|leaves|leaving|arrives|arriving))\b/i;
const TRAVEL_WORDS = /\b(flight|train|bus|ferry|departure|departs|boarding|gate|airline|arrival|arrives)\b/i;
const NEW_TIME = /\bnow (?:departs|departing|boarding|leaves|leaving)(?: at)? (\d{1,2}(?::\d{2})?\s?[AP]M)/i;
const DELAY_BY = /\bdelayed(?: by)? (\d{1,3}|an?) ?(minutes?|mins?|hours?|hrs?)\b/i;
const PICKUP = /\b([A-Z][a-z]+) (?:is|will be|'s) (?:picking you up|meeting you|waiting for you|collecting you)\b/;

const NEW_DEPARTURE = /\bnew (?:departure|time|boarding)(?: time)?(?: is)?:? (\d{1,2}(?::\d{2})?\s?[AP]M)/i;
const WAS_TIME = /(?:\(was|\bwas|instead of|\bfrom) (\d{1,2}(?::\d{2})?\s?[AP]M)/i;

function travelDelay(shot: DetectInput, saved: string, now: Date): ActScenario | null {
  const hay = shot.title + ". " + shot.summary + ". " + (shot.text ?? "");
  if (!DELAY_WORDS.test(hay) || !TRAVEL_WORDS.test(hay)) return null;
  const entry = shot.dates.find((d) => d.confident && parse(d.when) !== null);
  const day = entry ? parse(entry.when) : null;
  if (!entry || !day) return null;
  let original: Parts | null = null;
  let moved: Parts | null = null;
  const fresh = NEW_DEPARTURE.exec(hay);
  const was = WAS_TIME.exec(hay);
  const freshClock = fresh ? clock12(fresh[1]) : null;
  const wasClock = was ? clock12(was[1]) : null;
  if (freshClock && wasClock) {
    moved = { ...day, h: freshClock.h, min: freshClock.min };
    original = { ...day, h: wasClock.h, min: wasClock.min };
  } else if (day.h !== null && !/\b(new|delayed|updated)\b/i.test(entry.what)) {
    original = day;
    const abs = NEW_TIME.exec(hay);
    const clock = abs ? clock12(abs[1]) : null;
    if (clock) moved = { ...day, h: clock.h, min: clock.min };
    const rel = DELAY_BY.exec(hay);
    if (!moved && rel) {
      const n = /^an?$/i.test(rel[1]) ? 1 : +rel[1];
      moved = shift(day, /^h/i.test(rel[2]) ? n * 60 : n);
    }
  }
  if (!original || !moved || instant(moved) === instant(original) || instant(moved) < now.getTime()) return null;
  const newTime = fmtWhen(moved);
  const contact = PICKUP.exec(hay)?.[1] ?? null;
  if (!contact) return null;
  const body = "Heads up, my trip is delayed. The new time is " + newTime + ".";
  return {
    id: "real:delay:" + shot.id,
    keeper: "tock",
    source: { shotId: shot.id, image: shot.image ?? null, title: shot.title },
    noticed: shot.title + ": now " + newTime + ".",
    why: "From a screenshot saved " + saved + ". It shows a delay. The new time is " + newTime + ".",
    ready: "I wrote " + contact + " the new time. Psst can't send it yet.",
    cta: "Review the message",
    steps: [{ kind: "draft-message", to: contact, via: "Messages", body }],
    confirm: {
      title: "Send this to " + contact + "?",
      lines: ["To: " + contact + ", Messages", "\"" + body + "\""],
      button: "Send to " + contact,
    },
    done: "Nothing was sent.",
  };
}

const BILL_WORDS = /\b(amount due|payment due|balance due|due (?:on |by )?(?:mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|pay by)\b/i;
const NOT_A_BILL = /\b(refund|receipt|paid in full|total paid|order confirmed|delivered)\b/i;

function bill(shot: DetectInput, saved: string, now: Date): ActScenario | null {
  if (shot.room !== "money") return null;
  const hay = shot.title + ". " + shot.summary + ". " + (shot.text ?? "");
  if (!BILL_WORDS.test(hay) || NOT_A_BILL.test(hay)) return null;
  const due = shot.dates
    .filter((d) => d.confident && /\b(due|pay)/i.test(d.what))
    .map((d) => parse(d.when))
    .find((p): p is Parts => p !== null && instant(p) >= now.getTime());
  if (!due) return null;
  const amount = shot.amount ?? /\$\d[\d,]*(?:\.\d{2})?/.exec(shot.summary)?.[0] ?? null;
  const billerRaw =
    /^([A-Z][A-Z&' -]{3,40})\./.exec(shot.text ?? "")?.[1] ??
    /^([A-Z][\w&']*(?: [A-Z][\w&']*){0,3}) (?:shows|says|has|lists|sent|reports)\b/.exec(shot.summary)?.[1] ??
    shot.title;
  const biller = billerRaw === billerRaw.toUpperCase() ? titleCase(billerRaw) : billerRaw;
  const account = /\bAccount\s+([A-Z0-9-]{3,})/.exec(shot.text ?? "")?.[1];
  const dueLabel = fmtDay(due);
  const to = biller + " billing";
  const subject = "Question about my bill" + (account ? " (account " + account + ")" : "");
  const body = "Hi, I'm checking my bill" + (amount ? " of " + amount : "") + " due " + dueLabel + ". Could you confirm the amount and the ways to pay? Thank you.";
  const steps: ActStep[] = [{ kind: "email-draft", to, subject, body }];
  return {
    id: "real:bill:" + shot.id,
    keeper: "penny",
    source: { shotId: shot.id, image: shot.image ?? null, title: shot.title },
    noticed: biller + (amount ? ", " + amount + "," : "") + " is due " + dueLabel + ".",
    why: "From a screenshot saved " + saved + ". It shows a bill with a due date still ahead.",
    ready: "I wrote a note to " + biller + ". Psst can't send it yet, and I won't pay it.",
    cta: "Review the note",
    steps,
    confirm: {
      title: "Send this to " + biller + "?",
      lines: ["To: " + to + ", email", "Subject: " + subject, "\"" + body + "\""],
      button: "Send note to " + biller,
    },
    done: "Nothing was sent.",
  };
}

const EVENT_WORDS = /\b(ticket|admit one|boarding pass|boarding|appointment|reservation|doors|booked|confirmed)\b/i;
const DEADLINE_ONLY = /\b(sign-?up|registration|closes|due)\b/i;
const VENUE = /\b([A-Z][a-z]+ (?:Hall|Theater|Theatre|Arena|Stadium|Club|Center|Centre))\b/;
const ADDRESS = /\b(\d{1,5} [A-Z][a-z]+ (?:Street|St|Avenue|Ave|Lane|Road|Rd|Boulevard|Blvd|Way|Drive|Dr))\b/;
const GATE = /\b(Gate [A-Z]?\d{1,3}[A-Z]?)\b/;
const AT_PLACE = /\bat ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/;

function calendar(shot: DetectInput, saved: string, now: Date): ActScenario | null {
  const hay = shot.title + ". " + shot.summary + ". " + (shot.text ?? "");
  if (!EVENT_WORDS.test(hay)) return null;
  const event = shot.dates.find((d) => {
    const p = d.confident ? parse(d.when) : null;
    return p !== null && p.h !== null && instant(p) >= now.getTime() && !DEADLINE_ONLY.test(d.what);
  });
  if (!event) return null;
  const start = parse(event.when) as Parts;
  const text = shot.text ?? "";
  const isFlight = GATE.test(text) || /\bboarding\b/i.test(hay);
  const where = GATE.exec(text)?.[1] ?? VENUE.exec(text)?.[1] ?? ADDRESS.exec(text)?.[1] ?? AT_PLACE.exec(text)?.[1];
  const leave = where ? shift(start, isFlight ? -120 : -45) : null;
  const leaveBy = leave ? fmtClock(leave.h as number, leave.min) : undefined;
  const when = start.y === now.getFullYear() || start.h === null ? fmtWhen(start) : fmtDay(start) + ", " + start.y + ", " + fmtClock(start.h, start.min);
  const step: ActStep = { kind: "calendar", title: event.what, when, ...(where ? { where } : {}), ...(leaveBy ? { leaveBy } : {}) };
  return {
    id: "real:calendar:" + shot.id,
    keeper: "tock",
    source: { shotId: shot.id, image: shot.image ?? null, title: shot.title },
    noticed: event.what + " is " + when + ".",
    why: "From a screenshot saved " + saved + ". It shows a booking with a date and a time.",
    ready: leaveBy ? "I can add it to your calendar with a leave-by time." : "I can add it to your calendar.",
    cta: "Review event",
    steps: [step],
    confirm: {
      title: "Add to your calendar?",
      lines: [
        event.what,
        when,
        ...(where ? [where] : []),
        ...(leaveBy ? ["Leave by " + leaveBy + ". That is a " + (isFlight ? "2-hour" : "45-minute") + " buffer, not a route time."] : []),
      ],
      button: "Add to calendar",
    },
    done: "Nothing was added.",
  };
}

export function detect(shot: DetectInput, now: Date = new Date()): ActScenario | null {
  if (shot.room === "ideas" || shot.room === "unsorted") return null;
  const saved = savedLabel(shot.savedAt, now);
  return chatRequest(shot, saved) ?? travelDelay(shot, saved, now) ?? bill(shot, saved, now) ?? calendar(shot, saved, now);
}

export function detectFirst(inputs: DetectInput[], skip: ReadonlySet<string>, max: number, now: Date = new Date()): ActScenario[] {
  const acts: ActScenario[] = [];
  for (const input of inputs) {
    const act = detect(input, now);
    if (!act || skip.has(act.id)) continue;
    acts.push(act);
    if (acts.length === max) break;
  }
  return acts;
}
