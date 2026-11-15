import { View } from "react-native";
import { DEMO_ACTS } from "@/lib/act/scenarios";
import { useActState } from "@/lib/act/store";
import { FIXTURES } from "@/lib/fixtures";
import { ActCard } from "./ActCard";
import { Fade } from "./Motion";

export function ActCards() {
  const { dismissed, completed } = useActState();
  const acts = (FIXTURES ? DEMO_ACTS : []).filter((a) => a.steps.length > 0 && !dismissed.has(a.id) && !completed.has(a.id));
  if (acts.length === 0) return null;
  return (
    <View style={{ gap: 16 }}>
      {acts.map((a) => (
        <Fade key={a.id}>
          <ActCard scenario={a} />
        </Fade>
      ))}
    </View>
  );
}
