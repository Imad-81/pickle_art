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
