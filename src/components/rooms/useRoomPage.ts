import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Category } from "@/components/rooms/format";
import { useOffline } from "@/lib/offline";

// How many screenshots a grid loads at a time.
export const ROOM_PAGE = 60;
// How many of the newest screenshots the "recent" views ask for: recently filed, new today, things to act on.
// One number everywhere, so those screens share a single subscription.
export const RECENT_SHOTS = 40;

// Ready screenshots, newest first, a page at a time: the whole library, or one room.
// items is undefined until the first page arrives. Offline (demo builds only) there is no server, so it is empty.
export function useRoomPage(category?: Category) {
  const offline = useOffline();
  const { results, status, loadMore } = usePaginatedQuery(api.rooms.page, offline ? "skip" : category ? { category } : {}, { initialNumItems: ROOM_PAGE });
  return {
    items: offline ? [] : status === "LoadingFirstPage" ? undefined : results,
    loadingMore: status === "LoadingMore",
    loadMore: () => {
      if (status === "CanLoadMore") loadMore(ROOM_PAGE);
    },
  };
}
