import { Redirect } from "expo-router";
import type { ComponentType } from "react";

// A route that only exists in some builds. Elsewhere it sends the visitor home, so a deep link can't open it.
export function onlyWhen<P extends object>(allowed: boolean, Screen: ComponentType<P>) {
  function Gated(props: P) {
    return allowed ? <Screen {...props} /> : <Redirect href="/" />;
  }
  Gated.displayName = `onlyWhen(${Screen.displayName ?? Screen.name})`;
  return Gated;
}
