import { askModelName, respond } from "./openai";

export type AlbumBrief = { name: string; description: string };
export type ShotBrief = { key: string; title: string; summary: string; text: string };

export const albumLine = (key: string, a: AlbumBrief) => `${key}: ${a.name}${a.description ? ` (${a.description})` : ""}`;

export function albumSortPrompt(album: AlbumBrief) {
  return `You sort a person's screenshots into one album they made. The album is "${album.name}"${album.description ? `, described as: ${album.description}` : ""}. You get a list of screenshots, each with a key, a title, a summary and some of its text. Return the keys of the screenshots that clearly belong in this album. Most screenshots do not: when unsure, leave it out. Return JSON only, matching the schema.`;
}

export function shotList(shots: ShotBrief[]) {
  return shots.map((s) => `${s.key}\nTitle: ${s.title}\nSummary: ${s.summary}\nText: ${s.text.slice(0, 300).replace(/\s+/g, " ")}`).join("\n\n");
}

// Keeps only keys that were asked about, once each.
export function parseMatches(raw: string, keys: string[]): string[] {
  const data = JSON.parse(raw) as { matches?: unknown };
  const list = Array.isArray(data.matches) ? data.matches : [];
  return keys.filter((k) => list.includes(k));
}

export async function matchAlbum(album: AlbumBrief, shots: ShotBrief[]): Promise<string[]> {
  const text = await respond({
    model: askModelName(),
    input: [
      { role: "system", content: albumSortPrompt(album) },
      { role: "user", content: shotList(shots) },
    ],
    schemaName: "album_matches",
    schema: { type: "object", additionalProperties: false, required: ["matches"], properties: { matches: { type: "array", items: { type: "string" } } } },
  });
  return parseMatches(text, shots.map((s) => s.key));
}
