import manifest from "../../../demo-screenshots/manifest.json";
import { assetUri } from "@/components/remind/fixture";
import { whenLabel } from "@/components/remind/plan";
import { DEMO_FLYER } from "@/lib/fixtures";
import type { AskResult, Shots } from "./AnswerBlock";

// Dev-only fallback (FIXTURES on and the ask action threw). Built from the demo screenshot manifest, never shipped as real data.
const flyer = manifest[0]!;
const uri = assetUri(require("../../../demo-screenshots/png/01-pottery-flyer.png"));
const closes = flyer.dates[0]!;

export const demoResult: AskResult = {
  answer: `${closes.what} ${whenLabel(closes.when)}.`,
  found: true,
  sources: [{ screenshotId: DEMO_FLYER.id as never, title: flyer.title, imageUrl: uri }],
};

export const demoShots = {
  [DEMO_FLYER.id]: {
    _id: DEMO_FLYER.id,
    status: "ready",
    title: flyer.title,
    summary: flyer.summary,
    reason: flyer.reason,
    amount: null,
    category: flyer.room,
    userMoved: false,
    lineKey: null,
    imageUrl: uri,
    importance: flyer.importance,
    takenAt: Date.parse(DEMO_FLYER.savedAt),
    error: null,
    dates: flyer.dates.map((d) => ({ ...d, reminder: null })),
  },
} as unknown as Shots;
