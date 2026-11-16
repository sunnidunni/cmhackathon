const BARE = /\b(?:that|it|this)\b(?=\s*(?:[?.!,]|$|\b(?:is|was|are|were|due|for|about|mean|say|said|close|closes|start|starts|end|ends|cost|costs)\b))/i;
const ABOUT = / \(about: .*\)$/;

// A bare "that" or "it" has nothing to point at on the server, so name the item on Today's focus card.
export function withFocus(question: string, focusTitle: string | null | undefined): string {
  if (!focusTitle || ABOUT.test(question) || !BARE.test(question)) return question;
  return `${question} (about: ${focusTitle})`;
}

export const shownQuestion = (question: string): string => question.replace(ABOUT, "");

const FLYER = /pottery/i;

// With fixtures on and no real answer (offline or nothing read), the demo flyer answers pottery questions and a bare "that"
// when Today's focus is the flyer (or there is no focus to contradict it).
export function fixtureAnswerFits(question: string, focusTitle: string | null | undefined, flyerTitle: string, fixtures: boolean): boolean {
  if (!fixtures) return false;
  if (FLYER.test(question)) return true;
  return BARE.test(question) && (!focusTitle || focusTitle === flyerTitle);
}

// The on-camera demo question, matched exactly (any case, with or without the question mark).
export const isSamBookQuestion = (question: string): boolean => /^what book did sam recommend\??$/i.test(question.trim());
