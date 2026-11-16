import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { KeeperFace, PsstButton, text, useKeeperColors, usePalette } from "@/design/psst";
import { useBigText } from "@/lib/bigText";
import { buildTodoRows, showAllLabel, visibleTodos, type ShotInfo, type TodoItem, type TodoRow } from "./todoRows";

function Row({ row, onToggle }: { row: TodoRow; onToggle: () => void }) {
  const p = usePalette();
  const { main, deep } = useKeeperColors(row.keeper, row.done);
  const big = useBigText();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", minHeight: 60, borderTopWidth: 1, borderTopColor: p.hair }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: row.done }}
        accessibilityLabel={row.text}
        onPress={onToggle}
        style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: row.done ? main : p.hair2, backgroundColor: row.done ? main : "transparent", alignItems: "center", justifyContent: "center" }}>
          {row.done ? (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={p.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7.5" />
            </Svg>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={row.screenshotId ? `Open the screenshot for ${row.text}` : row.text}
        disabled={!row.screenshotId}
        onPress={() => router.push(`/shot/${row.screenshotId}` as never)}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, paddingVertical: 8 }}
      >
        <KeeperFace id={row.keeper} size={22} muted={row.done} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={big ? undefined : 2} style={[text.bodyBold, { color: row.done ? p.ink2 : p.ink }, row.done && { textDecorationLine: "line-through" }]}>
            {row.text}
          </Text>
          {row.due && !row.done ? <Text style={[text.caption, { color: row.late ? p.ink2 : deep }]}>{row.due}</Text> : null}
        </View>
      </Pressable>
    </View>
  );
}

// demo is dev-only preview data; it replaces the live queries.
export function TodoSection({ day, shown, demo }: { day: string | undefined; shown: string[]; demo?: { todos: TodoItem[]; shots: [string, ShotInfo][] } | null }) {
  const p = usePalette();
  const live = useQuery(api.todos.list, demo ? "skip" : {});
  const library = useQuery(api.rooms.all, demo ? "skip" : {});
  const toggle = useMutation(api.todos.toggle);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const todos = demo?.todos ?? live;
  const shots = useMemo(() => new Map<string, ShotInfo>(demo ? demo.shots : (library?.items ?? []).map((i) => [i._id, { category: i.category, date: i.date }])), [demo, library]);
  if (!todos || todos.length === 0) return null;
  const rows = buildTodoRows(todos, shots, day, new Set(shown));
  const visible = visibleTodos(rows.open, rows.done, expanded);

  const check = async (row: TodoRow) => {
    setFailed(false);
    if (demo) return;
    await toggle({ id: row.id as Id<"todos"> }).catch(() => setFailed(true));
  };

  return (
    <View>
      <Text style={[text.caption, { color: p.ink2, marginBottom: 8 }]}>To do</Text>
      {[...visible.open, ...visible.done].map((row) => (
        <Row key={row.id} row={row} onToggle={() => check(row)} />
      ))}
      <View style={{ borderTopWidth: 1, borderTopColor: p.hair }} />
      {visible.hidden > 0 ? <PsstButton kind="text" label={showAllLabel(rows.open.length, rows.done.length)} onPress={() => setExpanded(true)} /> : null}
      {failed ? <Text accessibilityLiveRegion="polite" style={[text.caption, { color: p.ink2, textAlign: "center" }]}>{"That didn't work. Try again in a moment."}</Text> : null}
    </View>
  );
}
