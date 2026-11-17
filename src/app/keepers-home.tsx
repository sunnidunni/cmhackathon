import { Stack } from "expo-router";
import { ScrollView } from "react-native";
import { KeepersFeed } from "@/components/keepers-home/KeepersFeed";
import { fonts, usePalette } from "@/design/psst";
import { onlyWhen } from "@/components/dev/onlyWhen";
import { FIXTURES } from "@/lib/fixtures";

function KeepersHome() {
  const pal = usePalette();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Your keepers",
          headerLargeTitle: true,
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
          headerTintColor: pal.ink,
          headerStyle: { backgroundColor: pal.paper },
          headerTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
          headerLargeTitleStyle: { fontFamily: fonts.uiBold, color: pal.ink },
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: pal.paper }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 56 }}
      >
        <KeepersFeed />
      </ScrollView>
    </>
  );
}

export default onlyWhen(FIXTURES, KeepersHome);
