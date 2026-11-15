import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Keeper, KeeperFace, PsstButton, ShotSticker, text, useKeeperColors, usePalette } from "@/design/psst";

const Decor = ({ children }: { children: ReactNode }) => (
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {children}
  </View>
);

export type OptionRow = { key: string; title: string; sub: string; selected: boolean; available: boolean };

export function Headline() {
  const p = usePalette();
  return (
    <Text style={[text.headlineCard, { color: p.ink }]}>
      Choose when Tock{" "}
      <View style={{ transform: [{ translateY: 4 }] }}>
        <Decor><KeeperFace id="tock" size={26} /></Decor>
      </View>{" "}
      should remind you.
    </Text>
  );
}

export function Options({ rows }: { rows: OptionRow[] }) {
  const p = usePalette();
  return (
    <View style={{ borderTopWidth: 1, borderColor: p.hair }}>
      {rows.map((r) => (
        <View
          key={r.key}
          accessible
          accessibilityRole="menuitem"
          accessibilityState={{ selected: r.selected, disabled: !r.available }}
          style={{ minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: p.hair, opacity: r.available ? 1 : 0.45 }}
        >
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={[text.bodyBold, { color: p.ink }]}>
              {r.title}
              {r.selected ? <Text style={[text.caption, { color: p.ink2 }]}>{" · default"}</Text> : null}
            </Text>
            <Text style={[text.caption, { color: p.ink2 }]}>{r.available ? r.sub : `${r.sub} · not available yet`}</Text>
          </View>
          {r.selected ? <SymbolView name="checkmark" size={18} tintColor={p.ink} fallback={<Text style={{ color: p.ink, fontWeight: "700" }}>✓</Text>} /> : null}
        </View>
      ))}
    </View>
  );
}

export function Preview({ label, body, time }: { label: string; body: string; time: string }) {
  const p = usePalette();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[text.caption, { color: p.ink2 }]}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 12, backgroundColor: p.white, borderWidth: 1, borderColor: p.hair, borderRadius: 18, padding: 12 }}>
        <Decor><KeeperFace id="murmur" size={36} /></Decor>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[text.caption, { color: p.ink, fontWeight: "700" }]}>Psst</Text>
            <Text style={[text.caption, { color: p.ink2 }]}>{time}</Text>
          </View>
          <Text style={[text.body, { color: p.ink }]}>{body}</Text>
        </View>
      </View>
    </View>
  );
}

export function TodayPreview({ title, sub, imageUrl }: { title: string; sub: string; imageUrl: string | null }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: p.white, borderWidth: 1, borderColor: p.hair, borderRadius: 18, padding: 10 }}>
      <ShotSticker uri={imageUrl} title={title} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[text.bodyBold, { color: p.ink }]} numberOfLines={2}>{title}</Text>
        <Text style={[text.caption, { color: p.ink2 }]}>{sub}</Text>
      </View>
      <Decor><KeeperFace id="tock" size={32} /></Decor>
    </View>
  );
}

export function Banner({ kind, title, body }: { kind: "off" | "error"; title: string; body: string }) {
  const p = usePalette();
  const tock = useKeeperColors("tock");
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14, backgroundColor: kind === "error" ? tock.tint : p.fill }}>
      <Decor><KeeperFace id="tock" size={40} mood={kind === "error" ? "anxious" : "rest"} /></Decor>
      <Text style={[text.body, { color: p.ink, flex: 1 }]}>
        <Text style={{ fontWeight: "700" }}>{title}</Text>
        {" " + body}
      </Text>
    </View>
  );
}

export function Priming({ preview, onAllow, onSkip }: { preview: { body: string; time: string }; onAllow: () => void; onSkip: () => void }) {
  const p = usePalette();
  return (
    <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0, justifyContent: "flex-end", backgroundColor: p.scrim }}>
      <View accessibilityViewIsModal style={{ backgroundColor: p.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 42, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Decor><Keeper id="tock" size={72} /></Decor>
          <Text style={[text.headlineCard, { color: p.ink, flex: 1 }]}>{`Your reminder arrives ${preview.time.replace(" ", " at ")}.`}</Text>
        </View>
        <Preview label="What you'll get" body={preview.body} time={preview.time} />
        <Text style={[text.caption, { color: p.ink2 }]}>{"We'll remind you once per item. You can snooze or turn reminders off."}</Text>
        <PsstButton kind="filled" keeper="tock" label="Turn on notifications" onPress={onAllow} />
        <PsstButton kind="text" label="Not now, show it in Today" onPress={onSkip} />
        <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>Your reminder is saved either way.</Text>
      </View>
    </View>
  );
}
