import { Notice, Screen, TabHeader } from "@/components/tabs/ui";

export default function You() {
  return (
    <Screen>
      <TabHeader title="You" />
      <Notice title="Your vibe is coming" body="This page will show a digest of you." />
    </Screen>
  );
}
