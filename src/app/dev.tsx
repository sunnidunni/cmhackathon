import { router } from "expo-router";
import { DevPanel } from "@/components/dev/DevPanel";

export default function Dev() {
  return <DevPanel onClose={() => (router.canGoBack() ? router.back() : router.replace("/"))} />;
}
