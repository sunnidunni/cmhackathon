import lines from "../../src/content/lines.json";

export const CATEGORIES = ["deadlines", "chats", "money", "ideas", "unsorted"] as const;
export type Category = (typeof CATEGORIES)[number];

function playfulKeys(category: Category): string[] {
  const group =
    category === "unsorted"
      ? lines.unsorted.lines
      : lines.rooms[category].lines;
  return Object.keys(group).filter((key) => /_\d\d$/.test(key));
}

export const PLAYFUL_KEYS: Record<Category, string[]> = {
  deadlines: playfulKeys("deadlines"),
  chats: playfulKeys("chats"),
  money: playfulKeys("money"),
  ideas: playfulKeys("ideas"),
  unsorted: playfulKeys("unsorted"),
};
