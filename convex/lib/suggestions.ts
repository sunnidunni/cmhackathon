export type SuggestionRow = {
  id: string;
  status: string;
  hidden?: boolean;
  title?: string;
  amount?: string;
  importance?: number;
  readAt?: number;
  dates?: { when: string; what: string; confident: boolean }[];
};

const MAX = 3;
const MAX_TITLE = 40;

// Questions come from fixed templates over already-read fields, so the answer is in the data.
// Titles with digits or a currency sign are skipped so a question never carries a date or price.
export function suggestionsFrom<T extends SuggestionRow>(rows: T[]): { question: string; screenshotId: T["id"] }[] {
  const ranked = rows
    .filter((r) => r.status === "ready" && r.hidden !== true)
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0) || (b.readAt ?? 0) - (a.readAt ?? 0));
  const seen = new Set<string>();
  const out: { question: string; screenshotId: T["id"] }[] = [];
  for (const r of ranked) {
    const title = (r.title ?? "").trim();
    if (title === "" || title.length > MAX_TITLE || /[\d$€£]/.test(title)) continue;
    const hasDate = (r.dates ?? []).some((d) => d.confident);
    const hasAmount = (r.amount ?? "").trim() !== "";
    if (!hasDate && !hasAmount) continue;
    const question = `${hasDate ? "When" : "How much"} is the ${title}?`;
    const key = question.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ question, screenshotId: r.id });
    if (out.length === MAX) break;
  }
  return out;
}
