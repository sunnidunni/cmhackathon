import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, type } from "@/design";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, padding: spacing.xl }}>{children}</SafeAreaView>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={type.title}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={type.body}>{children}</Text>;
}

export function Stack({ children, gap = spacing.lg }: { children: React.ReactNode; gap?: number }) {
  return <View style={{ gap }}>{children}</View>;
}
