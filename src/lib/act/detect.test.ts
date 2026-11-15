import { describe, expect, test } from "vitest";
import actManifest from "../../../demo-screenshots/act-manifest.json";
import manifest from "../../../demo-screenshots/manifest.json";
import { detect, type DetectInput } from "./detect";

const NOW = new Date(2026, 10, 15, 10, 0);
const YESTERDAY = new Date(2026, 10, 14, 10, 0).toISOString();

type Row = (typeof manifest)[number];
const asShot = (row: Row): DetectInput => ({
  id: row.file.slice(4, -4),
  title: row.title,
  summary: row.summary,
  text: row.text,
  room: row.room as DetectInput["room"],
  dates: row.dates,
  savedAt: YESTERDAY,
});

const EXPECTED: Record<string, { kind: string; keeper: string } | null> = {
  "01-pottery-flyer": null,
  "02-course-syllabus": null,
  "03-concert-ticket": { kind: "calendar", keeper: "tock" },
  "04-dentist-text": { kind: "calendar", keeper: "tock" },
  "05-visa-email": { kind: "calendar", keeper: "tock" },
  "06-hackathon-post": null,
  "07-dinner-chat": { kind: "calendar", keeper: "tock" },
  "08-wifi-chat": null,
  "09-rent-chat": null,
  "10-party-address": null,
  "11-book-dm": null,
  "12-coffee-receipt": null,
  "13-order-confirmation": null,
  "14-boarding-pass": { kind: "calendar", keeper: "tock" },
  "15-utility-bill": { kind: "bill", keeper: "penny" },
  "16-headphones-product": null,
  "17-refund": null,
  "18-miso-pasta": null,
  "19-quote-card": null,
  "20-map-recommendation": null,
  "21-article-tip": null,
  "22-ai-answer": null,
  "23-workout-plan": null,
  "24-blurry-meme": null,
};

const shot = (over: Partial<DetectInput>): DetectInput => ({
  id: "x1",
  title: "Thing",
  summary: "",
  text: "",
  room: "chats",
  dates: [],
  savedAt: YESTERDAY,
  ...over,
});

describe("detect over the demo manifest", () => {
  test("covers every manifest entry", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(manifest.map((r) => r.file.slice(4, -4)).sort());
  });

  for (const row of manifest) {
    const s = asShot(row);
    test(s.id, () => {
      const act = detect(s, NOW);
      const want = EXPECTED[s.id];
      if (!want) return expect(act).toBeNull();
      expect(act).not.toBeNull();
      expect(act?.id).toBe("real:" + want.kind + ":" + s.id);
      expect(act?.keeper).toBe(want.keeper);
      expect(act?.source.shotId).toBe(s.id);
      expect(act?.why).toContain("From a screenshot saved Nov 14.");
      expect(act?.steps.length).toBeGreaterThan(0);
    });
  }

  test("recipes, quotes, memes and ideas never produce an act", () => {
    for (const row of manifest.filter((r) => r.room === "ideas" || r.room === "unsorted")) {
      expect(detect(asShot(row), NOW)).toBeNull();
    }
  });

  test("the utility bill is a reminder and an email draft, never a payment", () => {
    const act = detect(asShot(manifest.find((r) => r.file.includes("utility-bill")) as Row), NOW);
    expect(act?.steps.map((x) => x.kind)).toEqual(["move-reminder", "email-draft"]);
    expect(act?.steps.map((x) => x.kind)).not.toContain("order");
    expect(act?.noticed).toBe("Willow Grid Energy, $51.30, is due Nov 21.");
    expect(act?.ready).toContain("I won't pay it.");
    expect(act?.confirm.price).toBeUndefined();
    expect(act?.steps[0]).toEqual({ kind: "move-reminder", from: "Due Nov 21", to: "Reminder Nov 20, 9:00 AM" });
    expect(act?.steps[1]).toMatchObject({ kind: "email-draft", to: "Willow Grid Energy billing", subject: "Question about my bill (account WG-4182)" });
  });

  test("the concert ticket gets a calendar entry with a leave-by", () => {
    const act = detect(asShot(manifest.find((r) => r.file.includes("concert")) as Row), NOW);
    expect(act?.steps[0]).toEqual({
      kind: "calendar",
      title: "Juniper Vale concert",
      when: "Nov 22, 8:00 PM",
      where: "Northline Hall",
      leaveBy: "7:15 PM",
    });
  });

  test("the boarding pass uses the gate and a 2-hour buffer", () => {
    const act = detect(asShot(manifest.find((r) => r.file.includes("boarding")) as Row), NOW);
    expect(act?.steps[0]).toMatchObject({ kind: "calendar", where: "Gate B12", leaveBy: "4:55 PM" });
  });
});

