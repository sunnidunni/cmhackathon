import { Asset } from "expo-asset";
import type { KeeperId } from "@/design/psst";
import manifest from "../../../demo-screenshots/manifest.json";

const uriOf = (source: number) => Asset.fromModule(source).uri;
const titleOf = (file: string) => manifest.find((m) => m.file === file)?.title ?? "";

// Fixture thumbnails for the reveal, used only when FIXTURES is on and a room has no real screenshot yet.
export const FIXTURE_SHOT: Record<KeeperId, { uri: string | null; title: string }> = {
  tock: { uri: uriOf(require("../../../demo-screenshots/png/01-pottery-flyer.png")), title: titleOf("png/01-pottery-flyer.png") },
  penny: { uri: uriOf(require("../../../demo-screenshots/png/17-refund.png")), title: titleOf("png/17-refund.png") },
  murmur: { uri: uriOf(require("../../../demo-screenshots/png/07-dinner-chat.png")), title: titleOf("png/07-dinner-chat.png") },
  mote: { uri: uriOf(require("../../../demo-screenshots/png/18-miso-pasta.png")), title: titleOf("png/18-miso-pasta.png") },
};
