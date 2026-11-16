import { beforeEach, describe, expect, test, vi } from "vitest";

const store = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("expo-secure-store", () => ({ getItemAsync: store.get, setItemAsync: store.set }));

beforeEach(() => {
  vi.resetModules();
  store.get.mockReset();
  store.set.mockReset();
  store.set.mockResolvedValue(undefined);
});

describe("notes prefs", () => {
  test("are off when nothing or something unreadable is stored", async () => {
    const { parseNotesPrefs } = await import("./notes-prefs");
    expect(parseNotesPrefs(null)).toEqual({ tab: false, byDate: false });
    expect(parseNotesPrefs("nope")).toEqual({ tab: false, byDate: false });
    expect(parseNotesPrefs('{"tab":"yes"}')).toEqual({ tab: false, byDate: false });
    expect(parseNotesPrefs('{"tab":true,"byDate":true}')).toEqual({ tab: true, byDate: true });
  });

  test("a change keeps the other switch and is saved", async () => {
    store.get.mockResolvedValue('{"tab":true,"byDate":false}');
    const { getNotesPrefs, setNotesPrefs } = await import("./notes-prefs");
    await getNotesPrefs();
    await setNotesPrefs({ byDate: true });
    expect(await getNotesPrefs()).toEqual({ tab: true, byDate: true });
    expect(store.set).toHaveBeenCalledWith("psst.notesPrefs", '{"tab":true,"byDate":true}');
  });
});
