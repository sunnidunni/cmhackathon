const PRICE = /\$\s?\d[\d,]*(\.\d+)?/g;
const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE = new RegExp(
  `\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b${MONTH}\\s+\\d{1,2}(?:,?\\s+\\d{4})?\\b|\\b\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?\\b`,
  "gi",
);
const TIME = /\b\d{1,2}:\d{2}(?::\d{2})?\s?(?:am|pm)?\b/gi;
const SEPARATORS = /[\s,:;|·\-–—.]+$/;
const TRAILING_WORD = /\s+(?:due|at|on|by|for|until|before)$/i;

// A name for the thing: no price, no date or time, no trailing "due", five words at most.
export function cleanTitle(title: string): string {
  let t = title.replace(PRICE, " ").replace(DATE, " ").replace(TIME, " ").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 6; i++) {
    const next = t.replace(SEPARATORS, "").replace(TRAILING_WORD, "").replace(/^[\s,:;|·\-–—]+/, "");
    if (next === t) break;
    t = next;
  }
  if (/^(?:due|at|on|by)$/i.test(t)) return "";
  return t.split(" ").filter(Boolean).slice(0, 5).join(" ");
}
