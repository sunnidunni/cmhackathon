/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as extract from "../extract.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_extraction from "../lib/extraction.js";
import type * as lib_importPlan from "../lib/importPlan.js";
import type * as lib_lines from "../lib/lines.js";
import type * as lib_plan from "../lib/plan.js";
import type * as memory from "../memory.js";
import type * as screenshots from "../screenshots.js";
import type * as sync from "../sync.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  extract: typeof extract;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/extraction": typeof lib_extraction;
  "lib/importPlan": typeof lib_importPlan;
  "lib/lines": typeof lib_lines;
  "lib/plan": typeof lib_plan;
  memory: typeof memory;
  screenshots: typeof screenshots;
  sync: typeof sync;
  users: typeof users;
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
