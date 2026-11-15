import { Text, View } from "react-native";
import { Keeper, KeeperFace, PsstButton, Skeleton, text, usePalette } from "@/design/psst";

export function ScreenTitle({ children }: { children: string }) {
  const p = usePalette();
  return (
    <Text accessibilityRole="header" style={[text.headline, { color: p.ink }]}>
      {children}
    </Text>
  );
}

export function LoadingView() {
  return (
    <View accessibilityLabel="Getting today's handful" style={{ gap: 16 }}>
      <Skeleton w="80%" h={34} />
      <Skeleton w="45%" h={18} />
      <Skeleton w="100%" h={190} style={{ borderRadius: 16 }} />
      <Skeleton w="100%" h={50} style={{ borderRadius: 10 }} />
    </View>
  );
}

export function ReadingView({ pending }: { pending: number }) {
  const p = usePalette();
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <ScreenTitle>{`Reading ${pending} new ${pending === 1 ? "screenshot" : "screenshots"}.`}</ScreenTitle>
        <Text style={[text.body, { color: p.ink2 }]}>
          Usually a few seconds. Psst reads new screenshots when you open it. Screenshots are sent to our server and an AI model to be read. You can turn this off in Settings.
        </Text>
      </View>
      <View style={{ backgroundColor: p.fill, borderRadius: 16, padding: 16, flexDirection: "row", gap: 16, minHeight: 150 }}>
        <Skeleton w={96} h={118} />
        <View style={{ flex: 1, gap: 8, paddingTop: 6 }}>
          <Skeleton w="85%" h={12} />
          <Skeleton w="55%" h={12} />
        </View>
        <View style={{ position: "absolute", right: 12, bottom: 12 }}>
          <KeeperFace id="murmur" size={44} />
        </View>
      </View>
      <Skeleton w="100%" h={50} style={{ borderRadius: 10 }} />
    </View>
  );
}

export function FailedLine({ count, onRetry }: { count: number; onRetry: () => void }) {
  const p = usePalette();
  const one = count === 1;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: 4 }}>
      <Text accessibilityLiveRegion="polite" style={[text.caption, { color: p.ink2, textAlign: "center" }]}>
        {`Couldn't read ${count} new ${one ? "screenshot" : "screenshots"}. ${one ? "It's" : "They're"} still on your phone.`}
      </Text>
      <PsstButton kind="text" label="Try again" onPress={onRetry} />
    </View>
  );
}

export function DoneView({ children }: { children?: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <Keeper id="tock" size={128} sticker />
      <Text accessibilityRole="header" style={[text.headline, { color: p.ink, textAlign: "center" }]}>
        {"That's today's handful."}
      </Text>
      <Text style={[text.lead, { color: p.ink2, textAlign: "center" }]}>Quiet from here until something needs you.</Text>
      <View style={{ alignSelf: "stretch", marginTop: 8 }}>{children}</View>
    </View>
  );
}

export function EmptyView() {
  const p = usePalette();
  return (
    <View style={{ alignItems: "center", gap: 12, paddingTop: 48 }}>
      <Keeper id="murmur" size={128} sticker />
      <Text accessibilityRole="header" style={[text.headline, { color: p.ink, textAlign: "center" }]}>
        No screenshots to keep yet.
      </Text>
      <Text style={[text.lead, { color: p.ink2, textAlign: "center" }]}>
        Take a screenshot of anything you want to remember: a flyer, a receipt, a plan in a chat. Open Psst to read it and file it into a room.
      </Text>
    </View>
  );
}
