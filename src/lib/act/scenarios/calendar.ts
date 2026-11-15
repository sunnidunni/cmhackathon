import type { ActScenario } from "../types";
import { CONCERT_IMAGE } from "./images";

export const scenario: ActScenario = {
  id: "concert-calendar",
  keeper: "tock",
  source: {
    shotId: "03-concert-ticket",
    image: CONCERT_IMAGE,
    title: "Juniper Vale concert",
    at: "Nov 14, 10:00 AM",
  },
  noticed: "You have tickets for Juniper Vale on Nov 22.",
  why: "Your screenshot says doors are Nov 22, 8:00 PM at Northline Hall.",
  ready: "Ready to add it to your calendar with a leave-by reminder. Nothing is added yet.",
  cta: "Review event",
  steps: [
    {
      kind: "calendar",
      title: "Juniper Vale at Northline Hall",
      when: "Nov 22, 8:00 PM (doors)",
      where: "Northline Hall",
      leaveBy: "7:15 PM",
    },
  ],
  confirm: {
    title: "Add this to your calendar?",
    lines: ["The leave-by time is an estimate. Check your travel time before you go."],
    button: "Add to Calendar",
  },
  done: "Demo: nothing was added.",
};
