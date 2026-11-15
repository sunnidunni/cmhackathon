import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Linking, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Button, LoadingView, MessageView } from "@/components/state-views";
import {
  DEV_TOOLS,
  getPhotoAccess,
  type PhotoAccess,
  useLibraryDiagnostics,
  useReadAllPhotos,
} from "@/lib/photos";
import { markImportStarted, runSync } from "@/lib/sync";

const STATUS_LABEL = {
  uploaded: "Reading",
  processing: "Reading",
  ready: "Ready",
  failed: "Failed",
} as const;

type ImportState =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done"; message: string }
  | { kind: "failed"; message: string };

export default function Library() {
  const router = useRouter();
  const screenshots = useQuery(api.screenshots.list);
  const [readAll, setReadAll] = useReadAllPhotos();
  const [access, setAccess] = useState<PhotoAccess | null>(null);
  const [state, setState] = useState<ImportState>({ kind: "idle" });
  const diag = useLibraryDiagnostics();

  useEffect(() => {
    getPhotoAccess().then(setAccess, () => setAccess(null));
  }, []);

  async function onImport() {
    setState({ kind: "working" });
    try {
      await markImportStarted();
      const result = await runSync();
      if (result.uploaded > 0) setState({ kind: "idle" });
      else
        setState({
          kind: "done",
          message:
            result.skipped > 0
              ? "All caught up. Nothing new to bring in."
              : readAll
                ? "No photos on this phone yet."
                : "No screenshots found yet.",
        });
    } catch (e) {
      setState({ kind: "failed", message: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.row}>
        <Text style={styles.header}>Your screenshots</Text>
        <View style={styles.links}>
          <Text style={styles.link} onPress={() => router.push("/ask")} accessibilityRole="button">
            Ask
          </Text>
        </View>
      </View>

      {access === "limited" ? (
        <View style={styles.card}>
          <Text style={styles.cardText}>
            You picked a few photos. Give access to all your screenshots so nothing gets missed.
          </Text>
          <Text style={styles.link} onPress={() => Linking.openSettings()}>
            Open Settings
          </Text>
        </View>
      ) : null}

      {DEV_TOOLS ? (
        <View style={styles.dev}>
          <View style={styles.row}>
            <Text style={styles.devText}>Dev: read all photos</Text>
            <Switch value={readAll} onValueChange={setReadAll} testID="read-all-switch" />
          </View>
          <Text style={styles.devText} testID="diagnostics">
            {diag === null
              ? "Reading library…"
              : typeof diag === "string"
                ? `Diagnostics failed: ${diag}`
                : `Smart albums: ${diag.smartAlbums.join(", ") || "none"}\nScreenshots album: ${diag.screenshotsAlbumCount ?? "missing"} · screenshot subtype: ${diag.screenshotSubtypeCount} · all images: ${diag.allImagesCount}`}
          </Text>
        </View>
      ) : null}

      <Button
        label={state.kind === "working" ? "Bringing them in…" : "Bring in my screenshots"}
        onPress={onImport}
        disabled={state.kind === "working"}
      />
      {state.kind === "done" ? <Text style={styles.note}>{state.message}</Text> : null}
      {state.kind === "failed" ? (
        <Text style={styles.error}>Couldn't bring it in: {state.message}</Text>
      ) : null}

      {screenshots === undefined ? (
        <LoadingView label="Loading your screenshots…" />
      ) : screenshots.length === 0 ? (
        <MessageView title="Nothing here yet" body="Tap the button to bring in your newest screenshot." />
      ) : (
        <FlatList
          data={screenshots}
          keyExtractor={(s) => s._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {item.url ? (
                <Image source={{ uri: item.url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, styles.missing]} />
              )}
              <View style={styles.meta}>
                <Text style={styles.status} numberOfLines={2}>
                  {item.title ?? (item.status === "failed" ? "Couldn't read this one" : "Reading…")}
                </Text>
                <Text style={styles.muted}>
                  {STATUS_LABEL[item.status]}
                  {item.category ? ` · ${item.category}` : ""}
                </Text>
                <Text style={styles.muted}>{new Date(item.takenAt).toLocaleString()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, gap: 12, backgroundColor: "white" },
  header: { fontSize: 28, fontWeight: "700", marginTop: 8 },
  card: { backgroundColor: "#FFF4E0", borderRadius: 12, padding: 12, gap: 6 },
  cardText: { fontSize: 14, color: "#5A3E00" },
  link: { fontSize: 14, color: "#3D5AFE", fontWeight: "600" },
  dev: { backgroundColor: "#F1F1F4", borderRadius: 12, padding: 12, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  devText: { fontSize: 12, color: "#333", fontFamily: "Menlo" },
  note: { fontSize: 14, color: "#555", textAlign: "center" },
  error: { fontSize: 14, color: "#B00020", textAlign: "center" },
  list: { gap: 12, paddingBottom: 40 },
  item: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 90, height: 160, borderRadius: 10, backgroundColor: "#EEE" },
  missing: { borderWidth: 1, borderColor: "#DDD" },
  meta: { gap: 4, flex: 1 },
  links: { flexDirection: "row", gap: 16 },
  status: { fontSize: 16, fontWeight: "600" },
  muted: { fontSize: 13, color: "#777" },
});
