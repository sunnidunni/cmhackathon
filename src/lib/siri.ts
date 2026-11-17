// Where a Siri Shortcut posts its question: the deployment's HTTP address, which differs from the address the app's
// own client uses. A cloud deployment serves HTTP at the same name under convex.site; a local one, one port up.
// EXPO_PUBLIC_CONVEX_SITE_URL names it outright when it is set (convex dev writes it for local work).
export function siriAddress(convexUrl: string | undefined, siteUrl?: string): string | null {
  const base = siteUrl?.trim() || deriveSiteUrl(convexUrl);
  return base ? `${base.replace(/\/+$/, "")}/siri/ask` : null;
}

function deriveSiteUrl(convexUrl: string | undefined): string | null {
  if (!convexUrl) return null;
  const cloud = /^(https:\/\/[^/]+)\.convex\.cloud\/?$/.exec(convexUrl.trim());
  if (cloud) return `${cloud[1]}.convex.site`;
  const local = /^(https?:\/\/(?:127\.0\.0\.1|localhost)):(\d+)\/?$/.exec(convexUrl.trim());
  if (local) return `${local[1]}:${Number(local[2]) + 1}`;
  return null;
}

// An iCloud link to a ready-made "Ask Shots" Shortcut, when the team has published one. Without it the
// screen gives the steps to build the Shortcut by hand.
export const SIRI_SHORTCUT_URL = process.env.EXPO_PUBLIC_SIRI_SHORTCUT_URL || null;
