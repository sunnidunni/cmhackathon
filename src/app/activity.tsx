import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { ACTIVITY, DAY_LABELS, DAYS, type ActivityFilter } from "@/components/activity/data";
import { DaySection, EmptyActivity, FilterPills } from "@/components/activity/ActivityViews";
import { fonts, usePalette } from "@/design/psst";

export default function Activity() {
  const pal = usePalette();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const groups = useMemo(() => {
    const items = filter === "all" ? ACTIVITY : ACTIVITY.filter((a) => a.kind === filter);
    return DAYS.map((day) => ({ day, items: items.filter((a) => a.day === day) })).filter((g) => g.items.length > 0);
  }, [filter]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Activity",
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerShadowVisible: false,
          headerTintColor: pal.ink,
          headerStyle: { backgroundColor: pal.paper },
          headerLargeStyle: { backgroundColor: pal.paper },
          headerTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
          headerLargeTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: pal.paper }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <View style={{ paddingTop: 8 }}>
          <FilterPills value={filter} onChange={setFilter} />
        </View>
        {groups.length === 0 ? (
          <EmptyActivity key={filter} filter={filter} />
        ) : (
          groups.map((g) => <DaySection key={g.day} label={DAY_LABELS[g.day]} items={g.items} />)
        )}
      </ScrollView>
    </>
  );
}
