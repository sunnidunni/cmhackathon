export type Suggestion = { question: string; screenshotId: string };

export function visibleChips(list: Suggestion[] | undefined, input: string, answering: boolean): Suggestion[] {
  if (!list || input.length > 0 || answering) return [];
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const item of list) {
    const question = item.question.trim();
    if (!question || seen.has(question)) continue;
    seen.add(question);
    out.push({ ...item, question });
  }
  return out.slice(0, 3);
}
