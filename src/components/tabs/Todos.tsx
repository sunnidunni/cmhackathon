import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { cleanTodoText, restoreDraft, splitTodos } from "./todos";
import { Button, colors, radii, SketchFrame, spacing, type } from "@/design";

export function Todos() {
  const items = useQuery(api.todos.list, {});
  const add = useMutation(api.todos.add);
  const toggle = useMutation(api.todos.toggle);
  const remove = useMutation(api.todos.remove);
  const [text, setText] = useState("");
  const [failed, setFailed] = useState(false);

  async function submit() {
    const clean = cleanTodoText(text);
    if (!clean) return;
    setText("");
    setFailed(false);
    await add({ text: clean }).catch(() => {
      setFailed(true);
      setText((current) => restoreDraft(current, clean));
    });
  }

  const { open, done } = splitTodos(items ?? []);

  return (
    <View style={{ gap: spacing.lg }}>
      <Text style={[type.title, { color: colors.ink }]}>To do</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <SketchFrame fill={colors.white} radius={radii.lg} seed="todo-input" style={{ flex: 1, paddingHorizontal: spacing.md }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            returnKeyType="done"
            placeholder="Add something to do"
            placeholderTextColor={colors.inkFaint}
            maxLength={200}
            style={[type.body, { minHeight: 48 }]}
          />
        </SketchFrame>
        <View style={{ width: 88 }}>
          <Button label="Add" onPress={submit} disabled={!cleanTodoText(text)} />
        </View>
      </View>
      {failed ? <Text style={type.caption}>Couldn't add that. Try again.</Text> : null}
      {items && items.length === 0 ? <Text style={type.body}>Nothing here yet. Add the first thing you need to do.</Text> : null}
      {open.map((t) => (
        <Row key={t._id} text={t.text} done={false} onToggle={() => toggle({ id: t._id })} onRemove={() => remove({ id: t._id })} />
      ))}
      {done.map((t) => (
        <Row key={t._id} text={t.text} done onToggle={() => toggle({ id: t._id })} onRemove={() => remove({ id: t._id })} />
      ))}
    </View>
  );
}

function Row({ text, done, onToggle, onRemove }: { text: string; done: boolean; onToggle: () => void; onRemove: () => void }) {
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
      <Text style={[type.body, { flex: 1 }, done ? { textDecorationLine: "line-through", color: colors.inkSoft } : null]}>{text}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${text}`} onPress={onRemove} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.sm }}>
        <Text style={type.caption}>Remove</Text>
      </Pressable>
    </View>
  );
}
