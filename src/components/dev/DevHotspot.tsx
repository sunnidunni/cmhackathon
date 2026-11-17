import { useConvexAuth } from "convex/react";
import { router, usePathname } from "expo-router";
import { useState, type ReactNode } from "react";
import { Modal, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEV_BUILD } from "@/lib/dev-flags";
import { DevPanel } from "./DevPanel";

// A long press near the top of the screen opens the developer panel. Only in developer builds: see DEV_BUILD.
// iOS never delivers touches inside the status bar and Dynamic Island band, so the zone reaches
// 44pt below the inset. It is a gesture on the app root rather than a view on top, so taps on
// buttons in that zone still work; only a 900ms hold opens the panel.
// Native sheets and modals are presented outside this view, so the Settings "Developer" row covers those.
// Before sign-in succeeds there is no navigator to push onto, so the panel opens in a modal instead.
export function DevHotspot({ children }: { children: ReactNode }) {
  return DEV_BUILD ? <Hotspot>{children}</Hotspot> : <>{children}</>;
}

function Hotspot({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const pathname = usePathname();
  const [modal, setModal] = useState(false);

  function open() {
    if (modal || pathname === "/dev") return;
    if (isAuthenticated) router.push("/dev");
    else setModal(true);
  }

  const longPress = Gesture.LongPress()
    .minDuration(900)
    .hitSlop({ top: 0, height: insets.top + 44 })
    .runOnJS(true)
    .onStart(open);

  return (
    <>
      <GestureDetector gesture={longPress}>
        <View style={{ flex: 1 }}>{children}</View>
      </GestureDetector>
      <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}>
        <DevPanel onClose={() => setModal(false)} openRoute={() => setModal(false)} />
      </Modal>
    </>
  );
}
