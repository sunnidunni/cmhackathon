export type BringInResult = { uploaded: number; failed: number; skipped: number };

export type BringInState =
  | { kind: "working" }
  | { kind: "done" }
  | { kind: "failed"; failed: number };

export function bringInState(result: BringInResult | null, error: boolean): BringInState {
  if (error) return { kind: "failed", failed: 0 };
  if (!result) return { kind: "working" };
  if (result.failed > 0) return { kind: "failed", failed: result.failed };
  return { kind: "done" };
}

export function broughtInLine(count: number): string {
  if (count === 0) return "Looking for your screenshots.";
  return count === 1 ? "1 screenshot brought in." : `${count} screenshots brought in.`;
}

export function failedLabel(failed: number): string {
  if (failed <= 0) return "Couldn't bring in your screenshots";
  return failed === 1 ? "Couldn't bring in 1 screenshot" : `Couldn't bring in ${failed} screenshots`;
}
