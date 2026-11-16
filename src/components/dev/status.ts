const NONE = "unavailable";

export function progressLine(p: { uploaded: number; read: number; pending: number; failed: number; total: number } | undefined): string {
  if (!p) return NONE;
  return `uploaded ${p.uploaded} · read ${p.read} · pending ${p.pending} · failed ${p.failed} · total ${p.total}`;
}

export function planLine(info: { plan: string; limit: number | null } | undefined): string {
  if (!info) return NONE;
  return `${info.plan}, ${info.limit === null ? "no import limit" : `import limit ${info.limit}`}`;
}

export function connectionLine({ socket, loading, authenticated }: { socket: boolean; loading: boolean; authenticated: boolean }): string {
  const link = socket ? "connected" : "not connected";
  if (authenticated) return `${link}, signed in`;
  return `${link}, ${loading ? "signing in" : "not signed in"}`;
}

export function buildLine({ name, version, debug, devTools }: { name: string | undefined; version: string | undefined; debug: boolean; devTools: string | undefined }): string {
  const app = name ? `${name} ${version ?? ""}`.trim() : NONE;
  return `${app} · ${debug ? "debug" : "release"} · EXPO_PUBLIC_DEV_TOOLS ${devTools ?? "unset"}`;
}
