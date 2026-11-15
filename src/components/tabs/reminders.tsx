import { useMutation } from "convex/react";
import * as SecureStore from "expo-secure-store";
import { useRef, useState } from "react";
import { Text } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button, colors, SpeechBubble, spacing, type } from "@/design";
import { Sheet, tzOffset } from "./ui";

const ASKED_KEY = "psst.nudgeAsked";

// Thin adapter over the reminder mutations. Phone-side scheduling and the system
// permission prompt belong to src/lib (CMHA-5); wire them in at the two marked spots.
export function useReminders(onSaved?: (text: string) => void) {
  const setMutation = useMutation(api.reminders.set);
  const cancelMutation = useMutation(api.reminders.cancel);
  const fireMutation = useMutation(api.reminders.fireNow);
  const [pending, setPending] = useState<{ id: Id<"screenshots">; when?: string } | null>(null);
  const resolve = useRef<() => void>(() => undefined);

  async function save(id: Id<"screenshots">, when?: string) {
    const res = await setMutation({ screenshotId: id, tzOffsetMinutes: tzOffset(), when });
    // wire-in point 1: schedule the local notification for res.dueAt with res.text
    onSaved?.(res.text);
    return res;
  }

  async function remind(id: Id<"screenshots">, when?: string) {
    const asked = await SecureStore.getItemAsync(ASKED_KEY).catch(() => "1");
    if (asked) return save(id, when);
    setPending({ id, when });
  }

  async function finish(allow: boolean) {
    const p = pending;
    setPending(null);
    await SecureStore.setItemAsync(ASKED_KEY, "1").catch(() => undefined);
    if (allow) {
      // wire-in point 2: request notification permission here
    }
    if (p) await save(p.id, p.when);
    resolve.current();
  }

  const sheet = (
    <Sheet visible={pending !== null} onClose={() => finish(false)} title="Want a nudge when it's time?">
      <Text style={[type.body, { color: colors.inkSoft }]}>It will look like this:</Text>
      <SpeechBubble tail="bottom-left">Psst: your flyer is due tomorrow. Want to see it?</SpeechBubble>
      <Button label="Turn on notifications" onPress={() => finish(true)} />
      <Button variant="secondary" label="Not now, keep it in Today" onPress={() => finish(false)} />
      <Text style={[type.caption, { marginTop: spacing.xs }]}>Either way, the reminder is saved.</Text>
    </Sheet>
  );

  return {
    remind,
    cancel: (reminderId: Id<"reminders">) => cancelMutation({ reminderId }),
    fireNow: (screenshotId: Id<"screenshots">) => fireMutation({ screenshotId, tzOffsetMinutes: tzOffset() }),
    sheet,
  };
}
