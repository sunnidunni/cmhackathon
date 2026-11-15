export type Progress = { total: number; read: number; failed: number; pending: number };

export function readLine(p: Progress): string {
  if (p.total === 0) return "Waiting for your first screenshot.";
  if (p.pending === 0) return `${p.read} of ${p.total} read.`;
  return `${p.read} of ${p.total} read. You can look around while I finish.`;
}

export function barFraction(p: Progress): number {
  if (p.total === 0) return 0;
  return Math.min(1, (p.read + p.failed) / p.total);
}

export function failedLabel(failed: number): string | null {
  if (failed <= 0) return null;
  return failed === 1 ? "Couldn't read 1 screenshot" : `Couldn't read ${failed} screenshots`;
}
