import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { secureStorage } from "@/lib/secure-storage";
import { LoadingView, MessageView } from "@/components/state-views";

// No sign-up: the first launch silently creates an anonymous Convex Auth user and the
// session token is kept in the keychain, so every later launch is the same user.
function AnonymousSession({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    signIn("anonymous").catch((e: unknown) => setError(String(e)));
  }, [isLoading, isAuthenticated, signIn, attempt]);

  if (isAuthenticated) return <>{children}</>;
  if (error)
    return (
      <MessageView
        title="Couldn't connect"
        body="Check your connection and try again."
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
