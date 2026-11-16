import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Text } from "react-native";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button, colors, SpeechBubble, spacing, type } from "@/design";
import { ensureNotificationPermission } from "@/lib/notifications";
import { useReminderActions } from "@/lib/reminders";
import { nudgeSample } from "./helpers";
import { Sheet } from "./ui";

const ASKED_KEY = "psst.nudgeAsked";

// The first "Remind me" opens the nudge sheet. Declining still saves the reminder.
export function useReminders() {
  const actions = useReminderActions();
  const [pending, setPending] = useState<{ id: Id<"screenshots">; when?: string; title?: string } | null>(null);

  async function remind(id: Id<"screenshots">, when?: string, title?: string) {
    const asked = await SecureStore.getItemAsync(ASKED_KEY).catch(() => "1");
    if (asked) return actions.remind(id, when);
    setPending({ id, when, title });
  }

  async function finish(allow: boolean) {
    const p = pending;
    setPending(null);
    await SecureStore.setItemAsync(ASKED_KEY, "1").catch(() => undefined);
    if (allow) await ensureNotificationPermission().catch(() => false);
    if (p) await actions.remind(p.id, p.when);
  }

  const sheet = (
    <Sheet visible={pending !== null} onClose={() => finish(false)} title="Want a nudge when it's time?">
      <Text style={[type.body, { color: colors.inkSoft }]}>It will look like this:</Text>
      <SpeechBubble tail="bottom-left">{nudgeSample(pending?.title)}</SpeechBubble>
      <Button label="Turn on notifications" onPress={() => finish(true)} />
      <Button variant="secondary" label="Not now, keep it on Today" onPress={() => finish(false)} />
      <Text style={[type.caption, { marginTop: spacing.xs }]}>Either way, the reminder is saved.</Text>
    </Sheet>
  );

  return { remind, cancel: actions.cancel, fireNow: actions.fireNow, sheet };
}
