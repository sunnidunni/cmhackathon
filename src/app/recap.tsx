import * as Haptics from "expo-haptics";
import { Stack, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Share, type ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions, type GestureResponderEvent, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { PsstButton, fonts, usePalette, useKeeperColors } from "@/design/psst";
import { ClosingCard, KeeperOfWeekCard, RoomsCard, TotalCard, recapSummary } from "@/components/recap/RecapCards";
import { RecapProgress } from "@/components/recap/RecapProgress";
import { KEEPER_OF_WEEK, RECAP_CARD_COUNT } from "@/components/recap/data";

export default function Recap() {
  const p = usePalette();
  const star = useKeeperColors(KEEPER_OF_WEEK);
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const last = index === RECAP_CARD_COUNT - 1;

  const goTo = (i: number) => {
    const next = Math.max(0, Math.min(RECAP_CARD_COUNT - 1, i));
    if (next === index) return;
    Haptics.selectionAsync();
    setIndex(next);
    scroller.current?.scrollTo({ x: next * width, animated: !reduce });
  };

  const onTap = (e: GestureResponderEvent) => goTo(e.nativeEvent.locationX < width / 3 ? index - 1 : index + 1);

  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      Haptics.selectionAsync();
      setIndex(i);
    }
  };

  const close = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) router.back();
    else router.replace("/today");
  };

  const share = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({ message: recapSummary() });
    } catch {}
  };

  const backgrounds = [p.paper, p.paper, star.tint, p.paper];

  return (
    <View style={[styles.screen, { backgroundColor: backgrounds[index] }]}>
      <Stack.Screen options={{ headerShown: false, presentation: "fullScreenModal", title: "Your week" }} />
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.top}>
          <RecapProgress count={RECAP_CARD_COUNT} index={index} />
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            style={({ pressed }) => [styles.close, { backgroundColor: pressed ? p.fill2 : p.fill }]}
          >
            <SymbolView
              name="xmark"
              size={15}
              weight="bold"
              tintColor={p.ink}
              fallback={
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={p.ink} strokeWidth={2.6} strokeLinecap="round">
                  <Path d="M6 6l12 12M18 6L6 18" />
                </Svg>
              }
            />
          </Pressable>
        </View>
        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onSettle}
          style={styles.screen}
        >
          {[TotalCard, RoomsCard, KeeperOfWeekCard, ClosingCard].map((Card, i) => (
            <Pressable key={i} onPress={onTap} style={{ width }} accessibilityHint="Tap the right side for the next card, the left side to go back">
              <Card active={index === i} />
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          {last ? (
            <>
              <PsstButton kind="filled" keeper={KEEPER_OF_WEEK} label="Share my week" onPress={share} />
              <PsstButton kind="text" label="Done" onPress={close} />
            </>
          ) : (
            <>
              <PsstButton kind="outline" label="Next" onPress={() => goTo(index + 1)} />
              <Pressable onPress={share} accessibilityRole="button" style={styles.shareLink} hitSlop={8}>
                <SymbolView name="square.and.arrow.up" size={15} tintColor={p.ink2} fallback={null} />
                <Text style={[styles.shareText, { color: p.ink2 }]}>Share</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  footer: { paddingHorizontal: 20, paddingBottom: 8, gap: 6 },
  shareLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 44 },
  shareText: { fontFamily: fonts.uiBold, fontSize: 15 },
});
