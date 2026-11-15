import { clockPhrase, dayPhrase } from "./time";

// Hand-templated, one voice (Psst). Money is plain with no question.
export function notificationText(args: {
  title: string;
  category: string | undefined;
  when: string | null;
  at: number;
  tz: number;
}) {
  const { title, category, when, at, tz } = args;
  const thing = title.replace(/[.!?]+$/, "");
  if (when === null) return `Psst: your ${thing} is waiting. Want to see it?`;
  const day = dayPhrase(when, at, tz);
  const clock = day === "today" ? clockPhrase(when, tz) : null;
  const due = clock ? `today at ${clock}` : day;
  if (category === "money") return `Psst: your ${thing} is due ${due}.`;
  return `Psst: your ${thing} is due ${due}. Want to see it?`;
}
