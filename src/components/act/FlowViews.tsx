import { useState, type ReactNode } from "react";
import { Text, TextInput, View } from "react-native";
import { fonts, Keeper, KEEPERS, KeeperFace, PsstButton, SoftCard, text, usePalette } from "@/design/psst";
import { confirmNote } from "@/lib/act/effects";
import { confirmFor, doneLine, lastAction, realEnd, realLine, reminderCopy, type ReminderStep } from "./pages";
import { SourceThumb } from "./SourceThumb";
import type { ActScenario, ActStep } from "@/lib/act/types";

export type Edit = { body: string; subject: string };

function Row({ label, children }: { label: string; children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ gap: 2 }}>
      <Text style={[text.caption, { color: p.ink2 }]}>{label}</Text>
      {children}
    </View>
  );
}

export function WhyRow({ scenario }: { scenario: ActScenario }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
      <SourceThumb source={scenario.source} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[text.body, { color: p.ink }]}>{scenario.why}</Text>
        <Text style={[text.caption, { color: p.ink2 }]}>{`From your screenshot${scenario.source.at ? `, ${scenario.source.at}` : ""}`}</Text>
      </View>
    </View>
  );
}

export function Receipt({ step, edit, fixture }: { step: ActStep; edit: Edit; fixture: boolean }) {
  const p = usePalette();
  if (step.kind === "draft-message")
    return (
      <SoftCard style={{ gap: 12 }}>
        <Row label="To">
          <Text style={[text.bodyBold, { color: p.ink }]}>{`${step.to} · Messages`}</Text>
        </Row>
        <Row label="Message, exactly as it will go">
          <Text style={[text.lead, { color: p.ink }]}>{edit.body}</Text>
        </Row>
        <Text style={[text.caption, { color: p.ink2 }]}>A text can&apos;t be unsent.</Text>
      </SoftCard>
    );
  if (step.kind === "email-draft")
    return (
      <SoftCard style={{ gap: 12 }}>
        <Row label="To">
          <Text style={[text.bodyBold, { color: p.ink }]}>{step.to}</Text>
        </Row>
        <Row label="Subject">
          <Text style={[text.bodyBold, { color: p.ink }]}>{edit.subject}</Text>
        </Row>
        <Row label="Message, exactly as it will go">
          <Text style={[text.lead, { color: p.ink }]}>{edit.body}</Text>
        </Row>
        <Text style={[text.caption, { color: p.ink2 }]}>An email can&apos;t be unsent.</Text>
      </SoftCard>
    );
  if (step.kind === "order")
    return (
      <SoftCard style={{ gap: 12 }}>
        <Text style={[text.bodyBold, { color: p.ink, fontSize: 18 }]}>{step.merchant}</Text>
        <View style={{ gap: 6 }}>
          {step.items.map((i) => (
            <View key={i.name} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={[text.body, { color: p.ink, flex: 1 }]}>{i.name}</Text>
              <Text style={[text.body, { color: p.ink }]}>{i.price}</Text>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: p.hair, marginVertical: 4 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[text.bodyBold, { color: p.ink }]}>Total, all in</Text>
            <Text style={[text.bodyBold, { color: p.ink }]}>{step.total}</Text>
          </View>
        </View>
        <Row label="Deliver to">
          <Text style={[text.body, { color: p.ink }]}>{step.deliverTo}</Text>
        </Row>
        <Row label="Arrives">
          <Text style={[text.body, { color: p.ink }]}>{step.eta}</Text>
        </Row>
        <Row label="Pay with">
          <Text style={[text.body, { color: p.ink }]}>{fixture ? "Card on file" : "Demo card"}</Text>
        </Row>
      </SoftCard>
    );
  if (step.kind === "calendar")
    return (
      <SoftCard style={{ gap: 12 }}>
        <Text style={[text.bodyBold, { color: p.ink, fontSize: 18 }]}>{step.title}</Text>
        <Row label="When">
          <Text style={[text.body, { color: p.ink }]}>{step.when}</Text>
        </Row>
        {step.where ? (
          <Row label="Where">
            <Text style={[text.body, { color: p.ink }]}>{step.where}</Text>
          </Row>
        ) : null}
        {step.leaveBy ? (
          <Row label="Leave by (estimate)">
            <Text style={[text.body, { color: p.ink }]}>{step.leaveBy}</Text>
          </Row>
        ) : null}
      </SoftCard>
    );
  return null;
}

export function MovePage({ scenario, step, moved, nextLabel, onToggle, onNext }: { scenario: ActScenario; step: ReminderStep; moved: boolean; nextLabel: string; onToggle: () => void; onNext: () => void }) {
  const copy = reminderCopy(step, KEEPERS[scenario.keeper].name);
  const p = usePalette();
  return (
    <View style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
        {moved ? copy.done : copy.reverted}
      </Text>
      <WhyRow scenario={scenario} />
      <Text style={[text.body, { color: p.ink2 }]}>You can change it back any time.</Text>
      <PsstButton kind="filled" keeper={scenario.keeper} label={nextLabel} onPress={onNext} />
      <PsstButton kind="text" label={moved ? copy.undo : copy.redo} onPress={onToggle} />
    </View>
  );
}

export function EditPage({ scenario, step, edit, fixture, onChange, onNext }: { scenario: ActScenario; step: ActStep; edit: Edit; fixture: boolean; onChange: (e: Edit) => void; onNext: () => void }) {
  const p = usePalette();
  const field = { fontFamily: fonts.ui, fontSize: 16, lineHeight: 22, color: p.ink, backgroundColor: p.white, borderWidth: 1, borderColor: p.hair2, borderRadius: 12, padding: 12 } as const;
  const message = step.kind === "draft-message" || step.kind === "email-draft";
  const label =
    step.kind === "draft-message" ? `Review text to ${step.to.split(" (")[0]}` : step.kind === "email-draft" ? "Review email" : step.kind === "order" ? "Review order" : "Review event";
  const title =
    step.kind === "draft-message" ? `Text to ${step.to}` : step.kind === "email-draft" ? `Email to ${step.to}` : step.kind === "order" ? "Pizza for tonight, ready to order" : "Event, ready to add";
  return (
    <View style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>{title}</Text>
      <WhyRow scenario={scenario} />
      {step.kind === "email-draft" ? (
        <TextInput accessibilityLabel="Subject" value={edit.subject} onChangeText={(subject) => onChange({ ...edit, subject })} style={field} />
      ) : null}
      {message ? (
        <TextInput
          accessibilityLabel={step.kind === "draft-message" ? `Message to ${step.to}` : "Message"}
          multiline
          value={edit.body}
          onChangeText={(body) => onChange({ ...edit, body })}
          style={[field, { minHeight: 96, textAlignVertical: "top" }]}
        />
      ) : (
        <Receipt step={step} edit={edit} fixture={fixture} />
      )}
      <Text style={[text.body, { color: p.ink2 }]}>
        {fixture
          ? message
            ? "You can change the words. Nothing is sent until you confirm on the next screen."
            : step.kind === "order"
              ? "Nothing is bought until you confirm on the next screen."
              : "Nothing is added until you confirm on the next screen."
          : message
            ? "You can change the words. Psst can't send this yet."
            : step.kind === "calendar"
              ? "Psst can't add this to your calendar yet."
              : "Nothing is bought until you confirm on the next screen."}
      </Text>
      <PsstButton kind="filled" keeper={scenario.keeper} label={label} disabled={message && edit.body.trim().length === 0} onPress={onNext} />
    </View>
  );
}

export function ConfirmPage({ scenario, step, final, edit, fixture, openLabel, reply, onConfirm, onEdit }: { scenario: ActScenario; step: ActStep; final: boolean; edit: Edit; fixture: boolean; openLabel: string | null; reply?: { to: string; text: string }; onConfirm: () => void; onEdit?: () => void }) {
  const p = usePalette();
  const [tapped, setTapped] = useState(false);
  const c = confirmFor(scenario, step, final);
  return (
    <View style={{ gap: 16 }}>
      {reply ? (
        <Text accessibilityLiveRegion="polite" style={[text.bodyBold, { color: p.ink }]}>
          {fixture ? `${reply.to.split(" (")[0]} answered. ` : `Demo: pretend ${reply.to} answered. `}
          <Text style={text.body}>{reply.text}</Text>
        </Text>
      ) : null}
      <WhyRow scenario={scenario} />
      <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>{c.title}</Text>
      <Receipt step={step} edit={edit} fixture={fixture} />
      {c.lines.map((l) => (
        <Text key={l} style={[text.body, { color: p.ink2 }]}>{l}</Text>
      ))}
      {fixture ? null : <Text style={[text.bodyBold, { color: p.ink, textAlign: "center" }]}>{openLabel ? confirmNote(step) : realLine(step)}</Text>}
      <PsstButton
        kind="filled"
        keeper={scenario.keeper}
        label={fixture ? c.button : (openLabel ?? "Got it")}
        disabled={tapped}
        onPress={() => {
          if (tapped) return;
          setTapped(true);
          onConfirm();
        }}
      />
      {onEdit ? <PsstButton kind="text" label={fixture ? "Edit" : "Back"} onPress={onEdit} /> : null}
    </View>
  );
}

export function DonePage({ scenario, fixture, end: effectEnd, onClose }: { scenario: ActScenario; fixture: boolean; end: { title: string; body: string } | null; onClose: () => void }) {
  const p = usePalette();
  const last = lastAction(scenario.steps);
  const line = doneLine(scenario, last, fixture);
  const end = effectEnd ?? realEnd(last);
  return (
    <View style={{ gap: 16, alignItems: "center" }}>
      <Keeper id={scenario.keeper} size={120} mood="react" />
      {fixture ? (
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[text.headlineCard, { color: p.ink, textAlign: "center" }]}>{line}</Text>
      ) : (
        <>
          <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink, textAlign: "center" }]}>{end.title}</Text>
          <Text accessibilityLiveRegion="polite" style={[text.body, { color: p.ink2, textAlign: "center" }]}>{end.body}</Text>
        </>
      )}
      <PsstButton kind="filled" keeper={scenario.keeper} label="Done" onPress={onClose} />
    </View>
  );
}

export { KeeperFace };
