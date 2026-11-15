import { Pressable, Text, View } from "react-native";
import { text, usePalette } from "@/design/psst";
import { DEMO_ACTS } from "@/lib/act/scenarios";
import { setReminderMoved, useActState } from "@/lib/act/store";
import { FIXTURES } from "@/lib/fixtures";
import { ActCard } from "./ActCard";
import { Fade } from "./Motion";

export function ActCards() {
  const p = usePalette();
  const { dismissed, completed, undone } = useActState();
  const acts = (FIXTURES ? DEMO_ACTS : []).filter((a) => a.steps.length > 0);
  const open = acts.filter((a) => !dismissed.has(a.id) && !completed.has(a.id));
  const moved = acts.flatMap((a) => {
    const step = a.steps.find((s) => s.kind === "move-reminder");
    return step && !open.includes(a) && !undone.has(a.id) ? [{ id: a.id, step }] : [];
  });
  if (open.length === 0 && moved.length === 0) return null;
  return (
    <View style={{ gap: 16 }}>
      {open.map((a) => (
        <Fade key={a.id}>
          <ActCard scenario={a} />
        </Fade>
      ))}
      {moved.map(({ id, step }) =>
        step.kind === "move-reminder" ? (
          <View key={id} style={{ gap: 0 }}>
            <Text style={[text.body, { color: p.ink }]}>{`Tock moved your airport reminder from ${step.from} to ${step.to}.`}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Undo. Put the reminder back to ${step.from}`}
              onPress={() => setReminderMoved(id, false)}
              style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}
            >
              <Text style={[text.bodyBold, { color: p.ink, textDecorationLine: "underline" }]}>{`Undo · back to ${step.from}`}</Text>
            </Pressable>
          </View>
        ) : null,
      )}
    </View>
  );
}
