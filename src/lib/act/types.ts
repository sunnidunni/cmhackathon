import type { KeeperId } from "@/design/psst";

export type ActStep =
  | { kind: "draft-message"; to: string; via: "Messages"; body: string; reply?: string }
  | { kind: "order"; merchant: string; items: { name: string; price: string }[]; deliverTo: string; total: string; eta: string }
  | { kind: "move-reminder"; from: string; to: string; label?: string }
  | { kind: "set-reminder"; when: string; label?: string }
  | { kind: "email-draft"; to: string; subject: string; body: string }
  | { kind: "calendar"; title: string; when: string; where?: string; leaveBy?: string };

export type ActScenario = {
  id: string;
  keeper: KeeperId;
  source: { shotId?: string; image: number | string | null; title: string; at?: string };
  noticed: string;
  why: string;
  didOnOwn?: string;
  ready: string;
  cta: string;
  steps: ActStep[];
  confirm: { title: string; lines: string[]; price?: string; button: string };
  done: string;
  doneFixture?: string;
};
