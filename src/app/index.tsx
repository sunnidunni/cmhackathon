import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { LoadingView } from "@/components/state-views";
import { getPhotoAccess, type PhotoAccess } from "@/lib/photos";

export default function Index() {
  const [access, setAccess] = useState<PhotoAccess | null>(null);
  useEffect(() => {
    getPhotoAccess().then(setAccess, () => setAccess("undetermined"));
  }, []);

  if (access === null) return <LoadingView label="Loading…" />;
  return <Redirect href={access === "all" || access === "limited" ? "/library" : "/priming"} />;
}
