import type { KeeperId } from "@/design/psst";

export type ActivityKind = "filed" | "reminder" | "answer" | "action";
export type ActivityFilter = "all" | ActivityKind;
export type ActivityDay = "today" | "yesterday" | "week";

export type ActivityItem = {
  id: string;
  day: ActivityDay;
  time: string;
  keeper: KeeperId;
  kind: ActivityKind;
  text: string;
  result: string;
};

export const FILTERS: { key: ActivityFilter; label: string; keeper?: KeeperId }[] = [
  { key: "all", label: "All" },
  { key: "filed", label: "Filed", keeper: "penny" },
  { key: "reminder", label: "Reminders", keeper: "tock" },
  { key: "answer", label: "Answers", keeper: "murmur" },
  { key: "action", label: "Actions", keeper: "mote" },
];

export const DAY_LABELS: Record<ActivityDay, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Earlier this week",
};

export const DAYS: ActivityDay[] = ["today", "yesterday", "week"];

export const EMPTY: Record<ActivityFilter, { keeper: KeeperId; title: string; line: string }> = {
  all: { keeper: "mote", title: "Nothing here yet", line: "Take a screenshot and it shows up here." },
  filed: { keeper: "penny", title: "Nothing filed yet", line: "New screenshots get a room as they come in." },
  reminder: { keeper: "tock", title: "No reminders yet", line: "When a screenshot has a date, I can set one." },
  answer: { keeper: "murmur", title: "No answers yet", line: "Ask about a screenshot and the answer lands here." },
  action: { keeper: "mote", title: "No actions yet", line: "Drafts and next steps will show up here." },
};

export const ACTIVITY: ActivityItem[] = [
  { id: "a1", day: "today", time: "9:41 AM", keeper: "penny", kind: "filed", text: "Coffee receipt from Blue Bottle", result: "Filed to Receipts" },
  { id: "a2", day: "today", time: "9:12 AM", keeper: "tock", kind: "reminder", text: "Dentist appointment confirmation", result: "Reminder set for Fri" },
  { id: "a3", day: "today", time: "8:30 AM", keeper: "murmur", kind: "answer", text: "What time is Maya's party?", result: "Answered" },
  { id: "a4", day: "today", time: "8:02 AM", keeper: "mote", kind: "action", text: "Reply to the landlord about the lease", result: "Draft ready" },
  { id: "a5", day: "today", time: "7:48 AM", keeper: "mote", kind: "filed", text: "Lamp you liked on a design site", result: "Filed to Ideas" },
  { id: "a6", day: "yesterday", time: "10:15 PM", keeper: "murmur", kind: "filed", text: "Group chat about Saturday hike", result: "Filed to Chats" },
  { id: "a7", day: "yesterday", time: "6:20 PM", keeper: "penny", kind: "answer", text: "How much was the electric bill?", result: "Answered" },
  { id: "a8", day: "yesterday", time: "3:05 PM", keeper: "tock", kind: "reminder", text: "Library books due", result: "Reminder set for Tue" },
  { id: "a9", day: "yesterday", time: "1:40 PM", keeper: "penny", kind: "action", text: "Split the dinner bill with Sam", result: "Request ready" },
  { id: "a10", day: "yesterday", time: "11:22 AM", keeper: "tock", kind: "filed", text: "Flight check-in opens tomorrow", result: "Filed to Deadlines" },
  { id: "a11", day: "week", time: "Thu", keeper: "mote", kind: "answer", text: "Which book did Jo recommend?", result: "Answered" },
  { id: "a12", day: "week", time: "Thu", keeper: "tock", kind: "reminder", text: "Renew parking permit", result: "Reminder set for Mon" },
  { id: "a13", day: "week", time: "Wed", keeper: "penny", kind: "filed", text: "Online order confirmation", result: "Filed to Receipts" },
  { id: "a14", day: "week", time: "Wed", keeper: "murmur", kind: "action", text: "RSVP to the team dinner", result: "Draft ready" },
  { id: "a15", day: "week", time: "Tue", keeper: "mote", kind: "filed", text: "Recipe for lemon pasta", result: "Filed to Ideas" },
];
