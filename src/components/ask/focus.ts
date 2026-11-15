const BARE = /\b(?:that|it|this)\b(?=\s*(?:[?.!,]|$|\b(?:is|was|are|were|due|for|about|mean|say|said|close|closes|start|starts|end|ends|cost|costs)\b))/i;
const ABOUT = / \(about: .*\)$/;

// A bare "that" or "it" has nothing to point at on the server, so name the item on Today's focus card.
export function withFocus(question: string, focusTitle: string | null | undefined): string {
  if (!focusTitle || ABOUT.test(question) || !BARE.test(question)) return question;
  return `${question} (about: ${focusTitle})`;
}

export const shownQuestion = (question: string): string => question.replace(ABOUT, "");
