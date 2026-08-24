import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSubcardsByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stage2Subcards")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("asc")
      .collect();
  },
});

export const createSubcard = mutation({
  args: {
    projectId: v.string(),
    title: v.string(),
    processNotes: v.string(),
    mediaUrls: v.array(
      v.object({
        url: v.string(),
        type: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
        caption: v.optional(v.string()),
      })
    ),
    poll: v.optional(
      v.object({
        question: v.string(),
        isOpen: v.boolean(),
        options: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
            voters: v.array(v.string()),
          })
        ),
      })
    ),
    linkedStage1ItemIds: v.optional(v.array(v.string())),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stage2Subcards")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const orderIndex =
      args.orderIndex !== undefined ? args.orderIndex : existing.length;

    const subcardId = await ctx.db.insert("stage2Subcards", {
      projectId: args.projectId,
      title: args.title,
      processNotes: args.processNotes,
      mediaUrls: args.mediaUrls,
      poll: args.poll,
      linkedStage1ItemIds: args.linkedStage1ItemIds || [],
      orderIndex,
      createdAt: Date.now(),
    });

    // Update project stage 2 completed status
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("_id"), args.projectId as any))
      .first();

    if (project && !project.stage2Completed) {
      await ctx.db.patch(project._id, {
        stage2Completed: true,
        outputUnlocked: project.isExemptPhotography || project.stage1Completed,
      });
    }

    return subcardId;
  },
});

export const updateSubcard = mutation({
  args: {
    subcardId: v.id("stage2Subcards"),
    title: v.optional(v.string()),
    processNotes: v.optional(v.string()),
    mediaUrls: v.optional(
      v.array(
        v.object({
          url: v.string(),
          type: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
          caption: v.optional(v.string()),
        })
      )
    ),
    poll: v.optional(
      v.object({
        question: v.string(),
        isOpen: v.boolean(),
        options: v.array(
          v.object({
            id: v.string(),
            text: v.string(),
            voters: v.array(v.string()),
          })
        ),
      })
    ),
    linkedStage1ItemIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { subcardId, ...updates } = args;
    await ctx.db.patch(subcardId, updates);
  },
});

export const votePoll = mutation({
  args: {
    subcardId: v.id("stage2Subcards"),
    optionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const subcard = await ctx.db.get(args.subcardId);
    if (!subcard || !subcard.poll || !subcard.poll.isOpen) return;

    // Remove user from any existing option and add to selected option
    const updatedOptions = subcard.poll.options.map((opt) => {
      const filteredVoters = opt.voters.filter((id) => id !== args.userId);
      if (opt.id === args.optionId) {
        filteredVoters.push(args.userId);
      }
      return {
        ...opt,
        voters: filteredVoters,
      };
    });

    await ctx.db.patch(args.subcardId, {
      poll: {
        ...subcard.poll,
        options: updatedOptions,
      },
    });
  },
});

export const deleteSubcard = mutation({
  args: { subcardId: v.id("stage2Subcards") },
  handler: async (ctx, args) => {
    const subcard = await ctx.db.get(args.subcardId);
    if (!subcard) return;
    const projectId = subcard.projectId;
    await ctx.db.delete(args.subcardId);

    // Check remaining subcards and canvas items
    const remainingSubcards = await ctx.db
      .query("stage2Subcards")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    const remainingCanvasItems = await ctx.db
      .query("stage2Items")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!remainingSubcards && !remainingCanvasItems) {
      const project = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("_id"), projectId as any))
        .first();
      if (project) {
        await ctx.db.patch(project._id, {
          stage2Completed: false,
          outputUnlocked: project.isExemptPhotography,
        });
      }
    }
  },
});

/* =========================================================
   STAGE 2 STITCH CANVAS QUERIES & MUTATIONS
   ========================================================= */

export const getCanvasItemsByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stage2Items")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const addCanvasItem = mutation({
  args: {
    projectId: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("text_sticky"),
      v.literal("shape"),
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
    const now = Date.now();
    const itemId = await ctx.db.insert("stage2Items", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Mark project stage2 as completed / active
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("_id"), args.projectId as any))
      .first();

    if (project && !project.stage2Completed) {
      await ctx.db.patch(project._id, {
        stage2Completed: true,
        outputUnlocked: project.isExemptPhotography || project.stage1Completed,
      });
    }

    return itemId;
  },
});

export const updateCanvasItemTransform = mutation({
  args: {
    itemId: v.id("stage2Items"),
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

export const updateCanvasItemContent = mutation({
  args: {
    itemId: v.id("stage2Items"),
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

export const deleteCanvasItem = mutation({
  args: { itemId: v.id("stage2Items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return;
    const projectId = item.projectId;
    await ctx.db.delete(args.itemId);

    // Check if any items or subcards remain in stage 2
    const remainingItems = await ctx.db
      .query("stage2Items")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    const remainingSubcards = await ctx.db
      .query("stage2Subcards")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!remainingItems && !remainingSubcards) {
      const project = await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("_id"), projectId as any))
        .first();
      if (project) {
        await ctx.db.patch(project._id, {
          stage2Completed: false,
          outputUnlocked: project.isExemptPhotography,
        });
      }
    }
  },
});

export const batchUpdateCanvasTransforms = mutation({
  args: {
    updates: v.array(
      v.object({
        itemId: v.id("stage2Items"),
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
