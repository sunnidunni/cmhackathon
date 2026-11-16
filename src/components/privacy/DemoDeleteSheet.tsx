import { Modal, Text, View } from "react-native";
import { PsstButton, text, usePalette } from "@/design/psst";

type Props = { visible: boolean; onCancel: () => void; onConfirm: () => void };

export function DemoDeleteSheet({ visible, onCancel, onConfirm }: Props) {
  const pal = usePalette();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: pal.paper, padding: 24, paddingTop: 36, gap: 16 }}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.67} style={[text.headline, { color: pal.ink }]}>
          Delete everything?
        </Text>
        <Text maxFontSizeMultiplier={2} style={[text.lead, { color: pal.ink2 }]}>
          This screen is a demo, so nothing will be deleted here.
        </Text>
        <Text maxFontSizeMultiplier={2} style={[text.lead, { color: pal.ink2 }]}>
          Delete everything anytime in Settings.
        </Text>
        <View style={{ flex: 1 }} />
        <View style={{ gap: 10, paddingBottom: 24 }}>
          <PsstButton kind="outline" danger label="Delete" onPress={onConfirm} />
          <PsstButton kind="text" label="Cancel" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}