describe("saved label", () => {
  test("says today with the time for a screenshot saved today", () => {
    const row = manifest.find((r) => r.file.includes("dentist")) as Row;
    const act = detect({ ...asShot(row), savedAt: new Date(2026, 10, 15, 9, 12).toISOString() }, NOW);
    expect(act?.why).toContain("From a screenshot saved today, 9:12 AM.");
  });
});

describe("chat that asks you to bring or buy something", () => {
  const ask = shot({
    id: "c1",
    title: "Picnic plans",
    summary: "Sam asks you to bring drinks to the picnic.",
    text: "Sam. Can you bring the lemonade on Saturday?",
  });

  test("drafts a reply to the sender and nothing else", () => {
    const act = detect(ask, NOW);
    expect(act?.keeper).toBe("murmur");
    expect(act?.id).toBe("real:chat:c1");
    expect(act?.steps).toEqual([
      { kind: "draft-message", to: "Sam", via: "iMessage", body: "Yes, I can bring the lemonade on Saturday." },
    ]);
    expect(act?.noticed).toBe("Sam asked you to bring the lemonade on Saturday.");
    expect(act?.confirm.lines[0]).toBe("To: Sam, iMessage");
    expect(act?.done).toBe("Demo: nothing was sent.");
  });

  test("works from the summary alone when the text is missing", () => {
    const act = detect({ ...ask, text: null }, NOW);
    expect(act?.steps[0]).toMatchObject({ kind: "draft-message", to: "Sam", body: "Yes, I can bring drinks to the picnic." });
  });

  test("turns me into you in the reply", () => {
    const act = detect(shot({ id: "c2", text: "Priya. Could you grab me a coffee?" }), NOW);
    expect(act?.steps[0]).toMatchObject({ body: "Yes, I can grab you a coffee." });
  });

  test("stays quiet when the chat already shows an answer", () => {
    expect(detect({ ...ask, text: "Sam. Can you bring the lemonade? Yep, on it." }, NOW)).toBeNull();
  });

  test("stays quiet without a sender", () => {
    expect(detect({ ...ask, summary: "A group chat plans a picnic.", text: "Can you bring the lemonade?" }, NOW)).toBeNull();
  });

  test("ignores a request that is not about buying or bringing", () => {
    expect(detect(shot({ text: "Noah. Can you send your half of rent?" }), NOW)).toBeNull();
  });
});

