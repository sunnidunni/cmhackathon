export const FREE_IMPORT_LIMIT = 50;

// candidates are newest first. Free users only ever see the latest 50 in the library;
// anything already known is skipped.
export function pickToImport(
  candidateIds: string[],
  knownIds: Set<string>,
  plan: "free" | "paid",
): string[] {
  const window = plan === "paid" ? candidateIds : candidateIds.slice(0, FREE_IMPORT_LIMIT);
  return window.filter((id) => !knownIds.has(id));
}
