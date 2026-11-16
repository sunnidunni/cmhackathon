import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { getAutoRead, setAutoRead } from "./auto-read";

// "Delete everything", for Settings and the privacy screen. Resolves true once the server has deleted it all, false when it could not.
// Automatic reading goes off first, so a sync that starts meanwhile can't bring the same screenshots straight back in.
// It stays off after a delete; after a failed one it goes back to what the person had chosen.
export function useDeleteEverything(): () => Promise<boolean> {
  const removeAll = useMutation(api.shots.removeAll);
  return useCallback(async () => {
    const before = await getAutoRead();
    await setAutoRead(false);
    try {
      await removeAll({});
      return true;
    } catch {
      await setAutoRead(before);
      return false;
    }
  }, [removeAll]);
}
