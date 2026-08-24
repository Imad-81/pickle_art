import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getActiveHighlights = query({
  args: { currentUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const all = await ctx.db
      .query("highlights")
      .withIndex("by_expiresAt", (q) => q.gt("expiresAt", now))
      .collect();

    // Group by creator
    const grouped: Record<
      string,
      {
        creatorId: string;
        creatorName: string;
        creatorAvatar: string;
        hasUnseen: boolean;
        items: typeof all;
      }
    > = {};

    for (const h of all) {
      if (!grouped[h.creatorId]) {
        grouped[h.creatorId] = {
          creatorId: h.creatorId,
          creatorName: h.creatorName,
          creatorAvatar: h.creatorAvatar,
          hasUnseen: false,
          items: [],
        };
      }
      grouped[h.creatorId].items.push(h);
      if (args.currentUserId && !h.viewers.includes(args.currentUserId)) {
        grouped[h.creatorId].hasUnseen = true;
      }
    }

    return Object.values(grouped).sort((a, b) => {
      // Unseen first
      if (a.hasUnseen && !b.hasUnseen) return -1;
      if (!a.hasUnseen && b.hasUnseen) return 1;
      return 0;
    });
  },
});

export const getCreatorHighlights = query({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db
      .query("highlights")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();
  },
});

export const createHighlight = mutation({
  args: {
    creatorId: v.string(),
    creatorName: v.string(),
    creatorAvatar: v.string(),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
    caption: v.optional(v.string()),
    linkedProjectId: v.optional(v.string()),
    linkedProjectTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours from now

    return await ctx.db.insert("highlights", {
      creatorId: args.creatorId,
      creatorName: args.creatorName,
      creatorAvatar: args.creatorAvatar,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      caption: args.caption,
      linkedProjectId: args.linkedProjectId,
      linkedProjectTitle: args.linkedProjectTitle,
      expiresAt,
      viewers: [],
      createdAt: now,
    });
  },
});

export const markHighlightViewed = mutation({
  args: {
    highlightId: v.id("highlights"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const highlight = await ctx.db.get(args.highlightId);
    if (highlight && !highlight.viewers.includes(args.userId)) {
      await ctx.db.patch(args.highlightId, {
        viewers: [...highlight.viewers, args.userId],
      });
    }
  },
});

export const deleteHighlight = mutation({
  args: {
    highlightId: v.id("highlights"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.highlightId);
  },
});
