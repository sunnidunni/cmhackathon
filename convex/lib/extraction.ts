import { CATEGORIES, PLAYFUL_KEYS, type Category } from "./lines";

export type ExtractedDate = { when: string; what: string; confident: boolean };
export type Extraction = {
  title: string;
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
- title: a short title (under 60 characters). Include the key amount or name when there is one.
- text: all readable text in the image, in reading order.
- summary: one or two plain sentences.
- category: deadlines (events, appointments, due dates, bookings), chats (messages and conversations), money (bills, prices, payments, receipts, tickets, flights), ideas (recipes, quotes, articles, things to try or remember), or unsorted.
- reason: one short sentence on why you chose that category.
- dates: every date or time visibly shown. when is ISO 8601 (YYYY-MM-DD, or YYYY-MM-DDTHH:MM when a time is shown). what says what the date is for. Never guess a date, time, or price: only return what is visibly in the image. If the year or any other part is missing, write only what is visible (for example 11-21) and set confident to false. Use an empty array when there are no dates.
- importance: 1 to 5. Use 4 or 5 only for deadlines, payments due, bookings, codes or passwords the user will need, and anything with a date in the next two weeks. Everything else is 1 to 3.
- If the image is not readable or does not fit a room, set category to unsorted and importance to 1.
- reactionKey: pick exactly one key from the list for the category you chose. Do not write your own line.
${keys}`;
}

export const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "text", "summary", "category", "reason", "dates", "importance", "reactionKey"],
  properties: {
    title: { type: "string" },
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
export function parseExtraction(raw: string): Extraction {
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
  const importance =
    category === "unsorted"
      ? 1
      : Number.isFinite(rawImportance)
        ? Math.min(5, Math.max(1, Math.round(rawImportance)))
        : 1;
  const reactionKey = PLAYFUL_KEYS[category].includes(str(o.reactionKey))
    ? str(o.reactionKey)
    : PLAYFUL_KEYS[category][0];
  const dates: ExtractedDate[] = (Array.isArray(o.dates) ? o.dates : []).flatMap((d) => {
    if (typeof d !== "object" || d === null) return [];
    const item = d as Record<string, unknown>;
    const when = str(item.when).trim();
    if (when === "") return [];
    return [
      {
        when,
        what: str(item.what),
        confident: item.confident === true && FULL_DATE.test(when),
      },
    ];
  });

  return {
    title: str(o.title).trim() || "Untitled screenshot",
    text: str(o.text),
    summary: str(o.summary),
    category,
    reason: str(o.reason),
    dates,
    importance,
    reactionKey,
  };
}
