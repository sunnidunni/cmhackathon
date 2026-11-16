// Scripted: Mom's reply, the order and the tracker are fixtures; the real integration would read her reply from Messages and place and track the order through a delivery partner's API.
export const PIZZA_ORDER = {
  scenarioId: "mom-pizza",
  replyFrom: "Mom",
  reply: "Pepperoni, large",
  replyDelayMs: 1400,
  cardDelayMs: 600,
  merchant: "Tony's Pizza Napoletana",
  merchantNote: "Your usual · 1.2 mi away",
  items: [
    { name: "1 large pepperoni", price: "$18.50" },
    { name: "Delivery and fees", price: "$3.25" },
    { name: "Tip", price: "$3.00" },
  ],
  total: "$24.75",
  deliverTo: "Home · 418 Alder Lane, Apt 3",
  payWith: "Apple Pay",
  etaMinutes: 32,
  stages: ["Confirmed", "In the oven", "On its way"],
  stageMs: 1600,
} as const;

export function arrivalTime(from: Date, minutes: number) {
  const at = new Date(from.getTime() + minutes * 60_000);
  const h = at.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(at.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
