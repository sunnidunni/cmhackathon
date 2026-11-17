import { Supermemory } from "supermemory";

export type MemoryHit = { text: string; screenshotId: string | null; kind: string | null };

// One namespace per user: exactly the Convex user id. Screenshot memories and chat turns share it.
const client = () => new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY });

export async function addMemory(
  userId: string,
  doc: { id: string; content: string; metadata: Record<string, string | number | boolean> },
) {
  await client().add(userId, { ...doc, dreaming: "instant" });
}

// Already gone counts as removed.
const unlessMissing = (e: unknown) => {
  if ((e as { statusCode?: number } | null)?.statusCode !== 404) throw e;
};

// The API's limit on ids per call is not documented, so send them in modest groups.
const DELETE_GROUP = 100;

export async function removeDocuments(userId: string, ids: string[]) {
  for (let i = 0; i < ids.length; i += DELETE_GROUP) {
    await client().documents.delete(userId, { ids: ids.slice(i, i + DELETE_GROUP) }).catch(unlessMissing);
  }
}

// Everything Shots stored for this user: every screenshot's reading and every chat turn.
export async function removeNamespace(userId: string) {
  await client().namespaces.delete(userId).catch(unlessMissing);
}

export async function searchMemory(userId: string, query: string): Promise<MemoryHit[]> {
  const res = await client().search(userId, { query, limit: 8 });
  return res.results.map((r) => {
    const item = r as unknown as {
      memory?: string;
      chunk?: string;
      metadata?: Record<string, unknown> | null;
    };
    const metadata = item.metadata ?? {};
    return {
      text: item.memory ?? item.chunk ?? "",
      screenshotId: typeof metadata.screenshotId === "string" ? metadata.screenshotId : null,
      kind: typeof metadata.kind === "string" ? metadata.kind : null,
    };
  }).filter((h) => h.text !== "");
}
