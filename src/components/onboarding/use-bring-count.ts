import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { DEMO_COUNTS, FIXTURES } from "@/lib/fixtures";
import { getReadAllPhotos, listCandidates } from "@/lib/photos";
import { scanSize } from "@/lib/sync-plan";
import { bringInCount } from "./format";

// How many screenshots Bring in will read, from the phone's library and the plan's cap.
// null until both are known. A dev build with no screenshots on the device shows the demo count.
export function useBringCount() {
  const info = useQuery(api.sync.importInfo, {});
  const [found, setFound] = useState<number | null>(null);
  const limit = info?.limit;

  useEffect(() => {
    if (limit === undefined) return;
    let live = true;
    listCandidates(getReadAllPhotos(), scanSize(limit)).then(
      (assets) => live && setFound(assets.length),
      () => live && setFound(0),
    );
    return () => {
      live = false;
    };
  }, [limit]);

  if (limit === undefined || found === null) return { count: null, limit: null };
  const count = bringInCount(found, limit);
  return { count: count === 0 && FIXTURES ? DEMO_COUNTS.total : count, limit };
}
