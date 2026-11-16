import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "@/design/psst";
import { KeepersDemo } from "@/design/keepers-v2/KeepersDemo";

export default function Keepers() {
  const pal = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: pal.paper }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 48 }}>
      <KeepersDemo />
    </ScrollView>
  );
}
