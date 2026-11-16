import { whenLabel } from "../remind/plan";

type NextShot = { _id: string; title: string | null; amount: string | null; dates: { when: string; what: string; confident: boolean }[] };
export type NextQuestion = { question: string; answer?: string };

const MAX = 3;

// Demo screenshots carry facts the extractor does not store (place, price), so their follow-ups and answers come from the flyer text.
const FIXTURE_NEXT: Record<string, NextQuestion[]> = {
  "01-pottery-flyer": [
    { question: "Where is the class?", answer: "18 Alder Lane, at Clay Harbor Studio." },
    { question: "How much is it?", answer: "$42. All materials are included." },
    { question: "When is the class?", answer: `Beginner Pottery Night ${whenLabel("2026-11-27T18:30:00")}.` },
  ],
};

// Follow-up questions about the answer's own screenshot: another date on it, its price, then what else it says.
export function askNext(shot: NextShot, answeredWhen: string | null, fixtures: boolean): NextQuestion[] {
  const fixture = fixtures ? FIXTURE_NEXT[shot._id] : undefined;
  if (fixture) return fixture.slice(0, MAX);
  const out: NextQuestion[] = [];
  for (const d of shot.dates) {
    if (d.confident && d.when !== answeredWhen && d.what.trim()) out.push({ question: `When is ${d.what.trim()}?` });
  }
  if ((shot.amount ?? "").trim()) out.push({ question: "How much is it?" });
  out.push({ question: "What else does it say?" });
  const seen = new Set<string>();
  return out.filter((q) => !seen.has(q.question.toLowerCase()) && seen.add(q.question.toLowerCase())).slice(0, MAX);
}

// The sample answer for a follow-up asked about a demo screenshot, or null.
export function fixtureNextAnswer(question: string, shotId: string): string | null {
  const q = question.trim().toLowerCase();
  return FIXTURE_NEXT[shotId]?.find((n) => n.question.toLowerCase() === q)?.answer ?? null;
}

// "The day before it closes" only when the date is a closing; any other date gets the plain line.
export function reminderNote(what: string): string {
  return /\bclos(e|es|ing)\b/i.test(what) ? "The day before it closes. One reminder. Change it or turn it off later." : "The day before. One reminder. Change it or turn it off later.";
}
