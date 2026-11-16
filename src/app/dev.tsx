import { router, Stack } from "expo-router";
import { DevPanel } from "@/components/dev/DevPanel";

export default function Dev() {
  return (
    <>
      <Stack.Screen options={{ presentation: "modal", headerShown: false }} />
      <DevPanel onClose={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
    </>
  );
}
