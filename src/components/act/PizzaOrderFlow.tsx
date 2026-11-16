import * as Haptics from "expo-haptics";
import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, Text, View } from "react-native";
import { PsstButton, SoftCard, text, useKeeperColors, usePalette } from "@/design/psst";
import { arrivalTime, PIZZA_ORDER as O } from "@/lib/act/scenarios/pizzaOrder";
import type { ActScenario } from "@/lib/act/types";
import { Fade, TypingDots } from "./Motion";

type Phase = "typing" | "reply" | "order" | "placed";

const tap = (kind: "light" | "success") =>
  (kind === "success" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined);

function Bubble({ mine, keeper, children }: { mine?: boolean; keeper: ActScenario["keeper"]; children: ReactNode }) {
  const p = usePalette();
  const c = useKeeperColors(keeper);
  return (
    <View style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%", backgroundColor: mine ? c.main : p.fill2, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 }}>
      {children}
    </View>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const p = usePalette();
  const style = [bold ? text.bodyBold : text.body, { color: p.ink }];
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={[...style, { flex: 1 }]}>{label}</Text>
      <Text style={style}>{value}</Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const p = usePalette();
  return (
    <View style={{ gap: 2 }}>
      <Text style={[text.caption, { color: p.ink2 }]}>{label}</Text>
      <Text style={[text.body, { color: p.ink }]}>{value}</Text>
    </View>
  );
}

function OrderCard({ keeper, onPlace }: { keeper: ActScenario["keeper"]; onPlace: () => void }) {
  const p = usePalette();
  const [tapped, setTapped] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <SoftCard style={{ gap: 12 }}>
        <View style={{ gap: 2 }}>
          <Text style={[text.bodyBold, { color: p.ink, fontSize: 18 }]}>{O.merchant}</Text>
          <Text style={[text.caption, { color: p.ink2 }]}>{O.merchantNote}</Text>
        </View>
        <View style={{ gap: 6 }}>
          {O.items.map((i) => (
            <Line key={i.name} label={i.name} value={i.price} />
          ))}
          <View style={{ height: 1, backgroundColor: p.hair, marginVertical: 4 }} />
          <Line label="Total, all in" value={O.total} bold />
        </View>
        <Field label="Deliver to" value={O.deliverTo} />
        <Field label="Arrives" value={`About ${O.etaMinutes} min`} />
        <Field label="Pay with" value={O.payWith} />
      </SoftCard>
      <Text style={[text.body, { color: p.ink2 }]}>Nothing is ordered until you tap.</Text>
      <PsstButton
        kind="filled"
        keeper={keeper}
        label={`Place order · ${O.total}`}
        disabled={tapped}
        onPress={() => {
          if (tapped) return;
          setTapped(true);
          onPlace();
        }}
      />
    </View>
  );
}

function Tracker({ keeper, stage, eta }: { keeper: ActScenario["keeper"]; stage: number; eta: string }) {
  const p = usePalette();
  const c = useKeeperColors(keeper);
  return (
    <SoftCard style={{ gap: 14 }}>
      <View style={{ gap: 2 }}>
        <Text style={[text.caption, { color: p.ink2 }]}>{O.merchant}</Text>
        <Text accessibilityLiveRegion="polite" style={[text.bodyBold, { color: p.ink, fontSize: 18 }]}>{`Arrives around ${eta}`}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {O.stages.map((s, i) => (
          <View key={s} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= stage ? c.main : p.fill2 }} />
        ))}
      </View>
      <View style={{ gap: 8 }}>
        {O.stages.map((s, i) => (
          <View key={s} accessible accessibilityLabel={`${s}, ${i < stage ? "done" : i === stage ? "now" : "next"}`} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: i <= stage ? p.kl : p.hair2, backgroundColor: i <= stage ? c.main : "transparent" }} />
            <Text style={[i === stage ? text.bodyBold : text.body, { color: i <= stage ? p.ink : p.ink3 }]}>{s}</Text>
          </View>
        ))}
      </View>
      <Text style={[text.caption, { color: p.ink2 }]}>{`${O.deliverTo} · ${O.payWith}`}</Text>
    </SoftCard>
  );
}

export function PizzaOrderFlow({ scenario, sent, onPlaced, onClose }: { scenario: ActScenario; sent: string; onPlaced: () => void; onClose: () => void }) {
  const p = usePalette();
  const [phase, setPhase] = useState<Phase>("typing");
  const [stage, setStage] = useState(0);
  const [eta, setEta] = useState("");

  useEffect(() => {
    if (phase === "typing") {
      const t = setTimeout(() => setPhase("reply"), O.replyDelayMs);
      return () => clearTimeout(t);
    }
    if (phase === "reply") {
      const t = setTimeout(() => setPhase("order"), O.cardDelayMs);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "placed") return;
    AccessibilityInfo.announceForAccessibility(stage === 0 ? `Order placed. ${O.stages[0]}. Arrives around ${eta}.` : O.stages[stage]);
  }, [phase, stage, eta]);

  useEffect(() => {
    if (phase !== "placed" || stage >= O.stages.length - 1) return;
    const t = setTimeout(() => {
      setStage((s) => s + 1);
      tap("light");
    }, O.stageMs);
    return () => clearTimeout(t);
  }, [phase, stage]);

  const place = () => {
    tap("success");
    setEta(arrivalTime(new Date(), O.etaMinutes));
    setPhase("placed");
    onPlaced();
  };

  const placed = phase === "placed";
  return (
    <View style={{ gap: 16 }}>
      <Text accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
        {placed ? "Order placed" : phase === "order" ? `${O.replyFrom} wants a large pepperoni.` : `Sent to ${O.replyFrom}.`}
      </Text>
      <View style={{ gap: 8 }}>
        <Bubble mine keeper={scenario.keeper}>
          <Text style={[text.lead, { color: p.kl }]}>{sent}</Text>
        </Bubble>
        <Fade key={phase === "typing" ? "typing" : "reply"}>
          <Bubble keeper={scenario.keeper}>
            {phase === "typing" ? (
              <TypingDots />
            ) : (
              <Text accessibilityLiveRegion="polite" accessibilityLabel={`${O.replyFrom}: ${O.reply}`} style={[text.lead, { color: p.ink }]}>
                {O.reply}
              </Text>
            )}
          </Bubble>
        </Fade>
      </View>
      {phase === "order" ? (
        <Fade>
          <OrderCard keeper={scenario.keeper} onPlace={place} />
        </Fade>
      ) : null}
      {placed ? (
        <Fade>
          <View style={{ gap: 16 }}>
            <Tracker keeper={scenario.keeper} stage={stage} eta={eta} />
            <PsstButton kind="filled" keeper={scenario.keeper} label="Done" onPress={onClose} />
          </View>
        </Fade>
      ) : null}
    </View>
  );
}
