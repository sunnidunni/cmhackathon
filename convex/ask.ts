import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

export type Source = {
  screenshotId: Id<"screenshots">;
  title: string | null;
  imageUrl: string | null;
};

export const NOT_FOUND_ANSWER = "I couldn't find that in your screenshots.";

export const ask = action({
  args: { question: v.string() },
  handler: async (
    _ctx,
    _args,
  ): Promise<{ questionId: Id<"questions">; answer: string; found: boolean; sources: Source[] }> => {
    throw new Error("ask is not implemented yet");
  },
});

export const history = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    {
      _id: Id<"questions">;
      question: string;
      answer: string;
      found: boolean;
      createdAt: number;
      sources: Source[];
    }[]
  > => {
    await requireUserId(ctx);
    return [];
  },
});
