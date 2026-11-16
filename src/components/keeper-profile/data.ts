import type { KeeperId } from "@/design/psst";

export type KeeperProfile = {
  intro: string;
  keeps: string[];
  never: string[];
  sampleCount: number;
};

export const KEEPER_PROFILES: Record<KeeperId, KeeperProfile> = {
  tock: {
    intro: "Anything with a date on it comes to me.",
    keeps: ["Sign-ups and RSVPs with a date", "Bookings and check-in times", "Things due back, like returns and library books"],
    never: ["Count how late you are", "Ring more than you asked me to", "Make a date sound scarier than it is"],
    sampleCount: 12,
  },
  murmur: {
    intro: "Screenshots of conversations come to me.",
    keeps: ["Plans made in group chats", "Addresses and door codes", "Who said they'd bring what"],
    never: ["Quote a chat back at you", "Send anything to anyone", "Judge what was said"],
    sampleCount: 9,
  },
  penny: {
    intro: "Receipts, bills and tickets come to me.",
    keeps: ["Receipts and order confirmations", "Bills and when they're due", "Tickets and things to buy later"],
    never: ["Comment on what you spent", "React to an amount", "Pay for anything"],
    sampleCount: 17,
  },
  mote: {
    intro: "Recipes, places and quotes come to me.",
    keeps: ["Recipes you meant to try", "Places to go someday", "Quotes and saved answers"],
    never: ["Ask when you'll get to it", "Throw an idea out for being old", "Rank one idea over another"],
    sampleCount: 23,
  },
};

export const ROOM_NAME: Record<KeeperId, string> = { tock: "Deadlines", murmur: "Chats", penny: "Money", mote: "Ideas" };
