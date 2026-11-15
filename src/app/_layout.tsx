import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { LoadingView, MessageView } from "@/components/state-views";
import { convex } from "@/lib/convex";
import { DEV_TOOLS } from "@/lib/dev-flags";
import { secureStorage, storageError } from "@/lib/secure-storage";

const SIGN_IN_TIMEOUT_MS = 20000;

// No sign-up: the first launch silently creates an anonymous Convex Auth user and the
// session token is kept in the keychain, so every later launch is the same user.
function AnonymousSession({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    signIn("anonymous").catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [isLoading, isAuthenticated, signIn, attempt]);

  useEffect(() => {
    if (isAuthenticated || error) return;
    const timer = setTimeout(() => setError("Timed out while signing in"), SIGN_IN_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, error, attempt]);

  if (isAuthenticated) return <>{children}</>;
  if (error)
    return (
      <MessageView
        title="Couldn't connect"
        body={
          DEV_TOOLS
            ? `${error} (loading: ${isLoading}, keychain: ${storageError ?? "ok"})`
            : "Check your connection and try again."
        }
        actionLabel="Try again"
        onAction={() => {
          setError(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  return <LoadingView label="Getting things ready…" />;
}

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <AnonymousSession>
        <Stack screenOptions={{ headerShown: false }} />
      </AnonymousSession>
    </ConvexAuthProvider>
  );
}
