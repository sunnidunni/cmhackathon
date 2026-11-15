import { AppState } from "react-native";
import { blink } from "@/design/motion";

let last = 0;
let active = AppState.currentState === "active";
let listening = false;

function listen() {
  if (listening) return;
  listening = true;
  AppState.addEventListener("change", (state) => {
    active = state === "active";
  });
}

export function registerBlink(run: () => void): () => void {
  listen();
  let alive = true;
  let timer: ReturnType<typeof setTimeout>;
  const gap = () => blink.gapMin + Math.random() * (blink.gapMax - blink.gapMin);
  const schedule = () => {
    timer = setTimeout(fire, gap());
  };
  const start = () => {
    last = Date.now();
    run();
  };
  const spaced = (retry: () => void) => {
    const wait = last + blink.crossKeeperMin - Date.now();
    if (wait <= 0) return true;
    timer = setTimeout(retry, wait + 16);
    return false;
  };
  const second = () => {
    if (!alive) return;
    if (!active) return schedule();
    if (!spaced(second)) return;
    start();
    schedule();
  };
  const fire = () => {
    if (!alive) return;
    if (!active) return schedule();
    if (!spaced(fire)) return;
    start();
    if (Math.random() >= blink.doubleChance) return schedule();
    timer = setTimeout(second, blink.close + blink.hold + blink.open + blink.doubleGap);
  };
  schedule();
  return () => {
    alive = false;
    clearTimeout(timer);
  };
}
