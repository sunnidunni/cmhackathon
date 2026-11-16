import { useQuery } from "convex/react";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { fixtureShot } from "@/components/remind/fixture";
import { isConvexId } from "@/components/remind/ids";
import { defaultReminder, demoNow } from "@/components/remind/plan";
import { RemindBody } from "@/components/remind/RemindBody";
import { ensureNotificationPermission, hasNotificationPermission } from "@/lib/notifications";
import { FIXTURES } from "@/lib/fixtures";
import { useReminderActions } from "@/lib/reminders";

const tz = () => new Date().getTimezoneOffset();
const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));

export default function Remind() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shotId = id as Id<"screenshots">;
  const real = isConvexId(id);
  const fetched = useQuery(api.shots.detail, real ? { id: shotId } : "skip");
  const shot = real ? fetched : (fixtureShot(id) ?? null);
  const actions = useReminderActions();
  const [now] = useState(() => (real ? Date.now() : demoNow(tz())));
  const [notifOn, setNotifOn] = useState<boolean | null>(null);
  const [priming, setPriming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cancelFailed, setCancelFailed] = useState(false);

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
      if (real) {
        const r = await actions.remind(shotId, plan.date.when);
        setNotifOn(r.notified);
      } else {
        setNotifOn(await hasNotificationPermission());
      }
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
      <RemindBody
        shot={shot}
        now={now}
        tz={tz()}
        notifOn={notifOn}
        saved={saved}
        failed={failed}
        demo={!real}
        cancelFailed={cancelFailed}
        saving={saving}
        priming={priming}
        onConfirm={confirm}
        onRetry={save}
        onClose={close}
        onFireNow={FIXTURES && real ? () => void actions.fireNow(shotId).catch(() => undefined) : undefined}
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
          setCancelFailed(false);
          try {
            await actions.cancel(existing.id);
            close();
          } catch {
            setCancelFailed(true);
          } finally {
            setSaving(false);
          }
        }}
      />
    </>
  );
}
