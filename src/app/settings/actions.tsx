import { Stack } from "expo-router";
import { PrepareActionsScreen } from "@/components/prepare-actions/PrepareActionsScreen";
import { usePalette } from "@/design/psst";

export default function PrepareActions() {
  const pal = usePalette();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Let Shots prepare actions",
          presentation: "formSheet",
          headerShown: false,
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.94, 1],
          sheetInitialDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: true,
          contentStyle: { backgroundColor: pal.paper },
        }}
      />
      <PrepareActionsScreen />
    </>
  );
}
