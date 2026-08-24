import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listChannels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("channels").collect();
  },
});

export const getChannelBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("channels")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getUserChannels = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("channelMemberships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const slugs = new Set(memberships.map((m) => m.channelSlug.toLowerCase()));

    // 1. Resolve user by ID / username / email
    let user: any = null;
    try {
      user = await ctx.db.get(args.userId as any);
    } catch {
      // not a direct doc ID
    }

    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.userId))
        .first();
    }

    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userId))
        .first();
    }

    if (!user) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(
        (u) =>
          u._id === args.userId ||
          u.username === args.userId ||
          u.email === args.userId
      );
    }

    const DISCIPLINE_MAP: Record<string, string> = {
      motion: "motion",
      "3d": "motion",
      spatial: "motion",
      animation: "motion",
      packaging: "packaging",
      branding: "packaging",
      kraft: "packaging",
      illustration: "illustration",
      "concept-art": "illustration",
      typography: "typography",
      editorial: "typography",
      industrial: "industrial",
      furniture: "industrial",
      architecture: "architecture",
      space: "architecture",
    };

    if (user && user.disciplines) {
      for (const d of user.disciplines) {
        const cleaned = d.replace("#", "").toLowerCase().trim();
        if (cleaned) {
          slugs.add(cleaned);
          if (DISCIPLINE_MAP[cleaned]) {
            slugs.add(DISCIPLINE_MAP[cleaned]);
          }
        }
      }
    }

    const allChannels = await ctx.db.query("channels").collect();
    let matched = allChannels.filter((c) => slugs.has(c.slug.toLowerCase()));

    if (matched.length === 0) {
      matched = allChannels.slice(0, 3);
    }

    return matched;
  },
});

export const joinChannel = mutation({
  args: {
    userId: v.string(),
    channelSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channelMemberships")
      .withIndex("by_pair", (q) =>
        q.eq("userId", args.userId).eq("channelSlug", args.channelSlug)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("channelMemberships", {
        userId: args.userId,
        channelSlug: args.channelSlug,
        joinedAt: Date.now(),
      });

      const channel = await ctx.db
        .query("channels")
        .withIndex("by_slug", (q) => q.eq("slug", args.channelSlug))
        .first();

      if (channel) {
        await ctx.db.patch(channel._id, {
          memberCount: channel.memberCount + 1,
        });
      }
    }
  },
});

export const leaveChannel = mutation({
  args: {
    userId: v.string(),
    channelSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channelMemberships")
      .withIndex("by_pair", (q) =>
        q.eq("userId", args.userId).eq("channelSlug", args.channelSlug)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);

      const channel = await ctx.db
        .query("channels")
        .withIndex("by_slug", (q) => q.eq("slug", args.channelSlug))
        .first();

      if (channel && channel.memberCount > 0) {
        await ctx.db.patch(channel._id, {
          memberCount: channel.memberCount - 1,
        });
      }
    }
  },
});

export const getChannelMessages = query({
  args: { channelSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelSlug", args.channelSlug))
      .order("asc")
      .collect();
  },
});

export const sendChannelMessage = mutation({
  args: {
    channelSlug: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    senderAvatar: v.string(),
    text: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("card"), v.literal("image"), v.literal("file")),
          url: v.optional(v.string()),
          name: v.optional(v.string()),
          cardId: v.optional(v.string()),
          cardTitle: v.optional(v.string()),
          cardCover: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      channelSlug: args.channelSlug,
      senderId: args.senderId,
      senderName: args.senderName,
      senderAvatar: args.senderAvatar,
      text: args.text,
      attachments: args.attachments || [],
      createdAt: Date.now(),
    });
  },
});

export const getDirectMessages = query({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const sendDirectMessage = mutation({
  args: {
    conversationId: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    senderAvatar: v.string(),
    receiverId: v.string(),
    text: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("card"), v.literal("image"), v.literal("file")),
          url: v.optional(v.string()),
          name: v.optional(v.string()),
          cardId: v.optional(v.string()),
          cardTitle: v.optional(v.string()),
          cardCover: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      senderName: args.senderName,
      senderAvatar: args.senderAvatar,
      receiverId: args.receiverId,
      text: args.text,
      attachments: args.attachments || [],
      createdAt: Date.now(),
    });
  },
});
