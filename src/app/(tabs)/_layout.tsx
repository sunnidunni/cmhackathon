import { NativeTabs } from "expo-router/native-tabs";
import { fonts, usePalette } from "@/design/psst";
import { useNotesPrefs } from "@/lib/notes-prefs";

export default function TabsLayout() {
  const pal = usePalette();
  const { tab: notesTab } = useNotesPrefs();
  return (
    <NativeTabs tintColor={pal.ink} minimizeBehavior="onScrollDown" backgroundColor={pal.paper} shadowColor={pal.hair} labelStyle={{ fontFamily: fonts.uiBold }}>
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Icon sf={{ default: "sun.max", selected: "sun.max.fill" }} />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rooms">
        <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <NativeTabs.Trigger.Label>Rooms</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes" hidden={!notesTab}>
        <NativeTabs.Trigger.Icon sf={{ default: "note.text", selected: "note.text" }} />
        <NativeTabs.Trigger.Label>Notes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ask" role="search">
        <NativeTabs.Trigger.Icon sf={{ default: "questionmark.bubble", selected: "questionmark.bubble.fill" }} />
        <NativeTabs.Trigger.Label>Ask</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you" hidden />
    </NativeTabs>
  );
}
