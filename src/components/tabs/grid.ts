export type GridLevel = "year" | "month" | "day";

const LEVELS: GridLevel[] = ["year", "month", "day"];
export const COLUMNS: Record<GridLevel, number> = { day: 2, month: 4, year: 6 };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Spreading two fingers (out) makes thumbnails larger and groups by day; pinching in groups by month, then year.
export function stepLevel(level: GridLevel, direction: "in" | "out"): GridLevel {
  const i = LEVELS.indexOf(level) + (direction === "out" ? 1 : -1);
  return LEVELS[Math.min(LEVELS.length - 1, Math.max(0, i))];
}

// tzOffsetMinutes is Date#getTimezoneOffset(): positive west of UTC.
function local(ms: number, tz: number) {
  const d = new Date(ms - tz * 60000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay() };
}

export type Group<T> = { key: string; label: string; items: T[] };

export function groupByLevel<T extends { takenAt: number }>(
  items: T[],
  level: GridLevel,
  tzOffsetMinutes: number,
  now: number,
): Group<T>[] {
  const today = local(now, tzOffsetMinutes);
  const todayN = Date.UTC(today.y, today.m, today.d);
  const groups: Group<T>[] = [];
  for (const item of items) {
    const t = local(item.takenAt, tzOffsetMinutes);
    let key: string;
    let label: string;
    if (level === "year") {
      key = String(t.y);
      label = key;
    } else if (level === "month") {
      key = `${t.y}-${t.m}`;
      label = `${MONTHS[t.m]} ${t.y}`;
    } else {
      key = `${t.y}-${t.m}-${t.d}`;
      const days = Math.round((todayN - Date.UTC(t.y, t.m, t.d)) / 86400000);
      if (days === 0) label = "Today";
      else if (days === 1) label = "Yesterday";
      else label = `${DAYS[t.dow]}, ${MONTHS_SHORT[t.m]} ${t.d}${t.y === today.y ? "" : `, ${t.y}`}`;
    }
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label, items: [item] });
  }
  return groups;
}
