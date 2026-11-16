import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "@/design/psst";
import { KeepersDemo } from "@/design/keepers-v2/KeepersDemo";
import { onlyWhen } from "@/components/dev/onlyWhen";
import { DEV_BUILD } from "@/lib/dev-flags";

function Keepers() {
  const pal = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ backgroundColor: pal.paper }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 48 }}>
      <KeepersDemo />
    </ScrollView>
  );
}

export default onlyWhen(DEV_BUILD, Keepers);
