import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { confirmNote, effectLabel, parseEventWhen, realEffectEnd, runEffect } from "./effects";
import type { ActStep } from "./types";

const sms = vi.hoisted(() => ({ isAvailableAsync: vi.fn(), sendSMSAsync: vi.fn() }));
const mail = vi.hoisted(() => ({
  isAvailableAsync: vi.fn(),
  composeAsync: vi.fn(),
  MailComposerStatus: { SENT: "sent", SAVED: "saved", CANCELLED: "cancelled", UNDETERMINED: "undetermined" },
}));
const linking = vi.hoisted(() => ({ openURL: vi.fn() }));
const createEvent = vi.hoisted(() => vi.fn());
const calendar = vi.hoisted(() => ({
  requestCalendarPermissions: vi.fn(),
  getDefaultCalendarSync: vi.fn(),
  getCalendars: vi.fn(),
  getCalendarPermissions: vi.fn(),
}));

vi.mock("expo-sms", () => sms);
vi.mock("expo-mail-composer", () => mail);
vi.mock("expo-linking", () => linking);
vi.mock("expo-calendar", () => calendar);

const text: Extract<ActStep, { kind: "draft-message" }> = { kind: "draft-message", to: "Mom", via: "Messages", body: "Yes, I can order pizza for tonight." };
const email: Extract<ActStep, { kind: "email-draft" }> = { kind: "email-draft", to: "Willow Grid Energy billing", subject: "Question about my bill", body: "Hi." };
const event: ActStep = { kind: "calendar", title: "Juniper Vale at Northline Hall", when: "Nov 22, 8:00 PM (doors)", where: "Northline Hall", leaveBy: "7:15 PM" };

beforeEach(() => {
  vi.resetAllMocks();
  process.env.EXPO_OS = "ios";
  sms.isAvailableAsync.mockResolvedValue(true);
  mail.isAvailableAsync.mockResolvedValue(true);
  calendar.requestCalendarPermissions.mockResolvedValue({ granted: true });
  calendar.getDefaultCalendarSync.mockReturnValue({ createEvent });
});
afterEach(() => {
  delete process.env.EXPO_OS;
});

describe("parseEventWhen", () => {
  const now = new Date(2026, 10, 16, 9, 0);
  test("reads a month, day and time", () => {
    expect(parseEventWhen("Nov 22, 8:00 PM (doors)", now)).toEqual(new Date(2026, 10, 22, 20, 0));
    expect(parseEventWhen("Thu, Nov 20 · 6:30 PM", now)).toEqual(new Date(2026, 10, 20, 18, 30));
  });
  test("rolls a past date into next year", () => {
    expect(parseEventWhen("Jan 5, 9:15 AM", now)).toEqual(new Date(2027, 0, 5, 9, 15));
  });
  test("keeps an explicit year instead of guessing", () => {
    expect(parseEventWhen("Nov 22, 2027, 8:00 PM", now)).toEqual(new Date(2027, 10, 22, 20, 0));
    expect(parseEventWhen("Jan 5, 2026, 9:15 AM", now)).toEqual(new Date(2026, 0, 5, 9, 15));
  });
  test("returns null when there is no time", () => {
    expect(parseEventWhen("Nov 22", now)).toBeNull();
  });
});

describe("text", () => {
  test("opens the composer prefilled and counts only a sent message", async () => {
    sms.sendSMSAsync.mockResolvedValue({ result: "sent" });
    expect(await runEffect(text, { body: "Edited." })).toBe("done");
    expect(sms.sendSMSAsync).toHaveBeenCalledWith([], "Edited.");
  });
  test("passes a phone number through as the recipient", async () => {
    sms.sendSMSAsync.mockResolvedValue({ result: "sent" });
    await runEffect({ ...text, to: "+1 415 555 0100" });
    expect(sms.sendSMSAsync).toHaveBeenCalledWith(["+1 415 555 0100"], text.body);
  });
  test("a cancelled or unknown composer counts as opened, never as done", async () => {
    sms.sendSMSAsync.mockResolvedValue({ result: "cancelled" });
    expect(await runEffect(text)).toBe("opened");
    sms.sendSMSAsync.mockResolvedValue({ result: "unknown" });
    expect(await runEffect(text)).toBe("opened");
  });
  test("unavailable and thrown fall back", async () => {
    sms.isAvailableAsync.mockResolvedValue(false);
    expect(await runEffect(text)).toBe("fallback");
    sms.isAvailableAsync.mockRejectedValue(new Error("no module"));
    expect(await runEffect(text)).toBe("fallback");
  });
});

