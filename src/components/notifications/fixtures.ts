import type { KeeperId } from "@/design/psst";

export type PsstNotification = {
  id: string;
  keeper: KeeperId;
  line: string;
  minutesAgo: number;
  unread: boolean;
};

export const NOTIFICATIONS: PsstNotification[] = [
  { id: "n1", keeper: "tock", line: "Your library book is due Friday. I'll remind you again Thursday.", minutesAgo: 12, unread: true },
  { id: "n2", keeper: "murmur", line: "Maya asked about brunch on Saturday. It's in Chats when you're ready.", minutesAgo: 41, unread: true },
  { id: "n3", keeper: "penny", line: "Filed your Blue Bottle receipt in Money.", minutesAgo: 130, unread: false },
  { id: "n4", keeper: "mote", line: "Kept that lamp you liked in Ideas, for someday.", minutesAgo: 310, unread: false },
  { id: "n5", keeper: "tock", line: "Rent is due on the 1st. Nothing to do today.", minutesAgo: 60 * 26, unread: false },
  { id: "n6", keeper: "penny", line: "Your gym trial ends in 3 days, in case you want to cancel.", minutesAgo: 60 * 50, unread: false },
];

export function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}
