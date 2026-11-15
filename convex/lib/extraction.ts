import { CATEGORIES, PLAYFUL_KEYS, type Category } from "./lines";
import { cleanTitle } from "./titles";

export type ExtractedDate = { when: string; what: string; confident: boolean };
export type Extraction = {
  title: string;
  amount: string;
  text: string;
  summary: string;
  category: Category;
  reason: string;
  dates: ExtractedDate[];
  importance: number;
  reactionKey: string;
};

const FULL_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;

export function buildPrompt(todayIso: string) {
  const keys = (Object.keys(PLAYFUL_KEYS) as Category[])
    .map((c) => `${c}: ${PLAYFUL_KEYS[c].join(", ")}`)
    .join("\n");
  return `You read one phone screenshot and file it. Today's date is ${todayIso}. Return JSON only, matching the schema.
- title: a name for the thing, five words or fewer, such as "Brightside Power bill" or "Harvest Lantern Night". No price, no date, no time, and never the word "due".
- amount: the one main amount of money shown (for example "$142.37", the amount due or the price), exactly as written, or an empty string when there is none.
- text: all readable text in the image, in reading order.
- summary: one or two plain sentences.
- category: deadlines (flyers, invitations, events, appointments, sign-ups, anything with a due date that is not a payment), chats (any screenshot of a messaging conversation, even when it mentions a plan, a date or a time), money (bills, prices, payments, receipts, tickets, flights), ideas (recipes, quotes, articles, AI answers, things to try or remember), or unsorted.
- reason: one short sentence on why you chose that category.
- dates: every date or time visibly shown. when is ISO 8601 (YYYY-MM-DD, or YYYY-MM-DDTHH:MM when a time is shown). what is a short label for the date, such as "RSVP deadline", "payment due", "event starts", "appointment", "flight departs", or "deal ends". Never guess a date, time, or price: only return what is visibly in the image. If the year or any other part is missing, write only what is visible (for example 11-21) and set confident to false. Use an empty array when there are no dates. Only return dates the user might need to act on or attend: skip publication dates, billing periods, order dates and other dates already in the past. The phone's own status bar (clock such as 9:41, battery, signal, carrier) is never a date; ignore it. A bare time with no day is not a date either.
- importance: 1 to 5. Use 4 or 5 only for deadlines, payments due, codes or passwords the user will need, and anything with a date within 14 days of today. A booking, ticket or flight more than 14 days away is 3. A product, price or sale deal is 3 (a payment actually due is 4 or 5). A conversation is 1 or 2. Saved ideas, recipes, quotes and articles are 1.
- If the image is not readable or does not fit a room, set category to unsorted and importance to 1.
- reactionKey: pick exactly one key from the list for the category you chose. Do not write your own line.
${keys}`;
}

export const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "amount", "text", "summary", "category", "reason", "dates", "importance", "reactionKey"],
  properties: {
    title: { type: "string" },
    amount: { type: "string" },
    text: { type: "string" },
    summary: { type: "string" },
    category: { type: "string", enum: [...CATEGORIES] },
    reason: { type: "string" },
    dates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["when", "what", "confident"],
        properties: {
          when: { type: "string" },
          what: { type: "string" },
          confident: { type: "boolean" },
        },
      },
    },
    importance: { type: "integer" },
    reactionKey: { type: "string" },
  },
};

const str = (value: unknown) => (typeof value === "string" ? value : "");

// Turns a model reply into a safe Extraction. Throws only when the reply is not a JSON object.
// A bad category becomes unsorted, a bad reactionKey becomes the first playful key of the room,
// and any date that is not a full ISO date is marked not confident.
const PARTIAL_DATE = /^(\d{4}-)?\d{2}-\d{2}(T\d{1,2}:\d{2}(:\d{2})?)?$/;
const PHONE_CHROME = /status bar|battery|signal|carrier|wi-?fi|phone clock|lock screen/i;

function hashPick(keys: string[], seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return keys[(h >>> 0) % keys.length];
}

export function parseExtraction(raw: string, screenshotId?: string): Extraction {
  const json = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Model reply was not valid JSON");
  }
  if (typeof data !== "object" || data === null || Array.isArray(data))
    throw new Error("Model reply was not a JSON object");
  const o = data as Record<string, unknown>;

  const category: Category = CATEGORIES.includes(o.category as Category)
    ? (o.category as Category)
    : "unsorted";
  const rawImportance = Number(o.importance);
  const clamped = Number.isFinite(rawImportance)
    ? Math.min(5, Math.max(1, Math.round(rawImportance)))
    : 1;
  const importance = category === "unsorted" ? 1 : category === "chats" ? Math.min(2, clamped) : clamped;
  const reactionKey = screenshotId
    ? hashPick(PLAYFUL_KEYS[category], screenshotId)
    : PLAYFUL_KEYS[category].includes(str(o.reactionKey))
      ? str(o.reactionKey)
      : PLAYFUL_KEYS[category][0];
  const dates: ExtractedDate[] = (Array.isArray(o.dates) ? o.dates : []).flatMap((d) => {
    if (typeof d !== "object" || d === null) return [];
    const item = d as Record<string, unknown>;
    const when = str(item.when).trim();
    if (!PARTIAL_DATE.test(when) || PHONE_CHROME.test(str(item.what))) return [];
    return [
      {
        when,
        what: str(item.what),
        confident: item.confident === true && FULL_DATE.test(when),
      },
    ];
  });

  const text = str(o.text);
  const amount = str(o.amount).trim();
  return {
    title: cleanTitle(str(o.title)) || "Untitled screenshot",
    amount: /^\$\d[\d,]*(\.\d{2})?$/.test(amount) && text.includes(amount) ? amount : "",
    text,
    summary: str(o.summary),
    category,
    reason: str(o.reason),
    dates,
    importance,
    reactionKey,
  };
}
