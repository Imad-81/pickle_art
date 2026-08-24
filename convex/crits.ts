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
    // 1. Get all projects owned by this user
    const userProjects = await ctx.db
      .query("projects")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .collect();

    if (userProjects.length === 0) return [];

    // 2. Gather all crits on those projects (excluding crits authored by the user)
    const allCrits: any[] = [];
    for (const project of userProjects) {
      const crits = await ctx.db
        .query("crits")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const crit of crits) {
        if (crit.authorId !== args.userId) {
          allCrits.push({ crit, project });
        }
      }
    }

    // 3. Load existing feedbackNotes to get saved statuses
    const savedNotes = await ctx.db
      .query("feedbackNotes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const savedByCritId = new Map(savedNotes.map((n) => [n.critId, n]));

    // 4. Merge: every crit becomes a feedback note entry
    const merged = allCrits.map(({ crit, project }) => {
      const saved = savedByCritId.get(crit._id);
      return {
        _id: saved?._id ?? crit._id, // use feedbackNote _id if exists (for status mutations)
        _isCritOnly: !saved, // flag: no saved note record yet
        critId: crit._id,
        userId: args.userId,
        projectId: project._id,
        projectTitle: project.title,
        authorName: crit.authorName,
        authorAvatar: crit.authorAvatar,
        stage: crit.targetStage,
        whatWorked: crit.whatWorked,
        whatToTryNext: crit.whatToTryNext,
        personalNote: saved?.personalNote,
        actionableStatus: saved?.actionableStatus ?? "todo",
        createdAt: crit.createdAt,
      };
    });

    // 5. Filter by status if requested
    const filtered = args.status
      ? merged.filter((n) => n.actionableStatus === args.status)
      : merged;

    // 6. Sort newest first
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateFeedbackNoteStatus = mutation({
  args: {
    // Pass noteId when the feedbackNote record already exists
    noteId: v.optional(v.id("feedbackNotes")),
    // Pass these when creating a new feedbackNote record from a raw crit
    userId: v.optional(v.string()),
    critId: v.optional(v.string()),
    projectId: v.optional(v.string()),
    projectTitle: v.optional(v.string()),
    authorName: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    stage: v.optional(v.string()),
    whatWorked: v.optional(v.string()),
    whatToTryNext: v.optional(v.string()),
    actionableStatus: v.optional(
      v.union(v.literal("todo"), v.literal("addressed"), v.literal("dismissed"))
    ),
    personalNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.noteId) {
      // Update existing feedbackNote
      const { noteId, userId, critId, projectId, projectTitle, authorName, authorAvatar, stage, whatWorked, whatToTryNext, ...updates } = args;
      await ctx.db.patch(noteId, updates);
    } else {
      // Upsert: create a feedbackNote from the raw crit data, then update
      if (!args.userId || !args.critId) return;
      const existing = await ctx.db
        .query("feedbackNotes")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .filter((q) => q.eq(q.field("critId"), args.critId!))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          actionableStatus: args.actionableStatus,
          personalNote: args.personalNote,
        });
      } else {
        await ctx.db.insert("feedbackNotes", {
          userId: args.userId!,
          critId: args.critId!,
          projectId: args.projectId ?? "",
          projectTitle: args.projectTitle ?? "",
          authorName: args.authorName ?? "",
          authorAvatar: args.authorAvatar ?? "",
          stage: args.stage ?? "",
          whatWorked: args.whatWorked ?? "",
          whatToTryNext: args.whatToTryNext ?? "",
          personalNote: args.personalNote,
          actionableStatus: args.actionableStatus ?? "todo",
          createdAt: Date.now(),
        });
      }
    }
  },
});
