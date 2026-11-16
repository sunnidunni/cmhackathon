import { router } from "expo-router";
import { DevPanel } from "@/components/dev/DevPanel";
import { onlyWhen } from "@/components/dev/onlyWhen";
import { DEV_BUILD } from "@/lib/dev-flags";

function Dev() {
  return <DevPanel onClose={() => (router.canGoBack() ? router.back() : router.replace("/"))} />;
}

export default onlyWhen(DEV_BUILD, Dev);
