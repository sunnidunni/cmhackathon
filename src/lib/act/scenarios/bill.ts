// Scripted: the email draft and its send (no email is sent). Real: expo-mail-composer opens the draft in the mail app (not installed yet); the address is a demo address.
import type { ActScenario } from "../types";
import { BILL_IMAGE } from "./images";

export const scenario: ActScenario = {
  id: "bill-willow-grid",
  keeper: "penny",
  source: {
    shotId: "15-utility-bill",
    image: BILL_IMAGE,
    title: "Energy bill",
    at: "Nov 14, 10:00 AM",
  },
  noticed: "Your Willow Grid bill is due Nov 21.",
  why: "The bill in your screenshot says $51.30 is due Nov 21.",
  ready: "A draft email to Willow Grid is ready. Nothing is sent.",
  cta: "Review email",
  steps: [
    {
      kind: "email-draft",
      to: "billing@willowgrid.example",
      subject: "Question about account WG-4182",
      body: "Hello, my November bill for account WG-4182 shows $51.30 due Nov 21. Could you confirm the amount due and how I can pay it? Thank you.",
    },
  ],
  confirm: {
    title: "Send this email to Willow Grid?",
    lines: ["The address is a demo address, not from your bill.", "Penny Pocket never pays a bill. This email only asks."],
    button: "Send email",
  },
  done: "Demo: nothing was sent.",
};
