import type { ActStep } from "./types";

export type EffectResult = "done" | "fallback";
export type EffectEdit = { body?: string; subject?: string };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const PHONE = /^\+?[\d\s().-]{7,}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOUR = 3600000;

const onIOS = () => process.env.EXPO_OS === "ios";

export function parseEventWhen(when: string, now: Date = new Date()): Date | null {
  const m = /\b([A-Za-z]{3})[a-z]*\.? (\d{1,2})\b[^\d]*(\d{1,2})(?::(\d{2}))?\s?([AP]M)\b/i.exec(when);
  if (!m) return null;
  const month = MONTHS.indexOf(m[1].toLowerCase());
  if (month < 0) return null;
  const hour = (+m[3] % 12) + (m[5][0].toUpperCase() === "P" ? 12 : 0);
  const start = new Date(now.getFullYear(), month, +m[2], hour, m[4] ? +m[4] : 0);
  if (start.getTime() < now.getTime() - 12 * HOUR) start.setFullYear(start.getFullYear() + 1);
  return start;
}

async function sendText(to: string, body: string): Promise<EffectResult> {
  const SMS = await import("expo-sms");
  if (!(await SMS.isAvailableAsync())) return "fallback";
  const { result } = await SMS.sendSMSAsync(PHONE.test(to.trim()) ? [to.trim()] : [], body);
  return result === "sent" ? "done" : "fallback";
}

async function sendMail(to: string, subject: string, body: string): Promise<EffectResult> {
  const recipients = EMAIL.test(to.trim()) ? [to.trim()] : [];
  const Mail = await import("expo-mail-composer");
  if (await Mail.isAvailableAsync()) {
    const { status } = await Mail.composeAsync({ recipients, subject, body });
    return onIOS() && (status === Mail.MailComposerStatus.SENT || status === Mail.MailComposerStatus.SAVED) ? "done" : "fallback";
  }
  const { openURL } = await import("expo-linking");
  await openURL("mailto:" + recipients.join(",") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body));
  return "fallback";
}

async function addEvent(step: Extract<ActStep, { kind: "calendar" }>): Promise<EffectResult> {
  const start = parseEventWhen(step.when);
  if (!start) return "fallback";
  const Calendar = await import("expo-calendar");
  const { granted } = await Calendar.requestCalendarPermissions();
  if (!granted) return "fallback";
  const calendar = onIOS() ? Calendar.getDefaultCalendarSync() : (await Calendar.getCalendars()).find((c) => c.allowsModifications);
  if (!calendar) return "fallback";
  await calendar.createEvent({
    title: step.title,
    startDate: start,
    endDate: new Date(start.getTime() + HOUR),
    location: step.where,
    notes: step.leaveBy ? "Leave by " + step.leaveBy + ". This is an estimate, not a route time." : undefined,
  });
  return "done";
}

export async function runEffect(step: ActStep, edit: EffectEdit = {}): Promise<EffectResult> {
  try {
    if (step.kind === "draft-message") return await sendText(step.to, edit.body ?? step.body);
    if (step.kind === "email-draft") return await sendMail(step.to, edit.subject ?? step.subject, edit.body ?? step.body);
    if (step.kind === "calendar") return await addEvent(step);
    return "fallback";
  } catch {
    return "fallback";
  }
}

export function effectLine(step: ActStep): string {
  if (step.kind === "draft-message") return "Message sent.";
  if (step.kind === "email-draft") return "Email sent or saved to drafts.";
  if (step.kind === "calendar") return "Added to your calendar.";
  return "";
}
