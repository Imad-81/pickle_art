import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOutputByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("finalOutputs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();
  },
});

export const saveFinalOutput = mutation({
  args: {
    projectId: v.string(),
    title: v.string(),
    summary: v.string(),
    behindTheScenes: v.string(),
    mediaUrls: v.array(
      v.object({
        url: v.string(),
        type: v.union(v.literal("image"), v.literal("video")),
        caption: v.optional(v.string()),
      })
    ),
    fileAttachments: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        sizeBytes: v.number(),
        type: v.string(),
      })
    ),
    publishNow: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("_id"), args.projectId as any))
      .first();

    if (!project) throw new Error("Project not found");

    // Check gating rule: Must have stage 1 and stage 2 content, unless exempt
    if (!project.isExemptPhotography && (!project.stage1Completed || !project.stage2Completed)) {
      throw new Error("Gating Error: Stage 1 and Stage 2 must have content before Output can be saved or published.");
    }

    const existing = await ctx.db
      .query("finalOutputs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        summary: args.summary,
        behindTheScenes: args.behindTheScenes,
        mediaUrls: args.mediaUrls,
        fileAttachments: args.fileAttachments,
        publishedAt: now,
      });
    } else {
      await ctx.db.insert("finalOutputs", {
        projectId: args.projectId,
        title: args.title,
        summary: args.summary,
        behindTheScenes: args.behindTheScenes,
        mediaUrls: args.mediaUrls,
        fileAttachments: args.fileAttachments,
        publishedAt: now,
      });
    }

    if (args.publishNow) {
      await ctx.db.patch(project._id, {
        status: "complete",
        outputPublished: true,
        outputUnlocked: true,
        updatedAt: now,
      });
    }

    return true;
  },
});
