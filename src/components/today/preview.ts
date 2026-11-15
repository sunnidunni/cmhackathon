import { Image } from "react-native";
import { DEMO_FLYER, DEMO_SHOTS } from "@/lib/fixtures";
import type { TodayData } from "./model";

const titleOf = (id: string) => DEMO_SHOTS.find((s) => s.id === id)?.title ?? id;

const demo = (module: number) => Image.resolveAssetSource(module)?.uri ?? null;

type Card = TodayData["handful"][number];

const local = (y: number, m: number, d: number, h: number, min: number, tz: number) => Date.UTC(y, m - 1, d, h, min) + tz * 60000;

// Dev-only: today.get-shaped demo data for the demo world (Sun Nov 15), used when FIXTURES is on and a ?preview= is given.
export function previewToday(kind: string, tz: number): { data: TodayData | undefined; now: number } {
  const now = local(2026, 11, 15, 9, 41, tz);
  const card = (id: string, title: string, category: Card["category"], when: string | null, what: string, savedDay: number, over: Partial<Card> = {}): Card =>
    ({
      _id: id,
      title,
      category,
      lineKey: null,
      imageUrl: null,
      importance: 4,
      takenAt: local(2026, 11, savedDay, 12, 0, tz),
      date: when ? { when, what, confident: true } : null,
      reminder: null,
      actions: when ? { primary: "remind", secondary: "done" } : { primary: "keep", secondary: "delete" },
      ...over,
    }) as Card;
  const set = (dueAt: number): Partial<Card> => ({ reminder: { id: "r" as never, state: "scheduled", dueAt }, actions: { primary: "done", secondary: "detail" } });
  const dentist = card("dentist", titleOf("d1"), "deadlines", "2026-11-17T15:00", "appointment", 9, { imageUrl: demo(require("@/content/demo/appointment.png")) });
  const rent = card("rent", titleOf("m1"), "money", "2026-12-01", "rent due", 12, { imageUrl: demo(require("@/content/demo/bill.png")) });
  const wifi = card("wifi", titleOf("c1"), "chats", null, "", 5, { imageUrl: demo(require("@/content/demo/chat.png")) });
  const recipe = card("recipe", titleOf("i1"), "ideas", null, "", 4, { importance: 2, imageUrl: demo(require("@/content/demo/recipe.png")) });
  const flyer = card("flyer", DEMO_FLYER.title, "deadlines", "2026-11-20", "sign-up closes", 15, { takenAt: local(2026, 11, 15, 9, 12, tz) });
  const reading = { read: 15, total: 16, pending: 0, failed: 0 };
  const base = { day: "2026-11-15", justIn: [], missed: [], handful: [], thin: null, reminders: [], resurfaced: null, cleared: false, reading };
  const out: Record<string, Partial<TodayData>> = {
    "td-1": { handful: [dentist, rent, wifi] },
    "td-2": { justIn: [flyer], handful: [dentist, rent] },
    "td-3": { handful: [dentist, rent, wifi], reading: { ...reading, pending: 1 } },
    "td-4": { handful: [{ ...dentist, ...set(local(2026, 11, 16, 9, 0, tz)) }, rent, wifi] },
    "td-7": { handful: [{ ...dentist, ...set(local(2026, 11, 16, 9, 0, tz)) }, { ...rent, ...set(local(2026, 11, 30, 9, 0, tz)) }, { ...wifi, actions: { primary: "done", secondary: "detail" } }] },
    extras: {
      handful: [rent],
      resurfaced: recipe,
      reminders: [{ reminderId: "r1", screenshotId: "dentist", title: "Dentist booking", imageUrl: dentist.imageUrl, category: "deadlines", dueAt: local(2026, 11, 16, 9, 0, tz), when: "2026-11-17T15:00", what: "appointment" }],
    } as Partial<TodayData>,
    "td-10": { reading: { read: 0, total: 0, pending: 0, failed: 0 } },
  };
  if (kind === "loading") return { data: undefined, now };
  return { data: { ...base, ...(out[kind] ?? out["td-1"]) } as TodayData, now };
}
