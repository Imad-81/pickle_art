import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCritsByStage = query({
  args: {
    projectId: v.string(),
    stage: v.union(v.literal("stage1"), v.literal("stage2"), v.literal("output")),
    subcardId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let crits = await ctx.db
      .query("crits")
      .withIndex("by_project_stage", (q) =>
        q.eq("projectId", args.projectId).eq("targetStage", args.stage)
      )
      .collect();

    if (args.subcardId) {
      crits = crits.filter((c) => c.targetSubcardId === args.subcardId);
    }

    return crits.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

export const addCrit = mutation({
  args: {
    projectId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorUsername: v.string(),
    authorAvatar: v.string(),
    targetStage: v.union(v.literal("stage1"), v.literal("stage2"), v.literal("output")),
    targetSubcardId: v.optional(v.string()),
    whatWorked: v.string(),
    whatToTryNext: v.string(),
    content: v.optional(v.string()),
    skillReactions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const critId = await ctx.db.insert("crits", {
      projectId: args.projectId,
      authorId: args.authorId,
      authorName: args.authorName,
      authorUsername: args.authorUsername,
      authorAvatar: args.authorAvatar,
      targetStage: args.targetStage,
      targetSubcardId: args.targetSubcardId,
      whatWorked: args.whatWorked,
      whatToTryNext: args.whatToTryNext,
      content: args.content,
      skillReactions: args.skillReactions,
      isPinned: false,
      createdAt: Date.now(),
    });

    // Update project critsCount
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("_id"), args.projectId as any))
      .first();

    if (project) {
      await ctx.db.patch(project._id, {
        stats: {
          ...project.stats,
          critsCount: project.stats.critsCount + 1,
        },
      });
    }

    return critId;
  },
});

export const togglePinCrit = mutation({
  args: { critId: v.id("crits") },
  handler: async (ctx, args) => {
    const crit = await ctx.db.get(args.critId);
    if (crit) {
      await ctx.db.patch(args.critId, { isPinned: !crit.isPinned });
    }
  },
});

export const toggleSkillReaction = mutation({
  args: {
    critId: v.id("crits"),
    skillBadge: v.string(),
  },
  handler: async (ctx, args) => {
    const crit = await ctx.db.get(args.critId);
    if (!crit) return;

    let updated = [...crit.skillReactions];
    if (updated.includes(args.skillBadge)) {
      updated = updated.filter((s) => s !== args.skillBadge);
    } else {
      updated.push(args.skillBadge);
    }
    await ctx.db.patch(args.critId, { skillReactions: updated });
  },
});

export const saveToFeedbackNotes = mutation({
  args: {
    userId: v.string(),
    critId: v.string(),
    projectId: v.string(),
    projectTitle: v.string(),
    authorName: v.string(),
    authorAvatar: v.string(),
    stage: v.string(),
    whatWorked: v.string(),
    whatToTryNext: v.string(),
    personalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("feedbackNotes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("critId"), args.critId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("feedbackNotes", {
      ...args,
      actionableStatus: "todo",
      createdAt: Date.now(),
    });
  },
});

export const getUserFeedbackNotes = query({
  args: {
    userId: v.string(),
    status: v.optional(v.union(v.literal("todo"), v.literal("addressed"), v.literal("dismissed"))),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("feedbackNotes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.status) {
      q = ctx.db
        .query("feedbackNotes")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", args.userId).eq("actionableStatus", args.status!)
        );
    }
    return await q.order("desc").collect();
  },
});

export const updateFeedbackNoteStatus = mutation({
  args: {
    noteId: v.id("feedbackNotes"),
    actionableStatus: v.optional(
      v.union(v.literal("todo"), v.literal("addressed"), v.literal("dismissed"))
    ),
    personalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { noteId, ...updates } = args;
    await ctx.db.patch(noteId, updates);
  },
});
