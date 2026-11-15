import type { ActScenario, ActStep } from "@/lib/act/types";

export type ReminderStep = Extract<ActStep, { kind: "move-reminder" | "set-reminder" }>;

export const isReminderStep = (s: ActStep): s is ReminderStep => s.kind === "move-reminder" || s.kind === "set-reminder";

// Did-on-its-own copy for the reversible reminder steps. Demo only: no real reminder is created or moved.
export function reminderCopy(step: ReminderStep, keeperName: string) {
  const label = step.label ?? "reminder";
  if (step.kind === "move-reminder")
    return {
      done: `${keeperName} moved your ${label} from ${step.from} to ${step.to}.`,
      reverted: `Your ${label} is back at ${step.from}.`,
      undo: `Undo · back to ${step.from}`,
      redo: `Move it to ${step.to}`,
      undoHint: `Undo. Put the ${label} back to ${step.from}`,
    };
  return {
    done: `${keeperName} set a ${label} for ${step.when}.`,
    reverted: `The ${label} for ${step.when} is off.`,
    undo: "Undo",
    redo: "Set it again",
    undoHint: `Undo. Turn off the ${label} for ${step.when}`,
  };
}

export function nextLabel(next?: ActStep) {
  if (!next) return "Next";
  if (next.kind === "draft-message") return `Next: text to ${next.to.split(" (")[0]}`;
  if (next.kind === "email-draft") return "Next: email";
  if (next.kind === "order") return "Next: set up the order";
  if (next.kind === "calendar") return "Next: calendar event";
  return "Next";
}

export type ActPage =
  | { kind: "move"; step: number }
  | { kind: "edit"; step: number }
  | { kind: "confirm"; step: number; final: boolean }
  | { kind: "done" };

export function buildPages(steps: ActStep[]): ActPage[] {
  const last = steps.reduce((n, s, i) => (isReminderStep(s) ? n : i), -1);
  const pages: ActPage[] = [];
  steps.forEach((s, i) => {
    if (isReminderStep(s)) return void pages.push({ kind: "move", step: i });
    if (s.kind !== "order") pages.push({ kind: "edit", step: i });
    pages.push({ kind: "confirm", step: i, final: i === last });
  });
  pages.push({ kind: "done" });
  return pages;
}

export function confirmFor(scenario: ActScenario, step: ActStep, final: boolean) {
  if (final) return scenario.confirm;
  if (step.kind === "draft-message") return { title: `Send this to ${step.to}?`, lines: [], button: `Send to ${step.to}` };
  return scenario.confirm;
}

export function demoLine(step: ActStep, tense: "will" | "was") {
  const what = step.kind === "order" ? "ordered or charged" : step.kind === "calendar" ? "added to your calendar" : "sent";
  return `Demo: nothing ${tense === "will" ? "will be" : "was"} ${what}.`;
}

const cents = (s: string) => Math.round(parseFloat(s.replace(/[^0-9.]/g, "")) * 100);
export const itemsSum = (items: { price: string }[]) => items.reduce((n, i) => n + cents(i.price), 0);
export const totalCents = cents;
