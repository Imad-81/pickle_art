import { v } from "convex/values";
import { query } from "./_generated/server";

export const getHomepageFeeds = query({
  args: {
    currentUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allProjects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("privacy"), "public"))
      .order("desc")
      .collect();

    // 1. In Progress
    const inProgress = allProjects.filter((p) => p.status === "in_progress");

    // 2. Complete Work
    const completeWork = allProjects.filter((p) => p.status === "complete");

    // 3. Spent Most Time On (sorted by timeSpentSeconds descending)
    const spentMostTimeOn = [...allProjects]
      .sort((a, b) => (b.stats.timeSpentSeconds || 0) - (a.stats.timeSpentSeconds || 0))
      .slice(0, 8);

    // 4. Following Feed
    let followingFeed: typeof allProjects = [];
    let uploadedByChannels: typeof allProjects = [];
    let recommendedForYou: typeof allProjects = [];

    if (args.currentUserId) {
      // Get followed users
      const follows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", args.currentUserId!))
        .collect();
      const followingIds = new Set(follows.map((f) => f.followingId));

      // Get user's channel memberships
      const memberships = await ctx.db
        .query("channelMemberships")
        .withIndex("by_user", (q) => q.eq("userId", args.currentUserId!))
        .collect();
      const userChannelSlugs = new Set(memberships.map((m) => m.channelSlug.toLowerCase()));

      // Filter projects from followed creators or matching user's channels
      followingFeed = allProjects.filter(
        (p) =>
          followingIds.has(p.creatorId) ||
          userChannelSlugs.has(p.discipline.toLowerCase())
      );

      // Uploaded by followed channels
      uploadedByChannels = allProjects.filter((p) =>
        userChannelSlugs.has(p.discipline.toLowerCase())
      );

      // Tag Affinity Recommendations:
      // Collect user's interaction tags from recent activity
      const interactions = await ctx.db
        .query("activityInteractions")
        .withIndex("by_user", (q) => q.eq("userId", args.currentUserId!))
        .take(50);

      const tagWeights: Record<string, number> = {};
      for (const inter of interactions) {
        const weight = inter.type === "dwell" ? inter.durationSeconds : 10;
        for (const tag of inter.tags) {
          tagWeights[tag.toLowerCase()] = (tagWeights[tag.toLowerCase()] || 0) + weight;
        }
      }

      // Rank projects by tag overlap
      recommendedForYou = [...allProjects]
        .map((p) => {
          let score = 0;
          for (const tag of p.tags) {
            score += tagWeights[tag.toLowerCase()] || 0;
          }
          return { project: p, score };
        })
        .sort((a, b) => b.score - a.score)
        .map((item) => item.project)
        .slice(0, 10);
    } else {
      recommendedForYou = allProjects.slice(0, 8);
    }

    return {
      followingFeed: followingFeed.length > 0 ? followingFeed : allProjects.slice(0, 6),
      inProgress,
      completeWork,
      spentMostTimeOn,
      uploadedByChannels: uploadedByChannels.length > 0 ? uploadedByChannels : allProjects.slice(0, 6),
      recommendedForYou,
    };
  },
});

export const searchExplore = query({
  args: {
    query: v.string(),
    selectedTag: v.optional(v.string()),
    selectedChannel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("privacy"), "public"))
      .order("desc")
      .collect();

    if (args.selectedTag) {
      const normalizedTag = args.selectedTag.toLowerCase().replace(/^#/, "");
      projects = projects.filter((p) =>
        p.tags.some((t) => t.toLowerCase().replace(/^#/, "") === normalizedTag)
      );
    }

    if (args.selectedChannel) {
      const normalizedChannel = args.selectedChannel.toLowerCase();
      projects = projects.filter(
        (p) => p.discipline.toLowerCase() === normalizedChannel
      );
    }

    if (args.query.trim()) {
      const q = args.query.toLowerCase().trim();
      projects = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.creatorName.toLowerCase().includes(q) ||
          p.discipline.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return projects;
  },
});

export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    const tagSet = new Set<string>();
    for (const p of projects) {
      for (const t of p.tags) {
        tagSet.add(t.startsWith("#") ? t : `#${t}`);
      }
    }
    return Array.from(tagSet);
  },
});
