import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";

// An anonymous user has no way to sign back in: the session kept in the phone's keychain is the account.
// Convex Auth ends a session 30 days after sign-in, and after 30 days without use, unless told otherwise.
// Either one would silently hand the phone a new, empty user and strand the library and any paid plan,
// so both limits are set far out. A session created before this change keeps the end date it was given.
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Anonymous],
  session: { totalDurationMs: TEN_YEARS_MS, inactiveDurationMs: TEN_YEARS_MS },
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      if (existingUserId) return;
      await ctx.db.patch(userId, { plan: "free", createdAt: Date.now() });
    },
  },
});
