/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as channels from "../channels.js";
import type * as crits from "../crits.js";
import type * as follows from "../follows.js";
import type * as highlights from "../highlights.js";
import type * as output from "../output.js";
import type * as projects from "../projects.js";
import type * as recommendations from "../recommendations.js";
import type * as seed from "../seed.js";
import type * as stage1 from "../stage1.js";
import type * as stage2 from "../stage2.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  channels: typeof channels;
  crits: typeof crits;
  follows: typeof follows;
  highlights: typeof highlights;
  output: typeof output;
  projects: typeof projects;
  recommendations: typeof recommendations;
  seed: typeof seed;
  stage1: typeof stage1;
  stage2: typeof stage2;
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
