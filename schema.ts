import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    text: v.string(),
    emoji: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
  }).index("by_location", ["lat", "lng"]),
});
