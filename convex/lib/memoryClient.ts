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
