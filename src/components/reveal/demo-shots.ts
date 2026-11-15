// Fixture screenshots for the reveal, from the demo set. Used only when FIXTURES is on and a room has no real screenshot yet.
export const FIXTURE_SHOT = {
  tock: { uri: require("../../content/demo/flyer_tomorrow.png") as number, title: "Pottery class sign-up" },
  penny: { uri: require("../../content/demo/bill.png") as number, title: "Greenleaf grocery receipt" },
  murmur: { uri: require("../../content/demo/chat_plans.png") as number, title: "Dinner Saturday" },
  mote: { uri: require("../../content/demo/recipe.png") as number, title: "Olive butter pasta" },
} as const;
