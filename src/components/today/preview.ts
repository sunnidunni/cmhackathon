import { Asset } from "expo-asset";
import manifest from "../../../demo-screenshots/manifest.json";
import type { TodayData } from "./model";
import type { ShotInfo, TodoItem } from "./todoRows";

type Card = TodayData["handful"][number];
type Entry = (typeof manifest)[number];

// Static requires only, so each demo image is listed once.
const IMAGES: Record<string, number> = {
  "png/01-pottery-flyer.png": require("../../../demo-screenshots/png/01-pottery-flyer.png"),
  "png/04-dentist-text.png": require("../../../demo-screenshots/png/04-dentist-text.png"),
  "png/08-wifi-chat.png": require("../../../demo-screenshots/png/08-wifi-chat.png"),
  "png/15-utility-bill.png": require("../../../demo-screenshots/png/15-utility-bill.png"),
  "png/18-miso-pasta.png": require("../../../demo-screenshots/png/18-miso-pasta.png"),
};

const local = (y: number, m: number, d: number, h: number, min: number, tz: number) => Date.UTC(y, m - 1, d, h, min) + tz * 60000;

// Dev-only: today.get-shaped demo data from demo-screenshots/manifest.json (Sun Nov 15), used when FIXTURES is on and ?preview= is given.
export function previewToday(kind: string, tz: number): { data: TodayData | undefined; now: number } {
  const now = local(2026, 11, 15, 9, 41, tz);
  const entry = (file: string) => manifest.find((e) => e.file === file) as Entry;
  const card = (file: string, savedDay: number, over: Partial<Card> = {}): Card => {
    const e = entry(file);
    const date = e.dates[0] ?? null;
    return {
      _id: file,
      title: e.title,
      category: e.room,
      lineKey: null,
      imageUrl: Asset.fromModule(IMAGES[file]).uri,
      importance: e.importance,
      takenAt: local(2026, 11, savedDay, 12, 0, tz),
      date,
      reminder: null,
      actions: date ? { primary: "remind", secondary: "done" } : { primary: "keep", secondary: "delete" },
      ...over,
    } as Card;
  };
  const set = (dueAt: number): Partial<Card> => ({ reminder: { id: "r" as never, state: "scheduled", dueAt }, actions: { primary: "done", secondary: "detail" } });
  const flyer = card("png/01-pottery-flyer.png", 15, { takenAt: local(2026, 11, 15, 9, 12, tz) });
  const dentist = card("png/04-dentist-text.png", 9);
  const bill = card("png/15-utility-bill.png", 12);
  const wifi = card("png/08-wifi-chat.png", 5);
  const recipe = card("png/18-miso-pasta.png", 4, { importance: 2 });
  const reminderRow = (reminderId: string, c: Card, dueAt: number) => ({ reminderId: reminderId as never, screenshotId: c._id, title: c.title, imageUrl: c.imageUrl, category: c.category, dueAt, when: c.date?.when ?? null, what: c.date?.what ?? null });
  const reading = { read: 23, total: 24, pending: 0, failed: 0 };
  const base = { day: "2026-11-15", justIn: [], missed: [], handful: [], thin: null, reminders: [], resurfaced: null, cleared: false, reading };
  const dentistSet = { ...dentist, ...set(local(2026, 11, 23, 9, 0, tz)) };
  const out: Record<string, Partial<TodayData>> = {
    "td-1": { handful: [dentist, bill, wifi] },
    "td-2": { justIn: [flyer], handful: [dentist, bill] },
    "td-3": { handful: [dentist, bill, wifi], reading: { ...reading, pending: 1 } },
    "td-14": { handful: [dentist, bill, wifi], reading: { ...reading, failed: 4 } },
    "td-4": { handful: [dentistSet, bill, wifi] },
    "td-7": { cleared: true, reminders: [reminderRow("r1", dentist, local(2026, 11, 23, 9, 0, tz)), reminderRow("r2", bill, local(2026, 11, 20, 9, 0, tz))] },
    "td-10": { reading: { read: 0, total: 0, pending: 0, failed: 0 } },
    extras: {
      handful: [bill],
      resurfaced: recipe,
      reminders: [reminderRow("r1", dentist, local(2026, 11, 23, 9, 0, tz))],
    } as Partial<TodayData>,
  };
  if (kind === "loading") return { data: undefined, now };
  return { data: { ...base, ...(out[kind] ?? out["td-1"]) } as TodayData, now };
}

// Dev-only: a to-do list for ?preview=td-15, with room and date borrowed from the demo screenshots above.
export function previewTodos(kind: string): { todos: TodoItem[]; shots: [string, ShotInfo][] } | null {
  if (kind !== "td-15") return null;
  const t = (n: number, textLine: string, shot: string | null, done = false): TodoItem => ({ _id: `t${n}`, text: textLine, done, screenshotId: shot, createdAt: n });
  return {
    todos: [
      t(1, "Confirm the dentist cleaning", "demo-04"),
      t(2, "Pay the energy bill", "demo-15"),
      t(3, "Share the wifi password with Sam", "demo-08"),
      t(4, "Sign up for the pottery class", "demo-01"),
      t(5, "Buy miso for the pasta", "demo-18"),
      t(6, "Call the landlord back", null),
      t(7, "Renew the parking permit", null),
      t(8, "Email Mom the photos", null, true),
    ],
    shots: [
      ["demo-04", { category: "deadlines", date: "2026-11-24T15:00" }],
      ["demo-15", { category: "money", date: "2026-11-21" }],
      ["demo-08", { category: "chats", date: null }],
      ["demo-01", { category: "deadlines", date: "2026-11-22T10:00" }],
      ["demo-18", { category: "ideas", date: null }],
    ],
  };
}
