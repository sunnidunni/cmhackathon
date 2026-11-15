import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { showAllLabel, splitTodos, visibleOpen } from "./todos";
import { colors, radii, SketchFrame, spacing, type } from "@/design";

export function Todos() {
  const items = useQuery(api.todos.list, {});
  const toggle = useMutation(api.todos.toggle);
  const remove = useMutation(api.todos.remove);
  const [expanded, setExpanded] = useState(false);

  const { open, done } = splitTodos(items ?? []);
  const { shown, hidden } = visibleOpen(open, expanded);

  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={[type.title, { color: colors.ink }]}>To do</Text>
      {items && items.length === 0 ? (
        <Text style={type.body}>Nothing to do yet. I&apos;ll add things as I read your screenshots.</Text>
      ) : null}
      {[...shown.map((t) => ({ t, done: false })), ...done.map((t) => ({ t, done: true }))].map(({ t, done: isDone }) => (
        <Row
          key={t._id}
          text={t.text}
          done={isDone}
          onOpen={t.screenshotId ? () => router.push(`/shot/${t.screenshotId}`) : undefined}
          onToggle={() => toggle({ id: t._id })}
          onRemove={() => remove({ id: t._id })}
        />
      ))}
      {hidden > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded(true)} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={type.label}>{showAllLabel(open.length)}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Row({
  text,
  done,
  onOpen,
  onToggle,
  onRemove,
}: {
  text: string;
  done: boolean;
  onOpen?: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={text}
        onPress={onToggle}
        style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}
      >
        <SketchFrame fill={done ? colors.sun : colors.white} radius={radii.sm} seed={text} style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
          {done ? <Text style={type.label}>✓</Text> : null}
        </SketchFrame>
      </Pressable>
      <Pressable accessibilityRole={onOpen ? "button" : "text"} onPress={onOpen} disabled={!onOpen} style={{ flex: 1, minHeight: 44, justifyContent: "center" }}>
        <Text style={[type.body, done ? { textDecorationLine: "line-through", color: colors.inkSoft } : null]}>{text}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${text}`} onPress={onRemove} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.sm }}>
        <Text style={type.caption}>Remove</Text>
      </Pressable>
    </View>
  );
}
