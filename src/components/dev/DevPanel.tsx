import { useConvexAuth, useQuery } from "convex/react";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import { ActionRow, Group, SectionLabel, SwitchRow } from "@/components/settings/rows";
import { fonts, text, usePalette } from "@/design/psst";
import { convex } from "@/lib/convex";
import { useConnectionError } from "@/lib/connection-error";
import { FIXTURES } from "@/lib/fixtures";
import { setNotesPrefs, useNotesPrefs } from "@/lib/notes-prefs";
import { useLibraryDiagnostics, useReadAllPhotos } from "@/lib/photos";
import { buildLine, connectionLine, planLine, progressLine } from "./status";

function Line({ label, value }: { label: string; value: string }) {
  const pal = usePalette();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ paddingHorizontal: 16, paddingVertical: 10, gap: 2 }}>
      <Text style={[text.caption, { color: pal.ink2 }]}>{label}</Text>
      <Text selectable style={[text.body, { color: pal.ink, fontFamily: fonts.ui }]}>
        {value}
      </Text>
    </View>
  );
}

export function DevPanel({ onClose, openRoute }: { onClose: () => void; openRoute?: (path: "/design" | "/kit") => void }) {
  const pal = usePalette();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const info = useQuery(api.sync.importInfo, isAuthenticated ? {} : "skip");
  const progress = useQuery(api.sync.progress, isAuthenticated ? {} : "skip");
  const lastError = useConnectionError();
  const [socket, setSocket] = useState(() => convex.connectionState().isWebSocketConnected);
  useEffect(() => convex.subscribeToConnectionState((s) => setSocket(s.isWebSocketConnected)), []);
  const [readAll, setReadAll] = useReadAllPhotos();
  const diag = useLibraryDiagnostics(true);
  const notes = useNotesPrefs();
  const go = openRoute ?? ((path) => router.push(path));
  const rule = { borderTopWidth: 1, borderTopColor: pal.hair } as const;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pal.paper }} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 48, gap: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.67} style={[text.headline, { flex: 1, color: pal.ink }]}>
          Developer
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: pal.hair, backgroundColor: pal.white }}
        >
          <Text style={[text.bodyBold, { color: pal.ink }]}>Close</Text>
        </Pressable>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Build</SectionLabel>
        <Group>
          <Line
            label="App"
            value={buildLine({ name: Constants.expoConfig?.name, version: Constants.expoConfig?.version, debug: __DEV__, devTools: process.env.EXPO_PUBLIC_DEV_TOOLS })}
          />
        </Group>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Server</SectionLabel>
        <Group>
          <Line label="Convex address" value={process.env.EXPO_PUBLIC_CONVEX_URL ?? "unavailable"} />
          <View style={rule}>
            <Line label="Connection" value={connectionLine({ socket, loading: isLoading, authenticated: isAuthenticated })} />
          </View>
          <View style={rule}>
            <Line label="Last connection error" value={lastError ?? "none"} />
          </View>
        </Group>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>{"This phone's user"}</SectionLabel>
        <Group>
          <Line label="User id" value={me?._id ?? "unavailable"} />
          <View style={rule}>
            <Line label="Plan" value={planLine(info)} />
          </View>
          <View style={rule}>
            <Line label="Screenshots" value={progressLine(progress)} />
          </View>
        </Group>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Photos</SectionLabel>
        <Group>
          <SwitchRow first title="Read all photos" value={readAll} onValueChange={setReadAll} testID="read-all-switch" />
        </Group>
        <Text style={[text.caption, { color: pal.ink2, fontFamily: fonts.ui }]} testID="diagnostics">
          {diag === null
            ? "Reading library…"
            : typeof diag === "string"
              ? `Diagnostics failed: ${diag}`
              : `Smart albums: ${diag.smartAlbums.join(", ") || "none"}\nScreenshots album: ${diag.screenshotsAlbumCount ?? "missing"} · screenshot subtype: ${diag.screenshotSubtypeCount} · all images: ${diag.allImagesCount}`}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Notes</SectionLabel>
        <Group>
          <SwitchRow
            first
            title="Notes tab"
            detail="Adds a Notes tab with a note for each read screenshot."
            value={notes.tab}
            onValueChange={(on) => void setNotesPrefs({ tab: on })}
            testID="notes-tab-switch"
          />
          {notes.tab ? (
            <SwitchRow
              title="Group notes by date"
              detail={notes.byDate ? "Today, yesterday, this week, then by month." : "Off. Notes are grouped by room."}
              value={notes.byDate}
              onValueChange={(on) => void setNotesPrefs({ byDate: on })}
              testID="notes-by-date-switch"
            />
          ) : null}
        </Group>
      </View>

      <View style={{ gap: 8 }}>
        <SectionLabel>Shortcuts</SectionLabel>
        <Group>
          <ActionRow first title="Design" onPress={() => go("/design")} />
          {FIXTURES ? <ActionRow title="Kit" onPress={() => go("/kit")} /> : null}
        </Group>
      </View>
    </ScrollView>
  );
}
