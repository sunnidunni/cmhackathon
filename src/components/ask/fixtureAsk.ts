import { assetUri } from "@/components/remind/fixture";
import { DEMO_SHOTS, type DemoShot } from "@/lib/fixtures";
import type { AskResult, Shots } from "./AnswerBlock";
import { isSamBookQuestion } from "./focus";
import { answerFrom, suggestionsFrom, type SuggestionRow } from "./suggestions";

// Sample-data side of the Ask chips: suggestions and answers drawn from the demo screenshots, never from Convex.
const rows: SuggestionRow[] = DEMO_SHOTS.filter((s) => s.id !== "01-pottery-flyer").map((s) => ({ ...s, readAt: Date.parse(s.savedAt) }));

export const FIXTURE_SUGGESTIONS = suggestionsFrom(rows);

function detail(shot: DemoShot) {
  return {
    _id: shot.id,
    status: "ready",
    title: shot.title,
    summary: shot.summary,
    reason: shot.reason,
    amount: shot.amount ?? null,
    category: shot.room,
    userMoved: false,
    lineKey: null,
    imageUrl: assetUri(shot.image),
    importance: shot.importance,
    takenAt: Date.parse(shot.savedAt),
    error: null,
    dates: shot.dates.map((d) => ({ ...d, reminder: null })),
  };
}

// A chip question answers from its own screenshot; the pottery flyer is handled by the caller.
export function fixtureAnswer(question: string): { result: AskResult; shots: Shots } | null {
  if (isSamBookQuestion(question)) {
    const book = DEMO_SHOTS.find((s) => s.id === "11-book-dm");
    if (!book) return null;
    return {
      result: { answer: book.summary.replace(/^Sam recommends/, "Sam recommended"), found: true, sources: [{ screenshotId: book.id as never, title: book.title, imageUrl: assetUri(book.image) }] },
      shots: { [book.id]: detail(book) } as unknown as Shots,
    };
  }
  const hit = answerFrom(question, rows);
  const shot = hit && DEMO_SHOTS.find((s) => s.id === hit.screenshotId);
  if (!hit || !shot) return null;
  return {
    result: { answer: hit.answer, found: true, sources: [{ screenshotId: shot.id as never, title: shot.title, imageUrl: assetUri(shot.image) }] },
    shots: { [shot.id]: detail(shot) } as unknown as Shots,
  };
}
