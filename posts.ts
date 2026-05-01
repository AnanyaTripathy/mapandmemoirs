import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("posts"),
      _creationTime: v.number(),
      text: v.string(),
      emoji: v.optional(v.string()),
      lat: v.number(),
      lng: v.number(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("posts").order("desc").take(500);
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    emoji: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      text: args.text,
      emoji: args.emoji,
      lat: args.lat,
      lng: args.lng,
    });
  },
});
