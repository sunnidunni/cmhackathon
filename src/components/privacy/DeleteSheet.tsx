import { Modal, ScrollView, Text, View } from "react-native";
import { PsstButton, text, usePalette } from "@/design/psst";

type Props = { visible: boolean; onCancel: () => void; onConfirm: () => void };

export function DeleteSheet({ visible, onCancel, onConfirm }: Props) {
  const pal = usePalette();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: pal.paper }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 36, gap: 16 }}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.67} style={[text.headline, { color: pal.ink }]}>
            Delete everything?
          </Text>
          <Text maxFontSizeMultiplier={2} style={[text.lead, { color: pal.ink2 }]}>
            This removes every screenshot, reminder and answer from Shots and our server. The photos stay on your phone.
          </Text>
          <Text maxFontSizeMultiplier={2} style={[text.lead, { color: pal.ink2 }]}>
            Reading new screenshots turns off until you turn it back on in Settings.
          </Text>
        </ScrollView>
        <View style={{ gap: 10, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36, borderTopWidth: 1, borderTopColor: pal.hair }}>
          <PsstButton kind="outline" danger label="Delete everything" onPress={onConfirm} />
          <PsstButton kind="text" label="Cancel" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}
