import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ActScenario, ActStep } from "../../lib/act/types";
import { buildPages, confirmFor, doneLine, isFixtureAct, itemsSum, lastAction, nextLabel, realEnd, realLine, reminderCopy, totalCents, demoLine } from "./pages";

vi.mock("../../lib/act/scenarios/images", () => ({ MOM_PIZZA_IMAGE: 1, FLIGHT_DELAY_IMAGE: 2, FLIGHT_LATE_IMAGE: 5, BILL_IMAGE: 3, CONCERT_IMAGE: 4 }));

let DEMO_ACTS: ActScenario[] = [];
const act = (id: string) => DEMO_ACTS.find((a) => a.id === id)!;

beforeAll(async () => {
  DEMO_ACTS = (await import("../../lib/act/scenarios")).DEMO_ACTS;
});

describe("act pages", () => {
  it("pizza is three steps: draft, confirm the text, then one order confirm", () => {
    expect(buildPages(act("mom-pizza").steps).map((p) => p.kind)).toEqual(["edit", "confirm", "confirm", "done"]);
    expect(buildPages(act("mom-pizza").steps)[2]).toMatchObject({ kind: "confirm", step: 1, final: true });
  });
  it("flight claim: Tock's card, Penny's flow, one email confirm, then the timeline", () => {
    const claim = act("flight-eu261");
    expect([claim.keeper, claim.flowKeeper]).toEqual(["tock", "penny"]);
    expect(buildPages(claim.steps).map((p) => p.kind)).toEqual(["edit", "confirm", "done"]);
    expect(claim.cta).toBe("Review claim");
    expect(claim.timeline?.rows.map((r) => r.label)).toEqual(["Claim sent", "Airline replied", "Approved", "Paid €600 (about $700)"]);
    expect(claim.timeline?.rows.every((r) => /^Day \d+$/.test(r.when))).toBe(true);
  });
  it("uses the scenario confirm for the last send and a derived one before it", () => {
    const pizza = act("mom-pizza");
    expect(confirmFor(pizza, pizza.steps[0], false).button).toBe("Send to Mom");
    expect(confirmFor(pizza, pizza.steps[1], true).button).toBe("Place order · $41.75");
  });
  it("order line items add up to the total", () => {
    for (const s of DEMO_ACTS.flatMap((a) => a.steps)) if (s.kind === "order") expect(itemsSum(s.items)).toBe(totalCents(s.total));
  });
  it("Today buttons review, they never act; done copy only says nothing happened", () => {
    for (const a of DEMO_ACTS.filter((a) => a.steps.length > 0)) {
      expect(a.cta).toMatch(/^Review /);
      expect(a.done).toMatch(/^Demo: nothing was /);
    }
    const draft: ActStep = { kind: "draft-message", to: "Mom", via: "Messages", body: "x" };
    const order: ActStep = { kind: "order", merchant: "m", items: [], deliverTo: "d", total: "$1", eta: "e" };
    const calendar: ActStep = { kind: "calendar", title: "t", when: "w" };
    expect(demoLine(draft, "will")).toBe("Demo: nothing will be sent.");
    expect(demoLine(order, "was")).toBe("Demo: nothing was ordered or charged.");
    expect(demoLine(calendar, "will")).toBe("Demo: nothing will be added to your calendar.");
  });
  it("reminder steps are did-on-its-own and carry their own copy", () => {
    expect(buildPages([{ kind: "set-reminder", when: "Nov 20, 9:00 AM" }, { kind: "email-draft", to: "a@b.example", subject: "s", body: "b" }]).map((p) => p.kind)).toEqual(["move", "edit", "confirm", "done"]);
    const set = reminderCopy({ kind: "set-reminder", when: "Nov 20, 9:00 AM" }, "Penny Pocket");
    expect(set.done).toBe("Penny Pocket set a reminder for Nov 20, 9:00 AM.");
    expect(set.undo).toBe("Undo");
    const move = reminderCopy({ kind: "move-reminder", from: "3:30 PM", to: "5:10 PM", label: "airport reminder" }, "Tock");
    expect(move.done).toBe("Tock moved your airport reminder from 3:30 PM to 5:10 PM.");
    expect(reminderCopy({ kind: "move-reminder", from: "a", to: "b" }, "Tock").done).not.toMatch(/airport/);
  });
  it("labels the next button from the next step", () => {
    expect(nextLabel({ kind: "draft-message", to: "Sam (picking you up)", via: "Messages", body: "x" })).toBe("Next: text to Sam");
    expect(nextLabel({ kind: "calendar", title: "t", when: "w" })).toBe("Next: calendar event");
  });
  it("done copy: product voice on fixtures, honest on real and detected acts", () => {
    const pizza = act("mom-pizza");
    const delay = act("flight-eu261");
    expect(doneLine(pizza, lastAction(pizza.steps), true)).toBe("Order placed · $41.75");
    expect(doneLine(delay, lastAction(delay.steps), true)).toBe("Claim sent to the airline.");
    expect(doneLine(pizza, lastAction(pizza.steps), false)).toBe("Demo: nothing was ordered or charged.");
    expect(doneLine(delay, lastAction(delay.steps), false)).toBe("Demo: nothing was sent.");
    expect(doneLine(act("bill-willow-grid"), lastAction(act("bill-willow-grid").steps), true)).toBe("Email sent to Willow Grid.");
    expect(doneLine(act("concert-calendar"), undefined, true)).toBeTruthy();
  });
  it("fixtures are gated per scenario: a detected act stays honest even with fixtures on", () => {
    const real: ActScenario = { ...act("flight-eu261"), id: "real:delay:26-flight-delay", done: "Nothing was sent." };
    expect(isFixtureAct(act("flight-eu261"), true)).toBe(true);
    expect(isFixtureAct(act("flight-eu261"), false)).toBe(false);
    expect(isFixtureAct(real, true)).toBe(false);
    expect(doneLine(real, lastAction(real.steps), isFixtureAct(real, true))).toBe("Nothing was sent.");
    expect(realEnd(lastAction(real.steps))).toEqual({ title: "Nothing was sent.", body: "Sending isn't connected in this version." });
    expect(realEnd({ kind: "calendar", title: "t", when: "w" }).title).toBe("Nothing was added.");
    expect(realLine({ kind: "draft-message", to: "Sam", via: "Messages", body: "x" })).toBe("Psst can't send this yet.");
  });
  it("bill confirm has no demo-address line, and its fixture end says the email was sent", () => {
    expect(act("bill-willow-grid").confirm.lines.join(" ")).not.toMatch(/demo/i);
  });
});