describe("email", () => {
  test("fills subject and body, and counts sent or saved on iOS", async () => {
    mail.composeAsync.mockResolvedValue({ status: "saved" });
    expect(await runEffect(email, { subject: "Edited subject" })).toBe("done");
    expect(mail.composeAsync).toHaveBeenCalledWith({ recipients: [], subject: "Edited subject", body: "Hi." });
  });
  test("uses a real address as the recipient", async () => {
    mail.composeAsync.mockResolvedValue({ status: "sent" });
    await runEffect({ ...email, to: "billing@example.com" });
    expect(mail.composeAsync).toHaveBeenCalledWith(expect.objectContaining({ recipients: ["billing@example.com"] }));
  });
  test("a cancelled composer counts as opened", async () => {
    mail.composeAsync.mockResolvedValue({ status: "cancelled" });
    expect(await runEffect(email)).toBe("opened");
  });
  test("Android reports sent for everything, so it never counts", async () => {
    process.env.EXPO_OS = "android";
    mail.composeAsync.mockResolvedValue({ status: "sent" });
    expect(await runEffect(email)).toBe("opened");
  });
  test("with no mail account it opens a mailto link and counts as opened", async () => {
    mail.isAvailableAsync.mockResolvedValue(false);
    expect(await runEffect(email)).toBe("opened");
    expect(linking.openURL).toHaveBeenCalledWith("mailto:?subject=Question%20about%20my%20bill&body=Hi.");
  });
});

describe("calendar", () => {
  test("adds the event after permission is granted", async () => {
    createEvent.mockResolvedValue({ id: "evt-1" });
    expect(await runEffect(event)).toBe("done");
    const made = createEvent.mock.calls[0][0];
    expect(made.title).toBe("Juniper Vale at Northline Hall");
    expect(made.location).toBe("Northline Hall");
    expect(made.endDate.getTime() - made.startDate.getTime()).toBe(3600000);
    expect(made.notes).toContain("7:15 PM");
  });
  test("denied permission falls back without creating anything", async () => {
    calendar.requestCalendarPermissions.mockResolvedValue({ granted: false });
    expect(await runEffect(event)).toBe("fallback");
    expect(createEvent).not.toHaveBeenCalled();
  });
  test("Expo Go's calendar stub throws, and that falls back", async () => {
    calendar.getDefaultCalendarSync.mockImplementation(() => {
      throw new Error("Calendar@next functionality is not available in Expo Go");
    });
    expect(await runEffect(event)).toBe("fallback");
  });
  test("an unreadable time falls back", async () => {
    expect(await runEffect({ ...event, when: "sometime" })).toBe("fallback");
  });
});

describe("effectLabel", () => {
  test("names the app when the module is available", async () => {
    calendar.getCalendarPermissions.mockResolvedValue({ status: "undetermined", canAskAgain: true });
    expect(await effectLabel(text)).toBe("Open in Messages");
    expect(await effectLabel(email)).toBe("Open in Mail");
    expect(await effectLabel(event)).toBe("Add to Calendar");
  });
  test("is null when unavailable, denied for good, or the module throws", async () => {
    sms.isAvailableAsync.mockResolvedValue(false);
    mail.isAvailableAsync.mockRejectedValue(new Error("no module"));
    calendar.getCalendarPermissions.mockResolvedValue({ status: "denied", canAskAgain: false });
    expect(await effectLabel(text)).toBeNull();
    expect(await effectLabel(email)).toBeNull();
    expect(await effectLabel(event)).toBeNull();
    expect(await effectLabel({ kind: "order", merchant: "x", items: [], deliverTo: "x", total: "x", eta: "x" })).toBeNull();
  });
});

describe("simulated steps", () => {
  test("orders and reminder moves are never run for real", async () => {
    expect(await runEffect({ kind: "order", merchant: "Pizza", items: [], deliverTo: "Home", total: "$20", eta: "30 min" })).toBe("fallback");
    expect(await runEffect({ kind: "move-reminder", from: "a", to: "b" })).toBe("fallback");
  });
  test("the confirm note tells the truth for the three real effects only", () => {
    expect(confirmNote(text)).toContain("Nothing is sent until you press Send");
    expect(confirmNote(email)).toContain("Nothing is sent until you press Send");
    expect(confirmNote(event)).toBe("Shots asks for calendar access, then adds this event.");
    expect(confirmNote({ kind: "move-reminder", from: "a", to: "b" })).toBeNull();
  });
  test("an event the calendar did not confirm with an id does not count", async () => {
    createEvent.mockResolvedValue({});
    expect(await runEffect(event)).toBe("fallback");
  });
  test("the end copy says opened for composers and added only for a saved event", () => {
    expect(realEffectEnd(text, "opened")).toEqual({ title: "Opened in Messages.", body: "Shots can't see whether you sent it." });
    expect(realEffectEnd(text, "done")).toEqual({ title: "Opened in Messages.", body: "Messages says it was sent." });
    expect(realEffectEnd(email, "opened")?.title).toBe("Opened in Mail.");
    expect(realEffectEnd(event, "done")?.title).toBe("Added to your calendar.");
    expect(realEffectEnd(event, "opened")?.title).toBe("Added to your calendar.");
    expect(realEffectEnd(text, "fallback")).toBeNull();
    expect(realEffectEnd(text, undefined)).toBeNull();
  });
});
