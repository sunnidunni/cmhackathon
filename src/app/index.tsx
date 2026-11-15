import { Redirect } from "expo-router";
import { LoadingView } from "@/components/state-views";
import { hasPhotoAccess, usePhotoAccess } from "@/lib/photos";
import { useImportStarted } from "@/lib/sync";

export default function Entry() {
  const { access } = usePhotoAccess();
  const { started } = useImportStarted();
  if (access === null || started === null) return <LoadingView label="Loading…" />;
  if (started) return <Redirect href="/today" />;
  if (hasPhotoAccess(access)) return <Redirect href="/bring" />;
  return <Redirect href="/priming" />;
}
