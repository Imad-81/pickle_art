import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getItemsByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stage1Items")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const addItem = mutation({
  args: {
    projectId: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("text_sticky"),
      v.literal("shape"),
      v.literal("drawing"),
      v.literal("video"),
      v.literal("audio"),
      v.literal("pdf"),
      v.literal("link"),
      v.literal("frame")
    ),
    x: v.number(),
    y: v.number(),
    width: v.number(),
    height: v.number(),
    rotation: v.optional(v.number()),
    zIndex: v.number(),
    color: v.optional(v.string()),
    content: v.string(),
    title: v.optional(v.string()),
    frameId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const itemId = await ctx.db.insert("stage1Items", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Mark project stage1 as having content
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("_id"), args.projectId as any))
      .first();

    if (project && !project.stage1Completed) {
      await ctx.db.patch(project._id, {
        stage1Completed: true,
        outputUnlocked: project.isExemptPhotography || project.stage2Completed,
      });
    }

    return itemId;
  },
});

export const updateItemTransform = mutation({
  args: {
    itemId: v.id("stage1Items"),
    x: v.number(),
    y: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    rotation: v.optional(v.number()),
    zIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { itemId, ...transforms } = args;
    await ctx.db.patch(itemId, {
      ...transforms,
      updatedAt: Date.now(),
    });
  },
});

export const updateItemContent = mutation({
  args: {
    itemId: v.id("stage1Items"),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    color: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        author: v.optional(v.string()),
        caption: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        duration: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { itemId, ...updates } = args;
    await ctx.db.patch(itemId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteItem = mutation({
  args: { itemId: v.id("stage1Items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return;
    const projectId = item.projectId;
    await ctx.db.delete(args.itemId);

    // Check if any items remain in stage 1
    const remaining = await ctx.db
      .query("stage1Items")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!remaining) {
      const project = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("_id"), projectId as any))
        .first();
      if (project) {
        await ctx.db.patch(project._id, {
          stage1Completed: false,
          outputUnlocked: project.isExemptPhotography,
        });
      }
    }
  },
});

export const batchUpdateTransforms = mutation({
  args: {
    updates: v.array(
      v.object({
        itemId: v.id("stage1Items"),
        x: v.number(),
        y: v.number(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        rotation: v.optional(v.number()),
        zIndex: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const update of args.updates) {
      const { itemId, ...transforms } = update;
      await ctx.db.patch(itemId, {
        ...transforms,
        updatedAt: now,
      });
    }
  },
});
