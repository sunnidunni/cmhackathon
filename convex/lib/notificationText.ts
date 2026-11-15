import { cleanTitle } from "./titles";
import { clockPhrase, dayPhrase } from "./time";

// Hand-templated, one voice (Psst). Money is plain with no question, and shows an amount only
// when one was read from the screenshot.
export function notificationText(args: {
  title: string;
  category: string | undefined;
  when: string | null;
  at: number;
  tz: number;
  amount?: string;
}) {
  const { title, category, when, at, tz, amount } = args;
  const thing = cleanTitle(title) || "screenshot";
  if (when === null) return `Psst: your ${thing} is waiting. Want to see it?`;
  const day = dayPhrase(when, at, tz);
  const clock = day === "today" ? clockPhrase(when, tz) : null;
  const due = clock ? `today at ${clock}` : day;
  if (category === "money") return `Psst: your ${thing} is due ${due}.${amount ? ` ${amount}.` : ""}`;
  return `Psst: your ${thing} is due ${due}. Want to see it?`;
}
