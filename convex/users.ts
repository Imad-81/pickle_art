import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const syncUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    username: v.string(),
    avatarUrl: v.string(),
    bio: v.optional(v.string()),
    disciplines: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        avatarUrl: args.avatarUrl || existing.avatarUrl,
        bio: args.bio !== undefined ? args.bio : existing.bio,
        disciplines: args.disciplines || existing.disciplines,
      });
      return existing._id;
    }

    // Ensure unique username
    let finalUsername = args.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!finalUsername) finalUsername = `creator_${Date.now().toString().slice(-4)}`;

    const userWithSameUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", finalUsername))
      .first();

    if (userWithSameUsername) {
      finalUsername = `${finalUsername}_${Date.now().toString().slice(-3)}`;
    }

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      username: finalUsername,
      avatarUrl: args.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${finalUsername}`,
      bio: args.bio || "Exploring craft & process.",
      disciplines: args.disciplines || ["#illustration", "#packaging"],
      growthPoints: 50,
      createdAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    disciplines: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, updates);
    return true;
  },
});

export const addGrowthPoints = mutation({
  args: {
    userId: v.id("users"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        growthPoints: (user.growthPoints || 0) + args.points,
      });
    }
  },
});

export const completeOnboarding = mutation({
  args: {
    userId: v.string(), // can be user doc ID or email or username
    name: v.string(),
    username: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    disciplines: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let targetUser: any = null;
    try {
      targetUser = await ctx.db.get(args.userId as any);
    } catch {}

    if (!targetUser) {
      targetUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.userId))
        .first();
    }
    if (!targetUser) {
      targetUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.userId))
        .first();
    }

    if (!targetUser) {
      // Create user if not exists
      const newId = await ctx.db.insert("users", {
        email: args.userId.includes("@") ? args.userId : `${args.username}@pickle.art`,
        name: args.name,
        username: args.username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        avatarUrl: args.avatarUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${args.username}`,
        bio: args.bio || "Exploring creative craft & process.",
        disciplines: args.disciplines,
        growthPoints: 100, // Onboarding bonus points!
        createdAt: Date.now(),
      });
      targetUser = await ctx.db.get(newId);
    } else {
      await ctx.db.patch(targetUser._id, {
        name: args.name,
        username: args.username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: args.bio !== undefined ? args.bio : targetUser.bio,
        avatarUrl: args.avatarUrl || targetUser.avatarUrl,
        disciplines: args.disciplines,
        growthPoints: Math.max(targetUser.growthPoints || 0, 100),
      });
    }

    // Auto-join corresponding discipline channels
    const DISCIPLINE_TO_SLUG: Record<string, string> = {
      packaging: "packaging",
      illustration: "illustration",
      typography: "typography",
      industrial: "industrial",
      motion: "motion",
      architecture: "architecture",
      branding: "packaging",
      kraft: "packaging",
      concept: "illustration",
      "concept-art": "illustration",
      furniture: "industrial",
      "3d": "motion",
      spatial: "architecture",
    };

    const targetUserIdStr = targetUser._id.toString();
    for (const d of args.disciplines) {
      const clean = d.replace(/^#/, "").toLowerCase().trim();
      const slug = DISCIPLINE_TO_SLUG[clean] || clean;

      const channel = await ctx.db
        .query("channels")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (channel) {
        const existingMembership = await ctx.db
          .query("channelMemberships")
          .withIndex("by_pair", (q) =>
            q.eq("userId", targetUserIdStr).eq("channelSlug", slug)
          )
          .first();

        if (!existingMembership) {
          await ctx.db.insert("channelMemberships", {
            userId: targetUserIdStr,
            channelSlug: slug,
            joinedAt: Date.now(),
          });
          await ctx.db.patch(channel._id, {
            memberCount: channel.memberCount + 1,
          });
        }
      }
    }

    return targetUser;
  },
});
