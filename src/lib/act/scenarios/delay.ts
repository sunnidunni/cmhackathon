// Scripted: the claim send, the airline reply, the approval and the payout timeline. Real: send the email with expo-mail-composer; claim status and payout would come from the airline or a claims partner.
import type { ActScenario } from "../types";
import { FLIGHT_LATE_IMAGE } from "./images";

export const scenario: ActScenario = {
  id: "flight-eu261",
  keeper: "tock",
  flowKeeper: "penny",
  source: { image: FLIGHT_LATE_IMAGE, title: "Flight landed late", at: "9:07 PM" },
  noticed: "Your flight home was 6 hours late. You're owed €600.",
  why: "EU rule 261/2004: long-haul delay over 3 hours.",
  ready: "Your screenshot says NW 88 landed 6 h 5 min late. A claim email is ready. The airline can say no, and nothing is sent.",
  cta: "Review claim",
  steps: [
    {
      kind: "email-draft",
      to: "claims@northwind.example",
      subject: "EU 261/2004 compensation claim: flight NW 88, Nov 14",
      body: "Hello,\n\nI was a passenger on Northwind flight NW 88 from Lisbon (LIS) to San Francisco (SFO) on Nov 14, booking reference NWQ4TZ. The flight was due to arrive at 2:40 PM and landed at 8:45 PM, a delay of 6 hours 5 minutes.\n\nUnder Regulation (EC) No 261/2004, I am claiming €600 compensation for a delay of more than 3 hours on a flight over 3,500 km. Please confirm you received this and tell me when to expect payment.\n\nThank you,\nAlex Rowan",
    },
  ],
  confirm: {
    title: "Send this claim to Northwind?",
    lines: ["Any payment comes from the airline, not from Shots."],
    button: "Send claim",
  },
  done: "Demo: nothing was sent.",
  doneFixture: "Claim sent to the airline.",
  timeline: {
    caption: "Timeline. Days count from landing.",
    rows: [
      { label: "Claim sent", when: "Day 1" },
      { label: "Airline replied", when: "Day 4" },
      { label: "Approved", when: "Day 14" },
      { label: "Paid €600 (about $700)", when: "Day 21" },
    ],
  },
};
