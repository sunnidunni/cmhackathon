import { ScrollView, Text, View } from "react-native";
import type { ShotDetail } from "@/components/ask/AnswerBlock";
import { PsstButton, text, usePalette } from "@/components/ask/kit";
import { dayLabel, defaultReminder, previewText, whenLabel } from "./plan";
import { Banner, Headline, Options, Preview, Priming, TodayPreview } from "./ReminderViews";

export type RemindState = {
  shot: ShotDetail | null | undefined;
  now: number;
  tz: number;
  notifOn: boolean | null;
  saved: boolean;
  failed: boolean;
  saving: boolean;
  priming: boolean;
};

export type RemindActions = {
  onConfirm: () => void;
  onRetry: () => void;
  onTurnOff: () => void;
  onAllow: () => void;
  onSkip: () => void;
  onClose: () => void;
};

export function RemindBody({ shot, now, tz, notifOn, saved, failed, saving, priming, onConfirm, onRetry, onTurnOff, onAllow, onSkip, onClose }: RemindState & RemindActions) {
  const p = usePalette();
  const plan = shot ? defaultReminder(shot.dates, now, tz) : null;
  const existing = plan && shot ? shot.dates.find((d) => d.when === plan.date.when)?.reminder : null;
  const isSet = saved || existing?.state === "scheduled";
  const off = isSet && notifOn === false;
  const options = plan
    ? [
        { key: "day-before", title: `Day before, ${plan.clock}`, sub: plan.day, selected: true, available: true },
        { key: "morning-of", title: "Morning of, 8:00 AM", sub: whenLabel(plan.date.when), selected: false, available: false },
        { key: "two-days", title: "Two days before, 9:00 AM", sub: dayLabel(plan.dueAt - 86400000, tz), selected: false, available: false },
      ]
    : [];
  const preview = shot && plan ? previewText(shot, plan.date, plan.dueAt, tz) : "";
  const when = plan ? `${plan.day.slice(0, 3)} ${plan.clock}` : "";

  return (
    <View style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 28, gap: 16, flexGrow: 1 }}>
        <Headline />
        {shot === undefined ? <Text style={[text.lead, { color: p.ink2 }]}>Opening your screenshot.</Text> : null}
        {shot === null ? <Text style={[text.lead, { color: p.ink2 }]}>I can&apos;t find that screenshot. It may have been deleted.</Text> : null}
        {shot && !plan ? <Text style={[text.lead, { color: p.ink2 }]}>This screenshot has no upcoming date, so there is nothing to remind you about.</Text> : null}
        {shot && plan ? (
          <>
            <Text style={[text.lead, { color: p.ink2 }]}>{`${plan.date.what} ${whenLabel(plan.date.when)}.`}</Text>
            {failed ? <Banner kind="error" title="Couldn't set the reminder." body="Nothing changed. Your pick is kept below." /> : null}
            {off ? <Banner kind="off" title="Notifications are off." body={`The reminder will wait at the top of Today on ${plan.day} at ${plan.clock}.`} /> : null}
            <Options rows={options} />
            {off ? (
              <>
                <TodayPreview title={shot.title || "Screenshot"} sub={`${plan.date.what} ${whenLabel(plan.date.when)}`} imageUrl={shot.imageUrl} />
                <Text style={[text.caption, { color: p.ink2 }]}>No notification is sent while notifications are off. You can turn them on in Settings.</Text>
              </>
            ) : (
              <>
                <Preview label="What you'll get" body={preview} time={when} />
                <Text style={[text.caption, { color: p.ink2 }]}>We&apos;ll remind you once per item. You can snooze or turn reminders off.</Text>
              </>
            )}
          </>
        ) : null}
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: 42, gap: 4 }}>
        {plan ? (
          <PsstButton kind="filled" label={failed ? "Try again" : isSet ? "Done" : "Set reminder"} onPress={failed ? onRetry : onConfirm} disabled={saving} />
        ) : (
          <PsstButton kind="filled" label="Done" onPress={onClose} />
        )}
        {existing?.state === "scheduled" ? <PsstButton kind="text" label="Turn off this reminder" onPress={onTurnOff} disabled={saving} /> : null}
      </View>
      {priming && preview ? <Priming preview={{ body: preview, time: when }} onAllow={onAllow} onSkip={onSkip} /> : null}
    </View>
  );
}
