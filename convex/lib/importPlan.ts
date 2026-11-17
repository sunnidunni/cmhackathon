export const FREE_IMPORT_LIMIT = 50;

// The app only offers a free user the newest FREE_IMPORT_LIMIT screenshots on the phone, but the app can be
// modified, and every import costs a model call. So the server also counts: a free user may import this many
// in any 24 hours. Three times the limit leaves room to delete everything and bring it in again.
export const FREE_DAILY_IMPORTS = 3 * FREE_IMPORT_LIMIT;
const DAY_MS = 24 * 60 * 60 * 1000;

// DEV_UNLIMITED_IMPORT=1 on a deployment lifts every limit for everyone. For testing only.
export const importsUnlimited = (plan: "free" | "paid") => plan === "paid" || process.env.DEV_UNLIMITED_IMPORT === "1";

// Counts one more import for a free user. allowed is false once today's allowance is used up;
// the other two fields are the counter to store either way.
export function countImport(counter: { importWindowStart?: number; importCount?: number }, now: number) {
  const fresh = counter.importWindowStart === undefined || now - counter.importWindowStart >= DAY_MS;
  const importWindowStart = fresh ? now : (counter.importWindowStart as number);
  const used = fresh ? 0 : (counter.importCount ?? 0);
  const allowed = used < FREE_DAILY_IMPORTS;
  return { allowed, importWindowStart, importCount: allowed ? used + 1 : used };
}
