import type { ActScenario, ActStep } from "@/lib/act/types";

export type ActPage =
  | { kind: "move"; step: number }
  | { kind: "edit"; step: number }
  | { kind: "confirm"; step: number; final: boolean }
  | { kind: "reply"; step: number }
  | { kind: "done" };

export function buildPages(steps: ActStep[]): ActPage[] {
  const last = steps.reduce((n, s, i) => (s.kind === "move-reminder" ? n : i), -1);
  const pages: ActPage[] = [];
  steps.forEach((s, i) => {
    if (s.kind === "move-reminder") return void pages.push({ kind: "move", step: i });
    pages.push({ kind: "edit", step: i }, { kind: "confirm", step: i, final: i === last });
    if (s.kind === "draft-message" && s.reply && i !== last) pages.push({ kind: "reply", step: i });
  });
  pages.push({ kind: "done" });
  return pages;
}

export function confirmFor(scenario: ActScenario, step: ActStep, final: boolean) {
  if (final) return scenario.confirm;
  if (step.kind === "draft-message") return { title: `Send this to ${step.to}?`, lines: [], button: `Send to ${step.to}` };
  return scenario.confirm;
}

export const willBe = (done: string) => done.replace(" was ", " will be ");

const cents = (s: string) => Math.round(parseFloat(s.replace(/[^0-9.]/g, "")) * 100);
export const itemsSum = (items: { price: string }[]) => items.reduce((n, i) => n + cents(i.price), 0);
export const totalCents = cents;