describe("travel delay", () => {
  const flight = shot({
    id: "t1",
    title: "Skyloom flight",
    room: "money",
    summary: "Your flight SL 208 is delayed. It now departs 7:40 PM.",
    text: "SKYLOOM. Flight SL 208 is delayed. Now departs 7:40 PM. Maya is picking you up.",
    dates: [{ when: "2026-11-22T18:55:00", what: "Skyloom flight SL 208 boarding", confident: true }],
  });

  test("moves the reminder and tells the person picking you up", () => {
    const act = detect(flight, NOW);
    expect(act?.keeper).toBe("tock");
    expect(act?.id).toBe("real:delay:t1");
    expect(act?.steps).toEqual([
      { kind: "move-reminder", from: "Reminder for Nov 22, 6:55 PM", to: "Reminder for Nov 22, 7:40 PM" },
      { kind: "notify-contact", to: "Maya", via: "iMessage", body: "Heads up, my trip is delayed. The new time is Nov 22, 7:40 PM." },
    ]);
    expect(act?.confirm.button).toBe("Send and move reminder");
  });

  test("moves only the reminder when nobody is named", () => {
    const act = detect({ ...flight, text: "SKYLOOM. Flight SL 208 is delayed. Now departs 7:40 PM." }, NOW);
    expect(act?.steps.map((s) => s.kind)).toEqual(["move-reminder"]);
    expect(act?.done).toBe("Demo: nothing was changed.");
  });

  test("works out the new time from a delay in minutes", () => {
    const act = detect({ ...flight, summary: "Flight delayed by 45 minutes.", text: "Flight SL 208 delayed by 45 minutes." }, NOW);
    expect(act?.steps[0]).toMatchObject({ to: "Reminder for Nov 22, 7:40 PM" });
  });

  test("returns null when the new time cannot be worked out", () => {
    expect(detect({ ...flight, summary: "Your flight is delayed.", text: "Flight SL 208 is delayed." }, NOW)).toBeNull();
  });
});

describe("caution", () => {
  test("a past appointment produces nothing", () => {
    const row = manifest.find((r) => r.file.includes("dentist")) as Row;
    expect(detect(asShot(row), new Date(2026, 10, 25, 9, 0))).toBeNull();
  });

  test("a bill due tomorrow produces nothing because the reminder time has passed", () => {
    const row = manifest.find((r) => r.file.includes("utility-bill")) as Row;
    expect(detect(asShot(row), new Date(2026, 10, 20, 12, 0))).toBeNull();
  });

  test("an uncertain date is not enough", () => {
    const row = manifest.find((r) => r.file.includes("dentist")) as Row;
    expect(detect({ ...asShot(row), dates: row.dates.map((d) => ({ ...d, confident: false })) }, NOW)).toBeNull();
  });

  test("a registration deadline is not a calendar event", () => {
    expect(
      detect(
        shot({
          room: "deadlines",
          summary: "Booked: registration closes soon.",
          text: "Booked. Registration closes Nov 21 at 11:59 PM.",
          dates: [{ when: "2026-11-21T23:59:00", what: "Registration closes", confident: true }],
        }),
        NOW,
      ),
    ).toBeNull();
  });
});

describe("detect over the act demo manifest", () => {
  const pizza = asShot(actManifest[0]);
  const delay = asShot(actManifest[1]);

  test("Mom's pizza text becomes a Murmur reply, not an order", () => {
    const act = detect(pizza, NOW);
    expect(act?.id).toBe("real:chat:25-mom-pizza-text");
    expect(act?.keeper).toBe("murmur");
    expect(act?.steps).toEqual([{ kind: "draft-message", to: "Mom", via: "iMessage", body: "Yes, I can order pizza for tonight." }]);
    expect(act?.source.shotId).toBe("25-mom-pizza-text");
    expect(act?.confirm.price).toBeUndefined();
  });

  test("the flight delay moves the reminder from the old time to the new one", () => {
    const act = detect(delay, NOW);
    expect(act?.id).toBe("real:delay:26-flight-delay");
    expect(act?.keeper).toBe("tock");
    expect(act?.steps).toEqual([{ kind: "move-reminder", from: "Reminder for Nov 15, 5:45 PM", to: "Reminder for Nov 15, 7:25 PM" }]);
    expect(act?.why).toContain("From a screenshot saved Nov 14.");
  });

  test("a delay whose new time has already passed produces nothing", () => {
    expect(detect(delay, new Date(2026, 10, 15, 20, 0))).toBeNull();
  });
});
