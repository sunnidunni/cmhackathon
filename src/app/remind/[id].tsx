import { useQuery } from "convex/react";
import * as Notifications from "expo-notifications";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { usePalette } from "@/design/psst";
import { defaultReminder } from "@/components/remind/plan";
import { RemindBody } from "@/components/remind/RemindBody";
import { ensureNotificationPermission, hasNotificationPermission } from "@/lib/notifications";
import { FIXTURES } from "@/lib/fixtures";
import { useReminderActions } from "@/lib/reminders";

const tz = () => new Date().getTimezoneOffset();
const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));

export default function Remind() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shotId = id as Id<"screenshots">;
  const shot = useQuery(api.shots.detail, { id: shotId });
  const actions = useReminderActions();
  const [now] = useState(Date.now);
  const [notifOn, setNotifOn] = useState<boolean | null>(null);
  const [priming, setPriming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    hasNotificationPermission().then(setNotifOn);
  }, []);

  const plan = shot ? defaultReminder(shot.dates, now, tz()) : null;
  const existing = plan && shot ? shot.dates.find((d) => d.when === plan.date.when)?.reminder : null;
  const isSet = saved || existing?.state === "scheduled";

  async function save() {
    if (!plan) return;
    setFailed(false);
    setSaving(true);
    try {
      const r = await actions.remind(shotId, plan.date.when);
      setNotifOn(r.notified);
      setSaved(true);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    if (isSet) return close();
    const perm = await Notifications.getPermissionsAsync().catch(() => null);
    if (perm?.status === "undetermined") return setPriming(true);
    await save();
  }

  return (
    <>
      <Stack.Screen options={{ presentation: "formSheet", headerShown: false, sheetGrabberVisible: true, sheetAllowedDetents: [0.95], sheetCornerRadius: 24, contentStyle: { backgroundColor: p.paper } }} />
      <RemindBody
        shot={shot}
        now={now}
        tz={tz()}
        notifOn={notifOn}
        saved={saved}
        failed={failed}
        saving={saving}
        priming={priming}
        onConfirm={confirm}
        onRetry={save}
        onClose={close}
        onFireNow={FIXTURES ? () => void actions.fireNow(shotId).catch(() => undefined) : undefined}
        onAllow={async () => {
          setPriming(false);
          await ensureNotificationPermission().catch(() => false);
          await save();
        }}
        onSkip={async () => {
          setPriming(false);
          await save();
        }}
        onTurnOff={async () => {
          if (!existing) return;
          setSaving(true);
          await actions.cancel(existing.id).catch(() => undefined);
          close();
        }}
      />
    </>
  );
}
