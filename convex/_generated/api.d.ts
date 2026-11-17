/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as albums from "../albums.js";
import type * as ask from "../ask.js";
import type * as askData from "../askData.js";
import type * as auth from "../auth.js";
import type * as extract from "../extract.js";
import type * as http from "../http.js";
import type * as lib_albumModel from "../lib/albumModel.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_cards from "../lib/cards.js";
import type * as lib_extraction from "../lib/extraction.js";
import type * as lib_handful from "../lib/handful.js";
import type * as lib_headline from "../lib/headline.js";
import type * as lib_importPlan from "../lib/importPlan.js";
import type * as lib_lines from "../lib/lines.js";
import type * as lib_llm from "../lib/llm.js";
import type * as lib_memoryClient from "../lib/memoryClient.js";
import type * as lib_memoryDocs from "../lib/memoryDocs.js";
import type * as lib_notificationText from "../lib/notificationText.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_plan from "../lib/plan.js";
import type * as lib_queue from "../lib/queue.js";
import type * as lib_suggestions from "../lib/suggestions.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_titles from "../lib/titles.js";
import type * as lib_whop_signature from "../lib/whop_signature.js";
import type * as memory from "../memory.js";
import type * as notes from "../notes.js";
import type * as plan from "../plan.js";
import type * as reminders from "../reminders.js";
import type * as rooms from "../rooms.js";
import type * as screenshots from "../screenshots.js";
import type * as shots from "../shots.js";
import type * as siri from "../siri.js";
import type * as sync from "../sync.js";
import type * as today from "../today.js";
import type * as todos from "../todos.js";
import type * as todosBackfill from "../todosBackfill.js";
import type * as users from "../users.js";
import type * as whop from "../whop.js";
import type * as you from "../you.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  albums: typeof albums;
  ask: typeof ask;
  askData: typeof askData;
  auth: typeof auth;
  extract: typeof extract;
  http: typeof http;
  "lib/albumModel": typeof lib_albumModel;
  "lib/auth": typeof lib_auth;
  "lib/cards": typeof lib_cards;
  "lib/extraction": typeof lib_extraction;
  "lib/handful": typeof lib_handful;
  "lib/headline": typeof lib_headline;
  "lib/importPlan": typeof lib_importPlan;
  "lib/lines": typeof lib_lines;
  "lib/llm": typeof lib_llm;
  "lib/memoryClient": typeof lib_memoryClient;
  "lib/memoryDocs": typeof lib_memoryDocs;
  "lib/notificationText": typeof lib_notificationText;
  "lib/openai": typeof lib_openai;
  "lib/plan": typeof lib_plan;
  "lib/queue": typeof lib_queue;
  "lib/suggestions": typeof lib_suggestions;
  "lib/time": typeof lib_time;
  "lib/titles": typeof lib_titles;
  "lib/whop_signature": typeof lib_whop_signature;
  memory: typeof memory;
  notes: typeof notes;
  plan: typeof plan;
  reminders: typeof reminders;
  rooms: typeof rooms;
  screenshots: typeof screenshots;
  shots: typeof shots;
  siri: typeof siri;
  sync: typeof sync;
  today: typeof today;
  todos: typeof todos;
  todosBackfill: typeof todosBackfill;
  users: typeof users;
  whop: typeof whop;
  you: typeof you;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
