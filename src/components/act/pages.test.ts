import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ActScenario, ActStep } from "../../lib/act/types";
import { buildPages, confirmFor, itemsSum, totalCents, demoLine } from "./pages";

vi.mock("../../lib/act/scenarios/images", () => ({ MOM_PIZZA_IMAGE: 1, FLIGHT_DELAY_IMAGE: 2 }));

let DEMO_ACTS: ActScenario[] = [];
const act = (id: string) => DEMO_ACTS.find((a) => a.id === id)!;

beforeAll(async () => {
  DEMO_ACTS = (await import("../../lib/act/scenarios")).DEMO_ACTS;
});

describe("act pages", () => {
  it("pizza walks draft, confirm, pretend reply, order, confirm, done", () => {
    expect(buildPages(act("mom-pizza").steps).map((p) => p.kind)).toEqual(["edit", "confirm", "reply", "edit", "confirm", "done"]);
  });
  it("delay moves the reminder, then drafts and confirms the text", () => {
    const pages = buildPages(act("flight-delay").steps);
    expect(pages.map((p) => p.kind)).toEqual(["move", "edit", "confirm", "done"]);
    expect(pages[2]).toMatchObject({ kind: "confirm", final: true });
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
    const draft: ActStep = { kind: "draft-message", to: "Mom", via: "iMessage", body: "x" };
    const order: ActStep = { kind: "order", merchant: "m", items: [], deliverTo: "d", total: "$1", eta: "e" };
    const calendar: ActStep = { kind: "calendar", title: "t", when: "w" };
    expect(demoLine(draft, "will")).toBe("Demo: nothing will be sent.");
    expect(demoLine(order, "was")).toBe("Demo: nothing was ordered or charged.");
    expect(demoLine(calendar, "will")).toBe("Demo: nothing will be added to your calendar.");
  });
});
