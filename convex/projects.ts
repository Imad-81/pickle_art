import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProjectById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const listProjects = query({
  args: {
    discipline: v.optional(v.string()),
    status: v.optional(v.union(v.literal("in_progress"), v.literal("complete"))),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("projects").filter((f) => f.eq(f.field("privacy"), "public"));
    if (args.status) {
      q = q.filter((f) => f.eq(f.field("status"), args.status));
    }
    if (args.discipline) {
      q = q.filter((f) => f.eq(f.field("discipline"), args.discipline));
    }
    return await q.order("desc").collect();
  },
});

export const getUserProjects = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.userId))
      .order("desc")
      .collect();
  },
});

export const createProject = mutation({
  args: {
    creatorId: v.string(),
    creatorName: v.string(),
    creatorUsername: v.string(),
    creatorAvatar: v.string(),
    title: v.string(),
    description: v.string(),
    goals: v.optional(v.string()),
    discipline: v.string(),
    tags: v.array(v.string()),
    tools: v.array(v.string()),
    coverUrl: v.string(),
    privacy: v.union(v.literal("public"), v.literal("unlisted"), v.literal("private")),
    isExemptPhotography: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const isExempt = !!args.isExemptPhotography;

    return await ctx.db.insert("projects", {
      creatorId: args.creatorId,
      creatorName: args.creatorName,
      creatorUsername: args.creatorUsername,
      creatorAvatar: args.creatorAvatar,
      title: args.title,
      description: args.description,
      goals: args.goals || "",
      discipline: args.discipline,
      tags: args.tags,
      tools: args.tools,
      coverUrl: args.coverUrl,
      privacy: args.privacy,
      status: "in_progress",
      isExemptPhotography: isExempt,
      stage1Completed: false,
      stage2Completed: false,
      outputUnlocked: isExempt, // if photography, unlock immediately
      outputPublished: false,
      stats: {
        views: 1,
        critsCount: 0,
        bookmarksCount: 0,
        timeSpentSeconds: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    goals: v.optional(v.string()),
    discipline: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    tools: v.optional(v.array(v.string())),
    coverUrl: v.optional(v.string()),
    privacy: v.optional(v.union(v.literal("public"), v.literal("unlisted"), v.literal("private"))),
    status: v.optional(v.union(v.literal("in_progress"), v.literal("complete"))),
    isExemptPhotography: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    const existing = await ctx.db.get(projectId);
    if (!existing) throw new Error("Project not found");

    const newIsExempt =
      updates.isExemptPhotography !== undefined
        ? updates.isExemptPhotography
        : existing.isExemptPhotography;

    const outputUnlocked =
      newIsExempt || (existing.stage1Completed && existing.stage2Completed);

    await ctx.db.patch(projectId, {
      ...updates,
      outputUnlocked,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const toggleStageCompletion = mutation({
  args: {
    projectId: v.id("projects"),
    stage: v.union(v.literal("stage1"), v.literal("stage2")),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const stage1Completed =
      args.stage === "stage1" ? args.completed : project.stage1Completed;
    const stage2Completed =
      args.stage === "stage2" ? args.completed : project.stage2Completed;

    const outputUnlocked =
      project.isExemptPhotography || (stage1Completed && stage2Completed);

    await ctx.db.patch(args.projectId, {
      stage1Completed,
      stage2Completed,
      outputUnlocked,
      updatedAt: Date.now(),
    });
    return { stage1Completed, stage2Completed, outputUnlocked };
  },
});

export const recordInteraction = mutation({
  args: {
    userId: v.string(),
    projectId: v.id("projects"),
    type: v.union(v.literal("view"), v.literal("dwell"), v.literal("crit"), v.literal("bookmark"), v.literal("save_note")),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return;

    await ctx.db.insert("activityInteractions", {
      userId: args.userId,
      projectId: args.projectId,
      type: args.type,
      tags: project.tags,
      durationSeconds: args.durationSeconds,
      createdAt: Date.now(),
    });

    // Update stats on project
    const stats = { ...project.stats };
    if (args.type === "view") stats.views += 1;
    if (args.type === "bookmark") stats.bookmarksCount += 1;
    if (args.type === "dwell") stats.timeSpentSeconds += args.durationSeconds;

    await ctx.db.patch(args.projectId, { stats });
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Delete stage1 items
    const s1Items = await ctx.db
      .query("stage1Items")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const item of s1Items) await ctx.db.delete(item._id);

    // Delete stage2 items (subcards & canvas items)
    const s2Items = await ctx.db
      .query("stage2Subcards")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const item of s2Items) await ctx.db.delete(item._id);

    const s2CanvasItems = await ctx.db
      .query("stage2Items")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const item of s2CanvasItems) await ctx.db.delete(item._id);

    // Delete final output
    const output = await ctx.db
      .query("finalOutputs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
    if (output) await ctx.db.delete(output._id);

    await ctx.db.delete(args.projectId);
  },
});
