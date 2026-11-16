import { Asset } from "expo-asset";
import { useLocalSearchParams } from "expo-router";
import manifest from "../../../demo-screenshots/manifest.json";
import { psstLine } from "@/design/psst";
import { FIXTURES } from "@/lib/fixtures";
import { useOffline } from "@/lib/offline";
import { dateLabel, weekdayName, type Category } from "./format";

// Fixtures fill in only when the real list is empty, and only in a dev-tools build. Add ?fixtures=off to see the real empty states.
export function useDemoFallback(): boolean {
  const { fixtures } = useLocalSearchParams<{ fixtures?: string }>();
  const offline = useOffline();
  return offline || (FIXTURES && fixtures !== "off");
}

const PNG: Record<string, number> = {
  "01-pottery-flyer.png": require("../../../demo-screenshots/png/01-pottery-flyer.png"),
  "02-course-syllabus.png": require("../../../demo-screenshots/png/02-course-syllabus.png"),
  "03-concert-ticket.png": require("../../../demo-screenshots/png/03-concert-ticket.png"),
  "04-dentist-text.png": require("../../../demo-screenshots/png/04-dentist-text.png"),
  "05-visa-email.png": require("../../../demo-screenshots/png/05-visa-email.png"),
  "06-hackathon-post.png": require("../../../demo-screenshots/png/06-hackathon-post.png"),
  "07-dinner-chat.png": require("../../../demo-screenshots/png/07-dinner-chat.png"),
  "08-wifi-chat.png": require("../../../demo-screenshots/png/08-wifi-chat.png"),
  "09-rent-chat.png": require("../../../demo-screenshots/png/09-rent-chat.png"),
  "10-party-address.png": require("../../../demo-screenshots/png/10-party-address.png"),
  "11-book-dm.png": require("../../../demo-screenshots/png/11-book-dm.png"),
  "12-coffee-receipt.png": require("../../../demo-screenshots/png/12-coffee-receipt.png"),
  "13-order-confirmation.png": require("../../../demo-screenshots/png/13-order-confirmation.png"),
  "14-boarding-pass.png": require("../../../demo-screenshots/png/14-boarding-pass.png"),
  "15-utility-bill.png": require("../../../demo-screenshots/png/15-utility-bill.png"),
  "16-headphones-product.png": require("../../../demo-screenshots/png/16-headphones-product.png"),
  "17-refund.png": require("../../../demo-screenshots/png/17-refund.png"),
  "18-miso-pasta.png": require("../../../demo-screenshots/png/18-miso-pasta.png"),
  "19-quote-card.png": require("../../../demo-screenshots/png/19-quote-card.png"),
  "20-map-recommendation.png": require("../../../demo-screenshots/png/20-map-recommendation.png"),
  "21-article-tip.png": require("../../../demo-screenshots/png/21-article-tip.png"),
  "22-ai-answer.png": require("../../../demo-screenshots/png/22-ai-answer.png"),
  "23-workout-plan.png": require("../../../demo-screenshots/png/23-workout-plan.png"),
  "24-blurry-meme.png": require("../../../demo-screenshots/png/24-blurry-meme.png"),
};

type ManifestItem = { file: string; room: string; title: string; summary: string; dates: { when: string; what: string; confident: boolean }[]; reason: string };

export type DemoRow = {
  id: string;
  title: string;
  category: Category;
  date: string | null;
  dates: { when: string; what: string; confident: boolean }[];
  summary: string;
  reason: string;
  imageUrl: string | null;
  takenAt: number;
  sub: string | null;
  keeperLine: string | null;
};

const TODAY_9_12 = Date.parse("2026-11-15T09:12:00-08:00");

const keeperLine = (category: Category, title: string, date: string | null): string | null => {
  if (category === "deadlines") return date ? psstLine("tock.handful.dated", { title, weekday: weekdayName(date) }) : null;
  if (category === "chats") return psstLine("murmur.handful", { title });
  if (category === "money") return psstLine("penny.intro");
  if (category === "ideas") return psstLine("mote.intro");
  return null;
};

// The 24 fictional demo screenshots, in manifest order, newest first. Dates come straight from the manifest, never a hard-coded weekday.
export const DEMO_ROWS: DemoRow[] = (manifest as ManifestItem[]).map((m, i) => {
  const date = m.dates.find((d) => d.confident)?.when ?? null;
  const key = m.file.replace("png/", "");
  return {
    id: `demo-${key.slice(0, 2)}`,
    title: m.title,
    category: m.room as Category,
    date,
    dates: m.dates,
    summary: m.summary,
    reason: m.reason,
    imageUrl: Asset.fromModule(PNG[key]).uri,
    takenAt: TODAY_9_12 - i * 18 * 3600000,
    sub: date ? dateLabel(date) : null,
    keeperLine: keeperLine(m.room as Category, m.title, date),
  };
});

export const demoRoom = (category: Category) => DEMO_ROWS.filter((r) => r.category === category);
export const isDemoId = (id: string) => id.startsWith("demo-");
export const demoById = (id: string) => DEMO_ROWS.find((r) => r.id === id) ?? null;
