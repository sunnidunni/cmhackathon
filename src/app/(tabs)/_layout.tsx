import { TabList, Tabs, TabTrigger, type TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabPager } from "@/components/tabs/TabPager";
import { colors, spacing, type } from "@/design";

function TabButton({ label, isFocused, onPress, onLongPress }: Pick<TabTriggerSlotProps, "isFocused" | "onPress" | "onLongPress"> & { label: string }) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={{ flex: 1, minHeight: 49, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={[type.heading, { color: isFocused ? colors.ink : colors.inkFaint }]}>{label}</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1, backgroundColor: colors.paper }}>
      <TabPager />
      <TabList
        style={{
          backgroundColor: colors.paper,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          paddingBottom: insets.bottom,
          paddingHorizontal: spacing.sm,
        }}
      >
        <TabTrigger name="today" href="/today" asChild>
          <TabButton label="Home" />
        </TabTrigger>
        <TabTrigger name="rooms" href="/rooms" asChild>
          <TabButton label="Rooms" />
        </TabTrigger>
        <TabTrigger name="ask" href="/ask" asChild>
          <TabButton label="Ask" />
        </TabTrigger>
        <TabTrigger name="you" href="/you" asChild>
          <TabButton label="You" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
