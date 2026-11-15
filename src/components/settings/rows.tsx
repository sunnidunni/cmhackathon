import type { ReactNode } from "react";
import { Pressable, Switch, Text, View, useWindowDimensions } from "react-native";
import { fonts, text, usePalette } from "@/design/psst";

const ROW_PADDING = 16;

export function SectionLabel({ children }: { children: string }) {
  const pal = usePalette();
  return (
    <Text accessibilityRole="header" maxFontSizeMultiplier={2.25} style={[text.caption, { fontFamily: fonts.uiBold, color: pal.ink2, marginLeft: 4 }]}>
      {children}
    </Text>
  );
}

export function Footer({ children }: { children: string }) {
  const pal = usePalette();
  return <Text style={[text.caption, { color: pal.ink2, marginHorizontal: 4 }]}>{children}</Text>;
}

// A rounded group of rows on paper. Rows draw their own hairlines.
export function Group({ children }: { children: ReactNode }) {
  const pal = usePalette();
  return (
    <View style={{ backgroundColor: pal.white, borderRadius: 16, borderWidth: 1, borderColor: pal.hair, overflow: "hidden" }}>{children}</View>
  );
}

type RowBase = { title: string; detail?: string; first?: boolean };

function RowShell({ first, children }: { first?: boolean; children: ReactNode }) {
  const pal = usePalette();
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: pal.hair }}>{children}</View>
  );
}

export function Chevron() {
  const pal = usePalette();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 9, height: 9, borderTopWidth: 2, borderRightWidth: 2, borderColor: pal.ink2, transform: [{ rotate: "45deg" }] }}
    />
  );
}

function Labels({ title, detail, tone }: { title: string; detail?: string; tone?: "danger" }) {
  const pal = usePalette();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[text.bodyBold, { color: tone === "danger" ? pal.danger : pal.ink }]}>{title}</Text>
      {detail ? <Text style={[text.caption, { color: pal.ink2 }]}>{detail}</Text> : null}
    </View>
  );
}

export function SwitchRow({
  title,
  detail,
  value,
  onValueChange,
  first,
  testID,
}: RowBase & { value: boolean; onValueChange: (on: boolean) => void; testID?: string }) {
  const pal = usePalette();
  const { fontScale } = useWindowDimensions();
  return (
    <RowShell first={first}>
      <View
        style={{
          minHeight: 56,
          paddingVertical: 10,
          paddingHorizontal: ROW_PADDING,
          flexDirection: fontScale >= 1.6 ? "column" : "row",
          alignItems: fontScale >= 1.6 ? "flex-start" : "center",
          gap: 12,
        }}
      >
        <Labels title={title} detail={detail} />
        <Switch
          accessibilityLabel={title}
          accessibilityHint={detail}
          value={value}
          onValueChange={onValueChange}
          testID={testID}
          trackColor={{ true: pal.ink, false: pal.fill2 }}
          ios_backgroundColor={pal.fill2}
          thumbColor="#FFFFFF"
        />
      </View>
    </RowShell>
  );
}

// A whole row is one tappable element; value and chevron are part of its label.
export function ActionRow({
  title,
  detail,
  value,
  onPress,
  disabled,
  tone,
  trailing,
  first,
  chevron = true,
}: RowBase & {
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "danger";
  trailing?: ReactNode;
  chevron?: boolean;
}) {
  const pal = usePalette();
  return (
    <RowShell first={first}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[title, value, detail].filter(Boolean).join(", ")}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          minHeight: 56,
          paddingVertical: 10,
          paddingHorizontal: ROW_PADDING,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: pressed ? pal.fill : "transparent",
          opacity: disabled ? 0.6 : 1,
        })}
      >
        <Labels title={title} detail={detail} tone={tone} />
        {value ? <Text style={[text.body, { color: pal.ink2 }]}>{value}</Text> : null}
        {trailing}
        {chevron ? <Chevron /> : null}
      </Pressable>
    </RowShell>
  );
}
