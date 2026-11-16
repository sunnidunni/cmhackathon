import fs from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { Supermemory } from "supermemory";
import { api } from "./convex/_generated/api";
const url = fs.readFileSync(".env", "utf8").match(/EXPO_PUBLIC_CONVEX_URL=(\S+)/)![1];
const dir = process.env.HOME + "/.capy/drive/captain-cap/handoffs/content/demo-screenshots/";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function client() {
  const c = new ConvexHttpClient(url);
  const res: any = await c.action(api.auth.signIn, { provider: "anonymous", params: {} });
  c.setAuth(res.tokens.token);
  return c;
}
async function upload(c: ConvexHttpClient, file: string) {
  const u = await c.mutation(api.screenshots.generateUploadUrl, {});
  const up = await fetch(u, { method: "POST", headers: { "Content-Type": "image/png" }, body: fs.readFileSync(dir + file) });
  const { storageId } = await up.json();
  return await c.mutation(api.screenshots.create, { deviceAssetId: file + Date.now(), storageId, takenAt: Date.now() });
}
async function ready(c: ConvexHttpClient, id: string) {
  for (let i = 0; i < 40; i++) {
    await sleep(3000);
    const row: any = (await c.query(api.screenshots.list, {})).find((r: any) => r._id === id);
    if (row.status === "ready" || row.status === "failed") return row;
  }
  throw new Error("timeout");
}
const mode = process.argv[2];
if (mode === "answers") {
  const cases: [string, string][] = [
    ["flyer_tomorrow.png", "When is that due?"], ["flyer_3days.png", "When is that due?"],
    ["bill.png", "When is that due?"], ["appointment.png", "When is that?"],
    ["chat.png", "When is that happening?"], ["chat_plans.png", "When is that happening?"],
  ];
  for (const [file, q] of cases) {
    const c = await client();
    const id = await upload(c, file);
    const row = await ready(c, id);
    const a = await c.action(api.ask.ask, { question: q });
    console.log(file, "|", row.status, "|", q, "=>", a.answer, "| found", a.found);
  }
}
if (mode === "checks") {
  const c = await client();
  const me: any = await c.query(api.users.me, {});
  const bill = await upload(c, "bill.png");
  const flyer = await upload(c, "flyer_tomorrow.png");
  await ready(c, bill); await ready(c, flyer);
  await sleep(5000);
  // 1: real scheduler. tz 0 makes 2026-11-16 "today", so a date-only bill is due in about a minute.
  const set = await c.mutation(api.reminders.set, { screenshotId: bill as any, tzOffsetMinutes: 0 });
  console.log("1 set:", JSON.stringify(set), "in", Math.round((set.dueAt - Date.now()) / 1000), "s");
  let d: any = await c.query(api.shots.detail, { id: bill as any });
  console.log("1 before:", JSON.stringify(d.dates.map((x: any) => x.reminder)));
  await sleep(Math.max(0, set.dueAt - Date.now()) + 8000);
  d = await c.query(api.shots.detail, { id: bill as any });
  console.log("1 after:", JSON.stringify(d.dates.map((x: any) => x.reminder?.state)));
  let t: any = await c.query(api.today.get, { tzOffsetMinutes: 480 });
  console.log("1 missed:", t.missed.map((x: any) => x.title));
  // 2: fireNow on the flyer
  const f = await c.mutation(api.reminders.fireNow, { screenshotId: flyer as any, tzOffsetMinutes: 480 });
  console.log("2 fireNow:", JSON.stringify(f));
  t = await c.query(api.today.get, { tzOffsetMinutes: 480 });
  console.log("2 missed after fireNow:", t.missed.map((x: any) => x.title));
  await c.mutation(api.shots.markOpened, { id: flyer as any });
  t = await c.query(api.today.get, { tzOffsetMinutes: 480 });
  console.log("2 missed after opening flyer:", t.missed.map((x: any) => x.title));
  // 3: today.get after appOpened
  await c.mutation(api.today.appOpened, { tzOffsetMinutes: 480 });
  t = await c.query(api.today.get, { tzOffsetMinutes: 480 });
  console.log("3 today:", JSON.stringify({ day: t.day, justIn: t.justIn.map((x: any) => x.title), missed: t.missed.map((x: any) => x.title), handful: t.handful.map((x: any) => [x.title, x.actions.primary]), thin: t.thin?.title ?? null, cleared: t.cleared, reading: t.reading }));
  const rooms: any = await c.query(api.rooms.list, {});
  console.log("3 rooms:", JSON.stringify(rooms.map((r: any) => [r.category, r.count, r.newest?.title ?? null])));
  // 4: delete removes the Supermemory memory
  const sm = new Supermemory({ apiKey: process.env.SUPERMEMORY_API_KEY });
  const has = async () => { try { await sm.documents.get(me._id, bill as any); return true; } catch { return false; } };
  console.log("4 memory before delete:", await has());
  await c.mutation(api.shots.remove, { id: bill as any });
  await sleep(6000);
  console.log("4 memory after delete:", await has(), "| row gone:", (await c.query(api.shots.detail, { id: bill as any })) === null);
}
