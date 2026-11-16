import { useQueries } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { DEMO_SHOTS, FIXTURES } from "@/lib/fixtures";
import { detect, detectFirst, type DetectInput } from "./detect";
import { useOffline } from "@/lib/offline";
import { useSafeQuery } from "@/lib/useSafeQuery";
import { useActState } from "./store";
import type { ActScenario } from "./types";

type Detail = NonNullable<FunctionReturnType<typeof api.shots.detail>>;

const MAX_ACTS = 1;
const LOOKBACK = 8;

const seen = new Map<string, ActScenario>();

function demoInputs(): DetectInput[] {
  return [...DEMO_SHOTS]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((s) => ({
      id: s.id,
      title: s.title,
      summary: s.summary,
      text: s.text,
      room: s.room,
      dates: s.dates,
      savedAt: s.savedAt,
      image: s.image,
    }));
}

function firstActs(inputs: DetectInput[], skip: ReadonlySet<string>) {
  const acts = detectFirst(inputs, skip, MAX_ACTS);
  acts.forEach((act) => seen.set(act.id, act));
  return acts;
}

export function getDetectedAct(id: string): ActScenario | null {
  const hit = seen.get(id);
  if (hit) return hit;
  if (!FIXTURES) return null;
  for (const input of demoInputs()) {
    const act = detect(input);
    if (act) seen.set(act.id, act);
  }
  return seen.get(id) ?? null;
}

export function useDetectedActs(): ActScenario[] {
  const offline = useOffline();
  const rooms = useSafeQuery(api.rooms.all, {}, undefined);
  const recent = useMemo(
    () =>
      (rooms?.items ?? [])
        .filter((item) => item.category !== "ideas" && item.category !== "unsorted")
        .slice(0, LOOKBACK),
    [rooms],
  );
  const requests = useMemo(
    () => Object.fromEntries(recent.map((item) => [item._id, { query: api.shots.detail, args: { id: item._id as Id<"screenshots"> } }])),
    [recent],
  );
  const details = useQueries(requests);
  const { dismissed, completed } = useActState();
  const useDemo = (FIXTURES || offline) && (rooms === undefined || rooms.count === 0);

  return useMemo(() => {
    const skip = new Set([...dismissed, ...completed]);
    if (useDemo) return firstActs(demoInputs(), skip);
    const inputs: DetectInput[] = [];
    for (const item of recent) {
      const shot = details[item._id] as Detail | Error | null | undefined;
      if (!shot || shot instanceof Error || shot.status !== "ready") continue;
      inputs.push({
        id: shot._id,
        title: shot.title,
        summary: shot.summary,
        room: shot.category,
        dates: shot.dates.map((d) => ({ when: d.when, what: d.what, confident: d.confident })),
        savedAt: shot.takenAt,
        amount: shot.amount,
        image: shot.imageUrl,
      });
    }
    return firstActs(inputs, skip);
  }, [useDemo, recent, details, dismissed, completed]);
}
