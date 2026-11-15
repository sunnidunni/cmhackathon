import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { showAllLabel, splitTodos, visibleOpen } from "./todos";
import { text, usePalette } from "@/design/psst";

export function Todos() {
  const p = usePalette();
  const items = useQuery(api.todos.list, {});
  const toggle = useMutation(api.todos.toggle);
  const remove = useMutation(api.todos.remove);
  const [expanded, setExpanded] = useState(false);

  const { open, done } = splitTodos(items ?? []);
  const { shown, hidden } = visibleOpen(open, expanded);
  if (!items || items.length === 0) return null;

  const rows = [...shown.map((t) => ({ t, done: false })), ...done.map((t) => ({ t, done: true }))];

  return (
    <View>
      <Text style={[text.caption, { color: p.ink2, marginBottom: 8 }]}>To do</Text>
      {rows.map(({ t, done: isDone }) => (
        <View
          key={t._id}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 52, borderTopWidth: 1, borderTopColor: p.hair }}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            accessibilityLabel={t.text}
            onPress={() => toggle({ id: t._id })}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 1.5,
                borderColor: isDone ? p.ink : p.ink2,
                backgroundColor: isDone ? p.ink : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDone ? <Text style={[text.caption, { color: p.paper }]}>✓</Text> : null}
            </View>
          </Pressable>
          <Pressable
            accessibilityRole={t.screenshotId ? "button" : "text"}
            onPress={t.screenshotId ? () => router.push(`/shot/${t.screenshotId}`) : undefined}
            disabled={!t.screenshotId}
            style={{ flex: 1, minHeight: 44, justifyContent: "center" }}
          >
            <Text style={[text.body, { color: isDone ? p.ink2 : p.ink }, isDone ? { textDecorationLine: "line-through" } : null]}>{t.text}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${t.text}`}
            onPress={() => remove({ id: t._id })}
            style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}
          >
            <Text style={[text.caption, { color: p.ink2 }]}>Remove</Text>
          </Pressable>
        </View>
      ))}
      {hidden > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded(true)}
          style={{ minHeight: 44, justifyContent: "center", borderTopWidth: 1, borderTopColor: p.hair }}
        >
          <Text style={[text.bodyBold, { color: p.ink }]}>{showAllLabel(open.length)}</Text>
        </Pressable>
      ) : null}
      <View style={{ borderTopWidth: 1, borderTopColor: p.hair }} />
    </View>
  );
}
