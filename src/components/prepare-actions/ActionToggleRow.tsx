import * as Haptics from "expo-haptics";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Switch, Text, View, useWindowDimensions } from "react-native";
import { text, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";
import { KeeperAvatar } from "@/design/keepers-v2";

type Props = {
  symbol: SymbolViewProps["name"];
  keeper: KeeperId;
  title: string;
  detail: string;
  value: boolean;
  onValueChange: (on: boolean) => void;
  disabled: boolean;
  first?: boolean;
};

export function ActionToggleRow({ symbol, keeper, title, detail, value, onValueChange, disabled, first }: Props) {
  const pal = usePalette();
  const colors = useKeeperColors(keeper, disabled);
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= 1.6;

  return (
    <View
      style={{
        borderTopWidth: first ? 0 : 1,
        borderTopColor: pal.hair,
        minHeight: 64,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: stacked ? "column" : "row",
        alignItems: stacked ? "flex-start" : "center",
        gap: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flex: stacked ? undefined : 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint, alignItems: "center", justifyContent: "center" }}
        >
          <SymbolView name={symbol} size={20} weight="semibold" tintColor={colors.deep} fallback={<KeeperAvatar name={keeper} size={30} state={disabled ? "muted" : "rest"} />} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[text.bodyBold, { color: pal.ink }]}>{title}</Text>
          <Text style={[text.caption, { color: pal.ink2 }]}>{detail}</Text>
        </View>
      </View>
      <Switch
        accessibilityLabel={title}
        accessibilityHint={detail}
        disabled={disabled}
        value={value}
        onValueChange={(on) => {
          Haptics.selectionAsync().catch(() => undefined);
          onValueChange(on);
        }}
        trackColor={{ true: pal.ink, false: pal.fill2 }}
        ios_backgroundColor={pal.fill2}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
