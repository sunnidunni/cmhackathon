import { ScrollView, Text, View } from "react-native";
import type { ShotDetail } from "@/components/ask/AnswerBlock";
import { useBigText } from "@/lib/bigText";
import { PsstButton, text, usePalette } from "@/design/psst";
import { dayLabel, defaultReminder, dueParts, previewText, whenLabel } from "./plan";
import { Banner, Headline, Options, Preview, Priming, TodayPreview } from "./ReminderViews";

export type RemindState = {
  shot: ShotDetail | null | undefined;
  now: number;
  tz: number;
  notifOn: boolean | null;
  saved: boolean;
  failed: boolean;
  cancelFailed?: boolean;
  demo?: boolean;
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
  onFireNow?: () => void;
};

export function RemindBody({ shot, now, tz, notifOn, saved, failed, cancelFailed, demo, saving, priming, onConfirm, onRetry, onTurnOff, onAllow, onSkip, onClose, onFireNow }: RemindState & RemindActions) {
  const p = usePalette();
  const big = useBigText();
  const fresh = shot ? defaultReminder(shot.dates, now, tz) : null;
  const existing = fresh && shot ? shot.dates.find((d) => d.when === fresh.date.when)?.reminder : null;
  const plan = fresh && existing?.state === "scheduled" ? { ...fresh, ...dueParts(existing.dueAt, tz) } : fresh;
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

  const footer = (
    <View style={{ padding: big ? 0 : 16, paddingBottom: big ? 24 : 42, gap: 4 }}>
      {plan && !failed && !isSet ? <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>{`Your reminder arrives ${when.replace(" ", " at ")}.`}</Text> : null}
      {plan ? (
        <PsstButton kind="filled" label={failed ? "Try again" : isSet ? "Done" : `Remind me ${when}`} onPress={failed ? onRetry : onConfirm} disabled={saving} />
      ) : (
        <PsstButton kind="filled" label="Done" onPress={onClose} />
      )}
      {existing?.state === "scheduled" ? <PsstButton kind="text" label="Turn off this reminder" onPress={onTurnOff} disabled={saving} /> : null}
      {onFireNow && isSet ? <PsstButton kind="text" label="Fire now (dev)" onPress={onFireNow} /> : null}
    </View>
  );

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
            {failed ? <Banner kind="error" title="Couldn't set the reminder." body="Nothing changed, and your pick is still selected. Check your connection, then try again." /> : null}
            {cancelFailed ? <Banner kind="error" title="Couldn't turn off the reminder." body="It's still on. Try again." /> : null}
            {off ? <Banner kind="off" title="Saved, no notification." body={`Notifications are off. Your reminder will show at the top of Today on ${plan.day} at ${plan.clock}.`} /> : null}
            {isSet && notifOn ? <Text style={[text.bodyBold, { color: p.ink }]}>{`Reminder set for ${plan.day} at ${plan.clock}.`}</Text> : null}
            <Options rows={options} />
            {off ? (
              <>
                <TodayPreview title={shot.title || "Screenshot"} sub={`${plan.date.what} ${whenLabel(plan.date.when)}`} imageUrl={shot.imageUrl} />
                <Text style={[text.caption, { color: p.ink2 }]}>Psst won&apos;t send notifications while they&apos;re off. Your reminder still shows in Today.</Text>
              </>
            ) : (
              <>
                <Preview label="What you'll get" body={preview} time={when} />
                <Text style={[text.caption, { color: p.ink2 }]}>We&apos;ll remind you once per item. You can snooze or turn reminders off.</Text>
              </>
            )}
          </>
        ) : null}
        {big ? footer : null}
      </ScrollView>
      {big ? null : footer}
      {priming && preview ? <Priming preview={{ body: preview, time: when }} onAllow={onAllow} onSkip={onSkip} /> : null}
    </View>
  );
}
