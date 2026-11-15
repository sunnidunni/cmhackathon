import { stepLevel, type GridLevel } from "./grid";

export type Row<T> =
  | { type: "header"; key: string; label: string }
  | { type: "row"; key: string; items: T[] };

// Flattens date groups into list rows (a date line, then rows of up to cols items) for a virtualized list.
export function buildRows<T>(groups: { key: string; label: string; items: T[] }[], cols: number): Row<T>[] {
  const rows: Row<T>[] = [];
  for (const g of groups) {
    rows.push({ type: "header", key: `h:${g.key}`, label: g.label });
    for (let i = 0; i < g.items.length; i += cols) {
      rows.push({ type: "row", key: `r:${g.key}:${i / cols}`, items: g.items.slice(i, i + cols) });
    }
  }
  return rows;
}

// Every row has a fixed height, so the list can place rows without measuring them.
export function rowLayouts<T>(rows: Row<T>[], heights: { header: number; row: number }, top: number) {
  let offset = top;
  return rows.map((r) => {
    const length = r.type === "header" ? heights.header : heights.row;
    const layout = { offset, length };
    offset += length;
    return layout;
  });
}

const SPREAD = 1.15;
const SQUEEZE = 0.87;

export function snapLevel(level: GridLevel, scale: number): GridLevel {
  if (scale > SPREAD) return stepLevel(level, "out");
  if (scale < SQUEEZE) return stepLevel(level, "in");
  return level;
}
