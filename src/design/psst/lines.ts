import bank from "./lines.json";

export type LineKey = keyof typeof bank;

export function psstLine(key: LineKey, vars: Record<string, string | number> = {}): string {
  return bank[key].text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}
