import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = (p: string) => readFileSync(resolve(__dirname, "../app", p), "utf8");

// A <Stack.Screen options={{...}}> inside a screen builds a new object every render. expo-router calls
// navigation.setOptions(options) in an effect keyed on that object, the navigator re-renders the screen, and the
// loop ends in "Maximum update depth exceeded". Sheet routes declare stable options in the root layout instead.
describe("formSheet routes", () => {
  const sheets = ["remind/[id].tsx", "act/[id].tsx", "act/flight-status.tsx", "settings.tsx", "settings/actions.tsx", "notifications.tsx"];
  it.each(sheets)("%s sets no inline Stack.Screen options", (file) => {
    expect(src(file)).not.toMatch(/<Stack\.Screen/);
  });
  it("the root layout declares the sheets with memoized options", () => {
    const layout = src("_layout.tsx");
    for (const name of ["remind/[id]", "act/[id]", "settings", "settings/actions", "notifications"]) expect(layout).toContain(`name="${name}"`);
    for (const v of ["sheet", "settingsSheet", "actionsSheet", "notificationsSheet"]) expect(layout).toMatch(new RegExp(`const ${v} = useMemo<SheetOptions>\\(`));
  });
});

describe("modal routes", () => {
  it.each(["dev.tsx", "recap.tsx"])("%s sets no inline Stack.Screen options", (file) => {
    expect(src(file)).not.toMatch(/<Stack\.Screen/);
  });
  it("the root layout declares their presentation once, as module constants", () => {
    const layout = src("_layout.tsx");
    expect(layout).toContain(`name="dev" options={devModal}`);
    expect(layout).toContain(`name="recap" options={recapModal}`);
  });
});

describe("header routes", () => {
  it.each(["shot/[id].tsx", "room/[key].tsx"])("%s sets no inline Stack.Screen options", (file) => {
    expect(src(file)).not.toMatch(/<Stack\.Screen/);
  });
  it("the root layout declares their header once, as a module constant", () => {
    const layout = src("_layout.tsx");
    expect(layout).toMatch(/^const backHeader: SheetOptions = /m);
    for (const name of ["shot/[id]", "room/[key]"]) expect(layout).toContain(`name="${name}" options={backHeader}`);
  });
});
