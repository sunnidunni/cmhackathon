import { useMutation } from "convex/react";
import { useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { fonts, PsstButton, text, usePalette } from "@/design/psst";

export type AlbumDraft = { _id: Id<"albums">; name: string; description: string };

const errorText = (e: unknown) => {
  const m = e instanceof Error ? e.message : "";
  const known = /(Give the album a name|Keep the \w+ under \d+ characters|You can have up to \d+ albums)/.exec(m);
  return known ? `${known[1]}.` : "That didn't save. Try again in a moment.";
};

// Make or edit an album: a name, and an optional line that tells Psst what belongs in it.
export function AlbumForm({ visible, album, onClose, onSaved }: { visible: boolean; album?: AlbumDraft; onClose: () => void; onSaved?: (id: Id<"albums">) => void }) {
  const p = usePalette();
  const create = useMutation(api.albums.create);
  const update = useMutation(api.albums.update);
  const [name, setName] = useState(album?.name ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = { fontFamily: fonts.ui, fontSize: 16, lineHeight: 22, color: p.ink, backgroundColor: p.white, borderWidth: 1, borderColor: p.hair2, borderRadius: 12, padding: 12 } as const;

  const reset = () => {
    setName(album?.name ?? "");
    setDescription(album?.description ?? "");
    setError(null);
    setSaving(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const id = album ? (await update({ albumId: album._id, name, description }), album._id) : await create({ name, description });
      onSaved?.(id);
      onClose();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={reset}>
      <View style={{ flex: 1, backgroundColor: p.paper, padding: 16, paddingTop: 24, paddingBottom: 32, gap: 16 }}>
        <Text maxFontSizeMultiplier={1.84} accessibilityRole="header" style={[text.headlineCard, { color: p.ink }]}>
          {album ? "Edit album" : "New album"}
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={[text.bodyBold, { color: p.ink }]}>Name</Text>
          <TextInput accessibilityLabel="Name" value={name} onChangeText={setName} placeholder="Concert tickets" placeholderTextColor={p.ink3} maxLength={40} autoFocus={!album} returnKeyType="next" style={field} />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={[text.bodyBold, { color: p.ink }]}>What goes in it</Text>
          <TextInput
            accessibilityLabel="What goes in it"
            value={description}
            onChangeText={setDescription}
            placeholder="Tickets and line-ups for gigs and shows"
            placeholderTextColor={p.ink3}
            maxLength={140}
            multiline
            style={[field, { minHeight: 72, textAlignVertical: "top" }]}
          />
          <Text style={[text.caption, { color: p.ink2 }]}>Optional. Psst reads the name and this line, then sorts screenshots that fit into the album. Your rooms stay as they are.</Text>
        </View>
        {error ? <Text style={[text.caption, { color: p.danger }]}>{error}</Text> : null}
        <View style={{ flex: 1 }} />
        <PsstButton kind="filled" label={saving ? "Saving" : album ? "Save changes" : "Make album"} disabled={saving || name.trim() === ""} onPress={save} />
        <PsstButton kind="text" label="Cancel" onPress={onClose} />
      </View>
    </Modal>
  );
}
