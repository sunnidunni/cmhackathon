import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { KeeperFace, KEEPERS, PsstButton, text, useKeeperColors, usePalette, Wash } from "@/design/psst";
import { dismissAct, setReminderMoved, useActState } from "@/lib/act/store";
import type { ActScenario } from "@/lib/act/types";
import { isReminderStep, reminderCopy } from "./pages";
import { SourceThumb } from "./SourceThumb";

export function ActCard({ scenario }: { scenario: ActScenario }) {
  const p = usePalette();
  const c = useKeeperColors(scenario.keeper);
  const { undone } = useActState();
  const reminder = scenario.steps.find(isReminderStep);
  const copy = reminder ? reminderCopy(reminder, KEEPERS[scenario.keeper].name) : null;
  const reverted = undone.has(scenario.id);
  const didLine = copy ? (reverted ? copy.reverted : (scenario.didOnOwn ?? copy.done)) : scenario.didOnOwn;

  return (
    <Wash keeper={scenario.keeper} style={{ gap: 12 }}>
      <View accessible accessibilityRole="header" style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <KeeperFace id={scenario.keeper} size={40} />
        <Text style={[text.bodyBold, { flex: 1, fontSize: 18, lineHeight: 23, color: p.ink }]}>{scenario.noticed}</Text>
      </View>
      <Text style={[text.caption, { color: p.ink2 }]}>{scenario.why}</Text>
      {didLine ? (
        <View style={{ gap: 0 }}>
          <Text style={[text.body, { color: c.deep }]}>{didLine}</Text>
          {copy ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={reverted ? copy.redo : copy.undoHint}
              onPress={() => setReminderMoved(scenario.id, reverted)}
              style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}
            >
              <Text style={[text.bodyBold, { color: p.ink, textDecorationLine: "underline" }]}>{reverted ? copy.redo : copy.undo}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <SourceThumb source={scenario.source} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[text.body, { color: p.ink }]}>{scenario.ready}</Text>
          <Text style={[text.caption, { color: p.ink2 }]}>{`From your screenshot${scenario.source.at ? `, ${scenario.source.at}` : ""}`}</Text>
        </View>
      </View>
      <PsstButton kind="filled" keeper={scenario.keeper} label={scenario.cta} onPress={() => router.push(`/act/${scenario.id}` as never)} />
      <PsstButton kind="text" label="Not now" onPress={() => dismissAct(scenario.id)} />
    </Wash>
  );
}
