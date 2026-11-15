import type { RoomKey } from "@/design/theme";
import { shotVariantFor, type ShotVariant } from "@/design/psst/ShotSticker";
import { DEV_TOOLS } from "./dev-flags";

export const FIXTURES = DEV_TOOLS;

export const DEMO_TODAY = "2026-11-15";

export type DemoShot = {
  id: string;
  title: string;
  room: RoomKey | "unsorted";
  date?: string;
  amount?: string;
  savedAt: string;
  keeperLine: string;
  variant?: ShotVariant;
};

const shot = (s: Omit<DemoShot, "variant">): DemoShot => ({ ...s, variant: shotVariantFor(s.title) });

export const DEMO_SHOTS: DemoShot[] = [
  shot({ id: "d1", title: "Dentist booking", room: "deadlines", date: "Tue, Nov 17, 3:00 PM", savedAt: "2026-11-10T09:30:00-08:00", keeperLine: "Tuesday at 3. I set three imaginary alarms." }),
  shot({ id: "d2", title: "Library book due", room: "deadlines", date: "Sat, Nov 28", savedAt: "2026-11-12T18:05:00-08:00", keeperLine: "Nov 28. Thirteen days. I'm calm." }),
  shot({ id: "d3", title: "Team offsite schedule", room: "deadlines", date: "Fri, Dec 4, 9:30 AM", savedAt: "2026-11-09T11:20:00-08:00", keeperLine: "Dec 4 at 9:30. I'll pace until then." }),
  shot({ id: "c1", title: "Wi-Fi password from Mom", room: "chats", savedAt: "2026-10-21T19:40:00-07:00", keeperLine: "I read it. I'm telling no one." }),
  shot({ id: "c2", title: "Saturday brunch plan", room: "chats", date: "Sat, Nov 21, 11:00 AM", savedAt: "2026-11-13T14:10:00-08:00", keeperLine: "Brunch at 11. Waffles were demanded." }),
  shot({ id: "c3", title: "Landlord about the heater", room: "chats", savedAt: "2026-11-11T08:15:00-08:00", keeperLine: "“This week.” I wrote that down." }),
  shot({ id: "c4", title: "Aoife's scarecrow joke", room: "chats", savedAt: "2026-11-02T21:00:00-08:00", keeperLine: "I laughed. Quietly." }),
  shot({ id: "m1", title: "Rent due Dec 1", room: "money", date: "Tue, Dec 1", amount: "$1,450.00", savedAt: "2026-11-14T10:00:00-08:00", keeperLine: "Rent is due Dec 1. $1,450." }),
  shot({ id: "m2", title: "Flight to Seattle", room: "money", date: "Wed, Dec 2, 7:15 AM", savedAt: "2026-11-06T16:45:00-08:00", keeperLine: "Dec 2 at 7:15 AM. Window seat, nice." }),
  shot({ id: "m3", title: "Paper table lamp", room: "money", amount: "$49.00", savedAt: "2026-10-03T13:25:00-07:00", keeperLine: "$49 when you saved it, Oct 3. Prices change." }),
  shot({ id: "m4", title: "Greenleaf grocery receipt", room: "money", date: "Nov 8, 6:42 PM", amount: "$38.12", savedAt: "2026-11-08T18:42:00-08:00", keeperLine: "$38.12 on Nov 8. One line is a refund still marked pending." }),
  shot({ id: "i1", title: "Miso butter pasta", room: "ideas", savedAt: "2026-10-04T12:00:00-07:00", keeperLine: "Six weeks in the jar. Still sounds delicious." }),
  shot({ id: "i2", title: "Lemon olive oil cake", room: "ideas", savedAt: "2026-09-27T09:00:00-07:00", keeperLine: "A cake for later. Later is a lovely place." }),
  shot({ id: "i4", title: "Tidewater Coffee, Ballard", room: "ideas", savedAt: "2026-10-30T15:30:00-07:00", keeperLine: "For a someday morning in Ballard." }),
  shot({ id: "i5", title: "Start before you're ready", room: "ideas", savedAt: "2026-09-14T08:00:00-07:00", keeperLine: "Small and bright. Like me." }),
  shot({ id: "u1", title: "Blurry sign", room: "unsorted", savedAt: "2026-10-12T17:20:00-07:00", keeperLine: "I squinted. No luck. You decide." }),
];

export const DEMO_FLYER: DemoShot & { closes: string; savedLabel: string; reminderLabel: string } = {
  id: "f1",
  title: "Pottery class sign-up",
  room: "deadlines",
  date: "Fri, Nov 20",
  savedAt: "2026-11-15T09:12:00-08:00",
  savedLabel: "today, 9:12 AM",
  closes: "Fri, Nov 20",
  keeperLine: "Closes Friday. I already started worrying for you.",
  reminderLabel: "Remind me Thu 9:00 AM",
  variant: "flyer",
};

export const DEMO_RECEIPT = {
  id: "m4",
  title: "Greenleaf grocery receipt",
  merchant: "Greenleaf",
  total: "$38.12",
  date: "Nov 8",
  time: "6:42 PM",
  refund: { amount: "$6.49", status: "pending" },
  lines: [
    { name: "Oat milk", amount: "4.99" },
    { name: "Sourdough", amount: "6.49" },
    { name: "Olive oil", amount: "12.99" },
    { name: "Coffee beans", amount: "14.99" },
    { name: "Apples", amount: "5.15" },
    { name: "Refund pending", amount: "-6.49" },
  ],
  reveal: "Penny Pocket found a refund still marked pending. $6.49 at Greenleaf, Nov 8",
  source: "From the receipt. Psst can't see your bank.",
  pennyLine: "Pending since Nov 8. Worth a look.",
  keeperLine: "$38.12 on Nov 8. One line is a refund still marked pending.",
  variant: "receipt",
} as const;

export const DEMO_ANSWER = {
  question: "When is that due?",
  answer: "Pottery class sign-up closes Friday, Nov 20.",
  source: "from a screenshot saved today, 9:12 AM",
  shotId: DEMO_FLYER.id,
  reminderLabel: "Remind me Thu 9:00 AM",
  reminderNote: "The day before it closes. One reminder. Change it or turn it off later.",
} as const;

export const DEMO_COUNTS = {
  tock: 3,
  murmur: 4,
  penny: 4,
  mote: 4,
  read: 15,
  unsorted: 1,
  total: 16,
} as const;
