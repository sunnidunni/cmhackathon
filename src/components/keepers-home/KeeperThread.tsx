import * as Haptics from "expo-haptics";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, useReducedMotion } from "react-native-reanimated";
import { fonts, KEEPERS, mix, text, useKeeperColors, usePalette, type KeeperId } from "@/design/psst";
import { KeeperAvatar } from "@/design/keepers-v2";
import type { FeedAction, FeedThread } from "./fixtures";
import { TypingDots } from "./TypingDots";

function Bubble({ keeper, children, small = false }: { keeper: KeeperId; children: string; small?: boolean }) {
  const pal = usePalette();
  const { tint } = useKeeperColors(keeper);
  return (
    <View
      accessible
      accessibilityLabel={`${KEEPERS[keeper].name} says: ${children}`}
      style={{ alignSelf: "flex-start", maxWidth: "100%", paddingHorizontal: 14, paddingVertical: small ? 8 : 10, borderRadius: 18, borderTopLeftRadius: 6, backgroundColor: tint, borderWidth: 1, borderColor: pal.hair }}
    >
      <Text maxFontSizeMultiplier={2.2} style={[small ? text.voiceRow : text.voice, { color: pal.ink }]}>
        {children}
      </Text>
    </View>
  );
}

function ActionChip({ keeper, action, onPress }: { keeper: KeeperId; action: FeedAction; onPress: () => void }) {
  const pal = usePalette();
  const { main } = useKeeperColors(keeper);
  const fg = action.primary ? pal.kl : pal.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: action.primary ? pal.kl : pal.hair2,
        backgroundColor: action.primary ? (pressed ? mix(main, pal.kl, 0.8) : main) : pressed ? pal.fill2 : pal.white,
      })}
    >
      {action.symbol ? <SymbolView name={action.symbol} size={15} weight="semibold" tintColor={fg} /> : null}
      <Text maxFontSizeMultiplier={2} style={{ fontFamily: fonts.uiBold, fontSize: 15, lineHeight: 20, color: fg }}>
        {action.label}
      </Text>
    </Pressable>
  );
}

function YouChip({ label }: { label: string }) {
  const pal = usePalette();
  return (
    <View accessible accessibilityLabel={`You chose: ${label}`} style={{ alignSelf: "flex-end", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderTopRightRadius: 6, backgroundColor: pal.ink }}>
      <Text maxFontSizeMultiplier={2} style={{ fontFamily: fonts.uiBold, fontSize: 14, lineHeight: 19, color: pal.paper }}>
        {label}
      </Text>
    </View>
  );
}

export function KeeperThread({ thread, typing = false }: { thread: FeedThread; typing?: boolean }) {
  const pal = usePalette();
  const reduce = useReducedMotion();
  const { deep } = useKeeperColors(thread.keeper);
  const [chosen, setChosen] = useState<FeedAction | null>(null);
  const layout = reduce ? undefined : LinearTransition.springify().damping(20);

  const choose = (action: FeedAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    setChosen(action);
  };
  const undo = () => {
    Haptics.selectionAsync().catch(() => undefined);
    setChosen(null);
  };

  return (
    <Animated.View entering={reduce ? undefined : FadeInDown.duration(320)} layout={layout} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <KeeperAvatar name={thread.keeper} size={40} state={chosen && chosen.primary ? "smile" : "rest"} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text maxFontSizeMultiplier={2} style={{ fontFamily: fonts.uiBold, fontSize: 15, lineHeight: 20, color: deep }}>
            {KEEPERS[thread.keeper].name}
          </Text>
          {thread.time ? (
            <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink3, fontVariant: ["tabular-nums"] }]}>
              {thread.time}
            </Text>
          ) : null}
        </View>

        {typing ? (
          <TypingDots keeper={thread.keeper} />
        ) : (
          <>
            {thread.lines.map((line) => (
              <Bubble key={line} keeper={thread.keeper}>
                {line}
              </Bubble>
            ))}
            {thread.source ? (
              <Text maxFontSizeMultiplier={2} style={[text.caption, { color: pal.ink2 }]}>
                {thread.source}
              </Text>
            ) : null}

            {thread.actions && !chosen ? (
              <Animated.View exiting={reduce ? undefined : FadeOut.duration(160)} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {thread.actions.map((a) => (
                  <ActionChip key={a.id} keeper={thread.keeper} action={a} onPress={() => choose(a)} />
                ))}
              </Animated.View>
            ) : null}

            {chosen ? (
              <Animated.View entering={reduce ? undefined : FadeIn.duration(220)} layout={layout} style={{ gap: 6, marginTop: 4 }}>
                <YouChip label={chosen.label} />
                <Animated.View entering={reduce ? undefined : FadeInDown.delay(260).duration(260)} style={{ gap: 2 }}>
                  <Bubble keeper={thread.keeper} small>
                    {chosen.reply}
                  </Bubble>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Undo ${chosen.label}`} hitSlop={6} onPress={undo} style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingHorizontal: 4 }}>
                    <Text maxFontSizeMultiplier={2} style={{ fontFamily: fonts.uiBold, fontSize: 14, color: pal.ink2, textDecorationLine: "underline", textDecorationColor: pal.hair2 }}>
                      Undo
                    </Text>
                  </Pressable>
                </Animated.View>
              </Animated.View>
            ) : null}
          </>
        )}
      </View>
    </Animated.View>
  );
}
