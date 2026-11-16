import type { KeeperId } from "@/design/psst";

export type FeedAction = {
  id: string;
  label: string;
  primary?: boolean;
  symbol?: "bell" | "pin" | "plus";
  reply: string;
};

export type FeedThread = {
  id: string;
  keeper: KeeperId;
  time?: string;
  lines: string[];
  source?: string;
  actions?: FeedAction[];
};

export const FEED_DAY = "Today · Sun, Nov 15";

export const FEED: FeedThread[] = [
  {
    id: "tock-dentist",
    keeper: "tock",
    time: "8:37 AM",
    lines: ["Two things are due this week: the dentist and the pottery sign-up.", "Want a reminder for the dentist one? It's Tue at 3:00 PM."],
    source: "From Dentist booking, saved Nov 9",
    actions: [
      { id: "remind", label: "Remind me Mon 9:00 AM", primary: true, symbol: "bell", reply: "Done. One reminder, Mon at 9:00 AM. Change it or turn it off later." },
      { id: "later", label: "Not now", reply: "Okay. It stays in Deadlines if you want it later." },
    ],
  },
  {
    id: "penny-refund",
    keeper: "penny",
    lines: ["One refund is still marked pending."],
    source: "From Greenleaf grocery receipt, Nov 8",
    actions: [
      { id: "tomorrow", label: "Add to tomorrow", symbol: "plus", reply: "Added to tomorrow's handful." },
      { id: "later", label: "Not now", reply: "No rush. It's in Money." },
    ],
  },
  {
    id: "murmur-wifi",
    keeper: "murmur",
    lines: ["I kept Mom's Wi-Fi code.", "Want it pinned so it's quick to find?"],
    source: "From Wi-Fi password from Mom, Oct 21",
    actions: [
      { id: "pin", label: "Pin it", symbol: "pin", reply: "Pinned. It's at the top of Chats." },
      { id: "later", label: "Not now", reply: "Sure. It's in Chats whenever you need it." },
    ],
  },
  {
    id: "mote-ideas",
    keeper: "mote",
    lines: ["Four ideas filed, quietly.", "The miso butter pasta waits with me."],
    source: "From Miso butter pasta, Oct 4",
  },
];
