import { Tabs } from "expo-router";
import { SwipeTabs } from "@/components/tabs/SwipeTabs";
import { colors, fonts } from "@/design";

export default function TabsLayout() {
  return (
    <Tabs
      screenLayout={({ route, children }) => <SwipeTabs name={route.name}>{children}</SwipeTabs>}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.hand, fontSize: 20, lineHeight: 26 },
        tabBarLabelPosition: "beside-icon",
        tabBarIcon: () => null,
        tabBarIconStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="today" options={{ title: "Home" }} />
      <Tabs.Screen name="rooms" options={{ title: "Rooms" }} />
      <Tabs.Screen name="ask" options={{ title: "Ask" }} />
      <Tabs.Screen name="you" options={{ title: "You" }} />
    </Tabs>
  );
}
