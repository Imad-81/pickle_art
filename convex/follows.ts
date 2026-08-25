import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const isFollowing = query({
  args: {
    followerId: v.string(),
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.followerId || !args.followingId || args.followerId === args.followingId) {
      return false;
    }
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .first();
    return !!follow;
  },
});

export const getFollowing = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    return follows.map((f) => f.followingId);
  },
});

export const getFollowers = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    return follows.map((f) => f.followerId);
  },
});

export const getFollowCounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    let baseFollowers = 0;
    let baseFollowing = 0;
    try {
      const user = await ctx.db.get(args.userId as any);
      if (user) {
        const points = (user as any).growthPoints || 120;
        baseFollowers = Math.max(Math.floor(points * 0.45) + 14, 18);
        baseFollowing = Math.max(Math.floor(points * 0.22) + 6, 8);
      }
    } catch (_) {}

    return {
      followingCount: following.length + baseFollowing,
      followersCount: followers.length + baseFollowers,
    };
  },
});

export const toggleFollow = mutation({
  args: {
    followerId: v.string(),
    followingId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.followingId) return false;

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false; // unfollowed
    } else {
      await ctx.db.insert("follows", {
        followerId: args.followerId,
        followingId: args.followingId,
        createdAt: Date.now(),
      });
      return true; // followed
    }
  },
});
