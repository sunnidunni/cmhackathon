// Convex document ids are 32 lowercase letters and digits. Fixture ids ("01-pottery-flyer", "demo-01") never match, so a
// shots.detail query is only started for ids the server can validate.
// Room-grid fixtures link to "demo-01"; the manifest shot behind it is the one whose id starts "01-".
export const demoShotPrefix = (id: string | undefined): string | null => (id === undefined ? null : (/^demo-(\d{2})$/.exec(id)?.[1] ?? null));

export const isConvexId = (id: string | undefined): id is string => id !== undefined && /^[0-9a-z]{25,40}$/.test(id);
