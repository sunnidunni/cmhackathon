import { cleanTitle } from "./titles";
import { clockPhrase } from "./time";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// One short text for the Psst line, built only from stored fields. The date is written out as stored,
// never relative to today, so nothing is guessed. No stored date means no date in the text.
export function lineText({ title, whenKey, amount }: { title: string; whenKey: string | undefined; amount?: string }) {
  const thing = cleanTitle(title) || "that screenshot";
  const m = whenKey?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!whenKey || !m) return `Psst. You asked me to remind you about ${thing}.`;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const day = `${DAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]}, ${MONTHS[mo - 1]} ${d}`;
  const clock = clockPhrase(whenKey, 0);
  const money = (amount ?? "").trim();
  return `Psst. ${thing} is ${day}${clock ? ` at ${clock}` : ""}.${money ? ` ${money}.` : ""}`;
}
