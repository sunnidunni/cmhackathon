import { useQuery } from "convex/react";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { isConvexId } from "@/components/remind/ids";
import { defaultReminder, dueParts, nextConfidentDate, savedLabel, whenLabel } from "@/components/remind/plan";
import { KEEPERS, KeeperFace, PsstButton, ShotSticker, Skeleton, text, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";

const Decor = ({ children }: { children: ReactNode }) => (
  <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {children}
  </View>
);

export type AskSource = { screenshotId: Id<"screenshots">; title: string | null; imageUrl: string | null };
export type AskResult = { answer: string; found: boolean; sources: AskSource[] };
export type ShotDetail = NonNullable<FunctionReturnType<typeof api.shots.detail>>;
// `shots` lets a caller hand in already-loaded details; otherwise each block subscribes to its own.
export type Shots = Record<string, ShotDetail>;

const tz = () => new Date().getTimezoneOffset();

// Dev fixture answers (FIXTURES on, ask failed) are drawn from the demo world: no navigation to ids that are not in Convex, and "now" is the demo Sunday.
const DemoCtx = createContext(false);
const DEMO_NOW = Date.parse("2026-11-15T10:00:00-08:00");
const useNow = () => {
  const demo = useContext(DemoCtx);
  return useState(() => (demo ? DEMO_NOW : Date.now()))[0];
};
const useGo = () => {
  const demo = useContext(DemoCtx);
  return (path: string) => {
    if (!demo) router.push(path as never);
  };
};
const ROOM_KEEPER: Record<string, KeeperId> = { deadlines: "tock", chats: "murmur", money: "penny", ideas: "mote" };
const ROOM_NAME: Record<string, string> = { deadlines: "Deadlines", chats: "Chats", money: "Money", ideas: "Ideas", unsorted: "Unsorted" };
const TRY_LINE: Record<KeeperId, string> = {
  tock: "Dates live with Tock. Look in Deadlines.",
  murmur: "Chats live with Murmur. Look in Chats.",
  penny: "Money lives with Penny Pocket. Look in Money.",
  mote: "Ideas live with Mote. Look in Ideas.",
};

export function QuestionBubble({ question }: { question: string }) {
  const p = usePalette();
  return (
    <View style={{ alignSelf: "flex-end", maxWidth: "85%", backgroundColor: p.fill2, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 }}>
      <Text style={[text.body, { color: p.ink }]}>{question}</Text>
    </View>
  );
}

function useShot(id: Id<"screenshots"> | undefined, shots?: Shots) {
  const given = id ? shots?.[id] : undefined;
  const fetched = useQuery(api.shots.detail, id && !given && isConvexId(id) ? { id } : "skip");
  return given ?? fetched;
}

function SourceRow({ source, card, shots }: { source: AskSource; card: boolean; shots?: Shots }) {
  const p = usePalette();
  const go = useGo();
  const shot = useShot(source.screenshotId, shots);
  const now = useNow();
  const date = shot ? nextConfidentDate(shot.dates, now, tz()) ?? shot.dates.find((d) => d.confident) ?? null : null;
  const room = shot?.category ?? null;
  const dot = room && ROOM_KEEPER[room] ? KEEPERS[ROOM_KEEPER[room]].main : p.hair2;
  const subtitle = date ? `${date.what} ${whenLabel(date.when)}` : shot?.summary || null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${source.title ?? "screenshot"}`}
      onPress={() => go(`/shot/${source.screenshotId}`)}
      style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, padding: card ? 8 : 0, paddingVertical: card ? 8 : 10, borderRadius: 16, borderWidth: card ? 1 : 0, borderColor: p.hair, backgroundColor: card ? p.white : "transparent" }}
    >
      <ShotSticker uri={source.imageUrl} title={source.title ?? "Screenshot"} size={card ? 48 : 40} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[text.bodyBold, { color: p.ink }]} numberOfLines={2}>{source.title ?? "Untitled screenshot"}</Text>
        {subtitle ? <Text style={[text.caption, { color: p.ink2 }]} numberOfLines={2}>{subtitle}</Text> : null}
        {card && room ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: dot, borderWidth: 1, borderColor: p.hair2 }} />
            <Text style={[text.caption, { color: p.ink2 }]}>In {ROOM_NAME[room] ?? "Unsorted"}</Text>
          </View>
        ) : null}
      </View>
      <SymbolView name="chevron.right" size={13} weight="semibold" tintColor={p.ink3} fallback={<Text style={{ color: p.ink3 }}>›</Text>} />
    </Pressable>
  );
}

// Two-tone answer: the answer in ink, then the source in ink-2 in the same paragraph. No keeper in it.
function FoundAnswer({ result, latest, shots }: { result: AskResult; latest: boolean; shots?: Shots }) {
  const p = usePalette();
  const source = result.sources[0];
  const go = useGo();
  const shot = useShot(source?.screenshotId, shots);
  const now = useNow();
  const fresh = shot ? defaultReminder(shot.dates, now, tz()) : null;
  const existing = fresh ? shot?.dates.find((d) => d.when === fresh.date.when)?.reminder : null;
  const reminder = fresh && existing?.state === "scheduled" ? { ...fresh, ...dueParts(existing.dueAt, tz()) } : fresh;
  const isSet = existing?.state === "scheduled";
  return (
    <View style={{ gap: 14 }}>
      <Text selectable style={[text.lead, { color: p.ink }]}>
        {result.answer}
        {shot ? <Text style={{ color: p.ink2 }}>{` · from a screenshot saved ${savedLabel(shot.takenAt, now, tz())}`}</Text> : null}
      </Text>
      {source ? (
        <Pressable accessibilityRole="link" onPress={() => go(`/shot/${source.screenshotId}`)} style={{ minHeight: 44, alignSelf: "flex-start", justifyContent: "center" }}>
          <Text style={[text.bodyBold, { color: p.ink, textDecorationLine: "underline" }]}>Fix the date</Text>
        </Pressable>
      ) : null}
      {result.sources.map((s) => (
        <SourceRow key={s.screenshotId} source={s} card shots={shots} />
      ))}
      {latest && source && reminder ? (
        <View style={{ gap: 8 }}>
          <PsstButton
            kind={isSet ? "outline" : "filled"}
            label={isSet ? `Reminder set for ${reminder.label}` : `Remind me ${reminder.label}`}
            onPress={() => go(`/remind/${source.screenshotId}`)}
          />
          <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>
            {"One reminder, the day before. Change it or turn it off later."}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function NoMatch({ result, shots }: { result: AskResult; shots?: Shots }) {
  const p = usePalette();
  const go = useGo();
  const first = result.sources[0];
  const shot = useShot(first?.screenshotId, shots);
  const room = shot?.category && shot.category !== "unsorted" ? shot.category : null;
  const keeper = room ? ROOM_KEEPER[room] : undefined;
  const colors = useKeeperColors(keeper ?? "tock");
  return (
    <View style={{ gap: 14 }}>
      <Text style={[text.lead, { color: p.ink }]}>{result.answer}</Text>
      {result.sources.length > 0 ? (
        <View>
          <Text style={[text.caption, { color: p.ink2, marginBottom: 4 }]}>Closest screenshots</Text>
          {result.sources.map((s, i) => (
            <View key={s.screenshotId} style={{ borderTopWidth: i === 0 ? 1 : 0, borderBottomWidth: 1, borderColor: p.hair }}>
              <SourceRow source={s} card={false} shots={shots} />
            </View>
          ))}
        </View>
      ) : null}
      {room && keeper ? (
        <View style={{ gap: 12 }}>
          <View style={{ backgroundColor: colors.tint, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Decor><KeeperFace id={keeper} size={40} /></Decor>
            <Text style={[text.voice, { color: colors.deep, flex: 1 }]}>{TRY_LINE[keeper]}</Text>
          </View>
          <PsstButton kind="filled" keeper={keeper} label={`Open ${ROOM_NAME[room]}`} onPress={() => go(`/room/${room}`)} />
        </View>
      ) : (
        <PsstButton kind="outline" label="Open Rooms" onPress={() => router.push("/rooms")} />
      )}
    </View>
  );
}

export function AnswerBlock({ result, latest, shots, demo = false }: { result: AskResult; latest: boolean; shots?: Shots; demo?: boolean }) {
  const p = usePalette();
  return (
    <DemoCtx.Provider value={demo}>
      {demo ? <Text style={[text.caption, { color: p.danger }]}>Dev fixture: the server did not answer, so this is the demo answer.</Text> : null}
      {result.found ? <FoundAnswer result={result} latest={latest} shots={shots} /> : <NoMatch result={result} shots={shots} />}
    </DemoCtx.Provider>
  );
}

export function LookingBlock({ count }: { count: number | undefined }) {
  const p = usePalette();
  const bar = (w: `${number}%`, h = 14) => <Skeleton w={w} h={h} />;
  return (
    <View accessibilityState={{ busy: true }} accessibilityLabel="Looking through your screenshots" style={{ gap: 14 }}>
      <Text maxFontSizeMultiplier={2.95} style={[text.headline, { color: p.ink }]}>
        {count === undefined ? "Looking through your screenshots." : `Looking through your ${count} screenshot${count === 1 ? "" : "s"}.`}
      </Text>
      <View style={{ gap: 10 }}>
        {bar("92%")}
        {bar("62%")}
      </View>
      <View style={{ flexDirection: "row", gap: 12, padding: 8, borderRadius: 16, borderWidth: 1, borderColor: p.hair }}>
        <Skeleton w={44} h={66} />
        <View style={{ flex: 1, gap: 10, justifyContent: "center" }}>
          {bar("70%", 12)}
          {bar("40%", 12)}
        </View>
      </View>
    </View>
  );
}

export function FailedBlock({ onRetry }: { onRetry: () => void }) {
  const p = usePalette();
  const colors = useKeeperColors("murmur");
  return (
    <View style={{ gap: 14 }}>
      <View style={{ backgroundColor: colors.tint, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Decor><KeeperFace id="murmur" size={48} /></Decor>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[text.bodyBold, { color: p.ink }]}>Couldn&apos;t get an answer.</Text>
          <Text style={[text.caption, { color: p.ink2 }]}>The server didn&apos;t reply. Your question is kept above. Try again when you&apos;re connected.</Text>
        </View>
      </View>
      <PsstButton kind="filled" label="Try again" onPress={onRetry} />
      <Pressable accessibilityRole="link" onPress={() => router.push("/rooms")} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}>
        <Text style={[text.caption, { color: p.ink2, textAlign: "center" }]}>Open Rooms.</Text>
      </Pressable>
    </View>
  );
}
