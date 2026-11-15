import { DEMO_ANSWER, DEMO_FLYER } from "@/lib/fixtures";
import type { AskResult, Shots } from "./AnswerBlock";

// Dev-only fallback (FIXTURES on and the ask action threw). Built from the demo world, never shipped as real data.
export const demoResult: AskResult = {
  answer: DEMO_ANSWER.answer,
  found: true,
  sources: [{ screenshotId: DEMO_FLYER.id as never, title: DEMO_FLYER.title, imageUrl: null }],
};

export const demoShots = {
  [DEMO_FLYER.id]: {
    _id: DEMO_FLYER.id,
    status: "ready",
    title: DEMO_FLYER.title,
    summary: "",
    reason: "",
    amount: null,
    category: "deadlines",
    userMoved: false,
    lineKey: null,
    imageUrl: null,
    importance: 4,
    takenAt: Date.parse(DEMO_FLYER.savedAt),
    error: null,
    dates: [{ when: "2026-11-20", what: "Sign-up closes", confident: true, reminder: null }],
  },
} as unknown as Shots;
