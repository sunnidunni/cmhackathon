import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlightStatusView } from "@/components/act/FlightStatusView";
import { KeeperFace, PsstButton, text, usePalette } from "@/design/psst";
import { DEV_TOOLS } from "@/lib/dev-flags";

const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));

export default function FlightStatus() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { at } = useLocalSearchParams<{ at?: string }>();
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: p.paper }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <KeeperFace id="tock" size={32} />
            <Text style={[text.caption, { color: p.ink2 }]}>Live flight status</Text>
          </View>
          <PsstButton kind="text" label="Close" onPress={close} />
        </View>
        <FlightStatusView onClose={close} startAt={DEV_TOOLS && at ? Number(at) || 0 : 0} />
      </ScrollView>
    </SafeAreaView>
  );
}
