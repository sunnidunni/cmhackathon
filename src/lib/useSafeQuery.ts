import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";
import { isOffline, useOffline } from "./offline";

// While Convex is unreachable the query is skipped and the fixture is returned instead.
export function useSafeQuery<Q extends FunctionReference<"query">>(
  ref: Q,
  args: Q["_args"] | "skip",
  fixture: FunctionReturnType<Q> | undefined,
): FunctionReturnType<Q> | undefined {
  const offline = useOffline();
  const live = useQuery(ref, ...([offline ? "skip" : args] as never));
  return offline ? fixture : live;
}

// A mutation that quietly does nothing while Convex is unreachable.
export function useSafeMutation<M extends FunctionReference<"mutation">>(ref: M) {
  const run = useMutation(ref);
  return useCallback((...args: OptionalRestArgs<M>): Promise<FunctionReturnType<M> | null> => (isOffline() ? Promise.resolve(null) : run(...args)), [run]);
}
