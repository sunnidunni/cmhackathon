import { Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { DEMO_FLYER, DEMO_SHOTS, FIXTURES, type DemoShot } from "@/lib/fixtures";
import { dateLabel, type Category } from "./format";

// Fixtures fill in only when the real list is empty, and only in a dev-tools build. Add ?fixtures=off to see the real empty states.
export function useDemoFallback(): boolean {
  const { fixtures } = useLocalSearchParams<{ fixtures?: string }>();
  return FIXTURES && fixtures !== "off";
}

const PNG = {
  appointment: require("../../content/demo/appointment.png"),
  bill: require("../../content/demo/bill.png"),
  flight: require("../../content/demo/flight.png"),
  product: require("../../content/demo/product.png"),
  chat_plans: require("../../content/demo/chat_plans.png"),
  chat: require("../../content/demo/chat.png"),
  recipe: require("../../content/demo/recipe.png"),
  quote: require("../../content/demo/quote.png"),
  article: require("../../content/demo/article.png"),
};

const ART: [RegExp, keyof typeof PNG][] = [
  [/dentist/i, "appointment"],
  [/rent/i, "bill"],
  [/flight/i, "flight"],
  [/lamp/i, "product"],
  [/brunch/i, "chat_plans"],
  [/wi-?fi|heater|scarecrow/i, "chat"],
  [/pasta|cake/i, "recipe"],
  [/start before/i, "quote"],
  [/tidewater/i, "article"],
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Tue, Nov 17, 3:00 PM" or "Sat, Nov 28" to the "2026-11-17T15:00" form the backend stores.
function demoWhen(display: string | undefined): string | null {
  const m = display ? /([A-Z][a-z]{2}) (\d{1,2})(?:, (\d{1,2}):(\d{2}) (AM|PM))?$/.exec(display) : null;
  if (!m) return null;
  const mo = String(MONTHS.indexOf(m[1]) + 1).padStart(2, "0");
  const day = m[2].padStart(2, "0");
  if (!m[3]) return `2026-${mo}-${day}`;
  const hh = (Number(m[3]) % 12) + (m[5] === "PM" ? 12 : 0);
  return `2026-${mo}-${day}T${String(hh).padStart(2, "0")}:${m[4]}`;
}

export type DemoRow = {
  id: string;
  title: string;
  category: Category;
  date: string | null;
  amount: string | null;
  imageUrl: string | null;
  takenAt: number;
  sub: string | null;
  keeperLine: string;
};

const toRow = (s: DemoShot): DemoRow => {
  const art = ART.find(([re]) => re.test(s.title));
  const date = demoWhen(s.date);
  return {
    id: `demo-${s.id}`,
    title: s.title,
    category: s.room,
    date,
    amount: s.amount ?? null,
    imageUrl: art ? (Image.resolveAssetSource(PNG[art[1]])?.uri ?? null) : null,
    takenAt: Date.parse(s.savedAt),
    sub: [s.amount, date ? dateLabel(date) : null].filter(Boolean).join(" · ") || null,
    keeperLine: s.keeperLine,
  };
};

export const DEMO_ROWS: DemoRow[] = [...DEMO_SHOTS, DEMO_FLYER].map(toRow).sort((a, b) => b.takenAt - a.takenAt);
export const demoRoom = (category: Category) => DEMO_ROWS.filter((r) => r.category === category);
export const isDemoId = (id: string) => id.startsWith("demo-");
export const demoById = (id: string) => DEMO_ROWS.find((r) => r.id === id) ?? null;
