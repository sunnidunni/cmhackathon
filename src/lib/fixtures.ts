import manifest from "../../demo-screenshots/manifest.json";
import type { RoomKey } from "@/design/theme";
import { psstLine } from "@/design/psst/lines";
import { DEV_TOOLS } from "./dev-flags";

export const FIXTURES = DEV_TOOLS;

export const DEMO_TODAY = "2026-11-15";

const IMAGES: Record<string, number> = {
  "01-pottery-flyer": require("../../demo-screenshots/png/01-pottery-flyer.png"),
  "02-course-syllabus": require("../../demo-screenshots/png/02-course-syllabus.png"),
  "03-concert-ticket": require("../../demo-screenshots/png/03-concert-ticket.png"),
  "04-dentist-text": require("../../demo-screenshots/png/04-dentist-text.png"),
  "05-visa-email": require("../../demo-screenshots/png/05-visa-email.png"),
  "06-hackathon-post": require("../../demo-screenshots/png/06-hackathon-post.png"),
  "07-dinner-chat": require("../../demo-screenshots/png/07-dinner-chat.png"),
  "08-wifi-chat": require("../../demo-screenshots/png/08-wifi-chat.png"),
  "09-rent-chat": require("../../demo-screenshots/png/09-rent-chat.png"),
  "10-party-address": require("../../demo-screenshots/png/10-party-address.png"),
  "11-book-dm": require("../../demo-screenshots/png/11-book-dm.png"),
  "12-coffee-receipt": require("../../demo-screenshots/png/12-coffee-receipt.png"),
  "13-order-confirmation": require("../../demo-screenshots/png/13-order-confirmation.png"),
  "14-boarding-pass": require("../../demo-screenshots/png/14-boarding-pass.png"),
  "15-utility-bill": require("../../demo-screenshots/png/15-utility-bill.png"),
  "16-headphones-product": require("../../demo-screenshots/png/16-headphones-product.png"),
  "17-refund": require("../../demo-screenshots/png/17-refund.png"),
  "18-miso-pasta": require("../../demo-screenshots/png/18-miso-pasta.png"),
  "19-quote-card": require("../../demo-screenshots/png/19-quote-card.png"),
  "20-map-recommendation": require("../../demo-screenshots/png/20-map-recommendation.png"),
  "21-article-tip": require("../../demo-screenshots/png/21-article-tip.png"),
  "22-ai-answer": require("../../demo-screenshots/png/22-ai-answer.png"),
  "23-workout-plan": require("../../demo-screenshots/png/23-workout-plan.png"),
  "24-blurry-meme": require("../../demo-screenshots/png/24-blurry-meme.png"),
};

type ManifestRow = (typeof manifest)[number];

export type DemoShot = {
  id: string;
  title: string;
  room: RoomKey | "unsorted";
  summary: string;
  text: string;
  dates: { when: string; what: string; confident: boolean }[];
  importance: number;
  reason: string;
  date?: string;
  amount?: string;
  savedAt: string;
  keeperLine: string;
  image: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateLabel(when: string): string {
  const [day, time] = when.split("T");
  const [, month, date] = day.split("-").map(Number);
  const label = `${MONTHS[month - 1]} ${date}`;
  if (!time) return label;
  const [h, min] = time.split(":").map(Number);
  return `${label}, ${h % 12 || 12}:${String(min).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function keeperLineFor(row: ManifestRow, date: string | undefined, amount: string | undefined): string {
  if (row.room === "deadlines") return `${row.title} is on ${date}. I'll ring first.`;
  if (row.room === "chats") return psstLine("murmur.handful", { title: row.title });
  if (row.room === "money") return date && amount ? psstLine("penny.due", { title: row.title, date, amount }) : `${row.title}. Kept in Money.`;
  if (row.room === "ideas") return `${row.title}. Saved for a someday.`;
  return "I squinted. No luck. You decide.";
}

function toShot(row: ManifestRow): DemoShot {
  const id = row.file.slice(4, -4);
  const date = row.dates[0] ? dateLabel(row.dates[0].when) : undefined;
  const amount = row.room === "money" ? row.text.match(/\$\d[\d,]*(?:\.\d{2})?/)?.[0] : undefined;
  return {
    id,
    title: row.title,
    room: row.room as DemoShot["room"],
    summary: row.summary,
    text: row.text,
    dates: row.dates,
    importance: row.importance,
    reason: row.reason,
    date,
    amount,
    savedAt: id.startsWith("01-") ? "2026-11-15T09:12:00-08:00" : "2026-11-14T10:00:00-08:00",
    keeperLine: keeperLineFor(row, date, amount),
    image: IMAGES[id],
  };
}

export const DEMO_SHOTS: DemoShot[] = manifest.map(toShot);

const byId = (id: string): DemoShot => {
  const found = DEMO_SHOTS.find((s) => s.id === id);
  if (!found) throw new Error(`Missing demo shot ${id}`);
  return found;
};

export const DEMO_FLYER = {
  ...byId("01-pottery-flyer"),
  savedLabel: "today, 9:12 AM",
  closes: "Nov 20",
  reminderLabel: "Remind me Nov 20, 9:00 AM",
};

export const DEMO_RECEIPT = {
  ...byId("17-refund"),
  merchant: "Cloudstep",
  reveal: "Penny Pocket found a refund for your Cloudstep lamp. $38.00, Nov 15.",
};

export const DEMO_ANSWER = {
  question: "When does the pottery sign-up close?",
  answer: "Pottery night sign-up closes Nov 20.",
  source: "from a screenshot saved today, 9:12 AM",
  shotId: DEMO_FLYER.id,
  reminderLabel: DEMO_FLYER.reminderLabel,
  reminderNote: "The day before it closes. One reminder. Change it or turn it off later.",
};

const inRoom = (room: DemoShot["room"]) => DEMO_SHOTS.filter((s) => s.room === room).length;

export const DEMO_COUNTS = {
  tock: inRoom("deadlines"),
  murmur: inRoom("chats"),
  penny: inRoom("money"),
  mote: inRoom("ideas"),
  unsorted: inRoom("unsorted"),
  read: DEMO_SHOTS.length - inRoom("unsorted"),
  total: DEMO_SHOTS.length,
};
