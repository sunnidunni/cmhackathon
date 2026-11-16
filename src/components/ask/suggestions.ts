import { whenLabel } from "../remind/plan";

// Client port of #63's convex/lib/suggestions.ts: questions come from fixed templates over fields already read, so the answer is in the data.
export type SuggestionRow = {
  id: string;
  title?: string;
  amount?: string;
  importance?: number;
  readAt?: number;
  dates?: { when: string; what: string; confident: boolean }[];
};
export type Suggestion = { question: string; screenshotId: string };

export const POTTERY_QUESTION = "When does the pottery sign-up close?";
const MAX = 3;
const MAX_TITLE = 40;

// "Assignment due" reads as "the assignment due"; titles with another capital ("Juniper Vale concert") keep their case.
function noun(title: string) {
  return /^[A-Z][^A-Z]*$/.test(title) ? title[0]!.toLowerCase() + title.slice(1) : title;
}

function template(r: SuggestionRow): { question: string; answer: string } | null {
  const title = (r.title ?? "").trim();
  if (title === "" || title.length > MAX_TITLE || /[\d$€£]/.test(title)) return null;
  const date = (r.dates ?? []).find((d) => d.confident);
  if (date) return { question: `When is the ${noun(title)}?`, answer: `${date.what} ${whenLabel(date.when)}.` };
  const amount = (r.amount ?? "").trim();
  if (amount) return { question: `How much is the ${noun(title)}?`, answer: `${title}: ${amount}.` };
  return null;
}

// Titles with digits or a currency sign are skipped so a question never carries a date or price.
export function suggestionsFrom(rows: SuggestionRow[]): Suggestion[] {
  const ranked = [...rows].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0) || (b.readAt ?? 0) - (a.readAt ?? 0));
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const r of ranked) {
    const question = template(r)?.question;
    if (!question || seen.has(question.toLowerCase())) continue;
    seen.add(question.toLowerCase());
    out.push({ question, screenshotId: r.id });
  }
  return out;
}

// The answer a suggested question was built from, or null when the question is not one of ours.
export function answerFrom(question: string, rows: SuggestionRow[]): { answer: string; screenshotId: string } | null {
  const q = question.trim().toLowerCase();
  for (const r of rows) {
    const t = template(r);
    if (t && t.question.toLowerCase() === q) return { answer: t.answer, screenshotId: r.id };
  }
  return null;
}

// The pottery question stays first; already-asked questions drop out; nothing shows while typing or answering.
export function visibleChips(list: Suggestion[], asked: string[], input: string, answering: boolean): Suggestion[] {
  if (input.length > 0 || answering) return [];
  const seen = new Set(asked.map((q) => q.trim().toLowerCase()));
  const out: Suggestion[] = [];
  for (const item of [{ question: POTTERY_QUESTION, screenshotId: "pottery" }, ...list]) {
    const question = item.question.trim();
    const key = question.toLowerCase();
    if (!question || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, question });
  }
  return out.slice(0, MAX);
}
