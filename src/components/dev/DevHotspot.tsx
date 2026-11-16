import { useConvexAuth } from "convex/react";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import { Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DevPanel } from "./DevPanel";

// An invisible strip over the status bar. A long press opens the developer panel in every build.
// Before sign-in succeeds there is no navigator to push onto, so the panel opens in a modal instead.
export function DevHotspot() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const pathname = usePathname();
  const [modal, setModal] = useState(false);

  function open() {
    if (modal || pathname === "/dev") return;
    if (isAuthenticated) router.push("/dev");
    else setModal(true);
  }

  return (
    <>
      <Pressable
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        delayLongPress={900}
        onLongPress={open}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: Math.max(insets.top, 20), zIndex: 1000 }}
      />
      <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}>
        <DevPanel onClose={() => setModal(false)} openRoute={() => setModal(false)} />
      </Modal>
    </>
  );
}
