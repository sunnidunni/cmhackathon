import { Component, type ReactNode } from "react";
import { MessageView } from "@/components/state-views";
import { isOffline, SAMPLE_DATA_WHEN_OFFLINE, setOffline } from "@/lib/offline";

type State = { failed: boolean; stuck: boolean };

// A failed Convex query throws while rendering.
// Demo builds catch it, go offline, and render again so the screens use sample data.
// Every other build shows a plain message with a retry, and so does a demo build that still throws once offline.
export class OfflineBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, stuck: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    if (!SAMPLE_DATA_WHEN_OFFLINE || isOffline()) return this.setState({ stuck: true });
    setOffline(error.message);
    this.setState({ failed: false });
  }

  render() {
    if (this.state.stuck) return <MessageView title="Something went wrong." actionLabel="Try again" onAction={() => this.setState({ failed: false, stuck: false })} />;
    return this.state.failed ? null : this.props.children;
  }
}
