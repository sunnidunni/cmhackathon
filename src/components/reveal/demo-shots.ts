import { Asset } from "expo-asset";
import type { KeeperId } from "@/design/psst";
import { DEMO_TODAY } from "@/lib/fixtures";
import manifest from "../../../demo-screenshots/manifest.json";

const uriOf = (source: number) => Asset.fromModule(source).uri;
const titleOf = (file: string) => manifest.find((m) => m.file === file)?.title ?? "";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (when: string) => `${MONTHS[Number(when.slice(5, 7)) - 1]} ${Number(when.slice(8, 10))}`;

const BILL = require("../../../demo-screenshots/png/15-utility-bill.png") as number;
const REFUND = require("../../../demo-screenshots/png/17-refund.png") as number;

// Fixture thumbnails for the reveal, used only when FIXTURES is on and a room has no real screenshot yet.
export const FIXTURE_SHOT: Record<KeeperId, { uri: string | null; title: string }> = {
  tock: { uri: uriOf(require("../../../demo-screenshots/png/01-pottery-flyer.png")), title: titleOf("png/01-pottery-flyer.png") },
  penny: { uri: uriOf(BILL), title: titleOf("png/15-utility-bill.png") },
  murmur: { uri: uriOf(require("../../../demo-screenshots/png/07-dinner-chat.png")), title: titleOf("png/07-dinner-chat.png") },
  mote: { uri: uriOf(require("../../../demo-screenshots/png/18-miso-pasta.png")), title: titleOf("png/18-miso-pasta.png") },
};

// The reveal's "you forgot" fact, taken from the manifest: the money item with the nearest due date still ahead,
// else the completed refund. There is no backend field for this yet (see Backend asks in the PR).
export function foundFact(): { headline: string; detail: string; line: string | null; uri: string | null; title: string } {
  const bills = manifest
    .filter((m) => m.room === "money")
    .flatMap((m) => m.dates.filter((d) => d.confident && d.what.endsWith("bill due") && d.when.slice(0, 10) >= DEMO_TODAY).map((d) => ({ m, d })))
    .sort((a, b) => a.d.when.localeCompare(b.d.when));
  const bill = bills[0];
  if (bill) {
    const amount = /Amount due (\$\d[\d,]*(?:\.\d{2})?)/.exec(bill.m.text)?.[1];
    const merchant = bill.d.what.replace(/ bill due$/, "");
    return {
      headline: `Penny Pocket found a bill due ${shortDate(bill.d.when)}.`,
      detail: `${amount ? `${amount} at ` : ""}${merchant} · From the bill.`,
      line: /Autopay is off/.test(bill.m.text) ? "Autopay is off." : null,
      uri: uriOf(BILL),
      title: bill.m.title,
    };
  }
  const refund = manifest.find((m) => m.file === "png/17-refund.png");
  return {
    headline: "Penny Pocket found a $38 refund from Cloudstep, completed Nov 15.",
    detail: "From the screenshot.",
    line: null,
    uri: uriOf(REFUND),
    title: refund?.title ?? "Refund complete",
  };
}
