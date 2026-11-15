import type { ActScenario } from "../types";

export const scenario: ActScenario = {
  id: "flight-delay",
  keeper: "tock",
  source: { image: null, title: "Flight alert", at: "2:14 PM" },
  noticed: "Your flight to Seattle is delayed 1 h 40 min.",
  why: "Your screenshot says CA 482 now leaves 7:25 PM, was 5:45 PM.",
  didOnOwn: "Tock moved your airport reminder from 3:30 PM to 5:10 PM.",
  ready: "A text to Sam is ready. As of your screenshot. Delays change. Check the airline before you leave.",
  cta: "Review text to Sam",
  steps: [
    { kind: "move-reminder", from: "3:30 PM", to: "5:10 PM" },
    { kind: "draft-message", to: "Sam (picking you up)", via: "iMessage", body: "Flight's delayed, landing 9:55 PM now instead of 8:15. Sorry!" },
  ],
  confirm: {
    title: "Send this to Sam?",
    lines: ["As of your screenshot. Delays change. Check the airline before you leave."],
    button: "Send to Sam",
  },
  done: "Demo: nothing was sent.",
};
