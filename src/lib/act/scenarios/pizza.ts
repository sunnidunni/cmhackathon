import type { ActScenario } from "../types";
import { MOM_PIZZA_IMAGE } from "./images";

export const scenario: ActScenario = {
  id: "mom-pizza",
  keeper: "murmur",
  source: { image: MOM_PIZZA_IMAGE, title: "Text from Mom", at: "5:02 PM" },
  noticed: "Mom asked about pizza.",
  why: "Your screenshot at 5:02 PM is a text from Mom about dinner tonight.",
  ready: "I wrote a reply. Nothing is sent.",
  cta: "Review text to Mom",
  steps: [
    { kind: "draft-message", to: "Mom", via: "iMessage", body: "Which pizza do you want? Pepperoni again?", reply: "Pepperoni and a veggie, thanks!" },
    {
      kind: "order",
      merchant: "Tony's Pizza",
      items: [
        { name: "1 large pepperoni", price: "$18.50" },
        { name: "1 large veggie", price: "$19.00" },
        { name: "Delivery and fees", price: "$2.75" },
        { name: "Tip", price: "$1.50" },
      ],
      deliverTo: "Home · 418 Alder Lane",
      total: "$41.75",
      eta: "35–45 min",
    },
  ],
  confirm: {
    title: "Place this order?",
    lines: ["Ready: pizza for tonight. Nothing is ordered yet.", "Psst never orders on its own. It happens only when you tap."],
    price: "$41.75",
    button: "Place order · $41.75",
  },
  done: "Demo: nothing was ordered or charged.",
};
