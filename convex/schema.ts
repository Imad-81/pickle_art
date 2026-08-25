import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    username: v.string(),
    avatarUrl: v.string(),
    bio: v.optional(v.string()),
    disciplines: v.array(v.string()), // e.g. ["#illustration", "#packaging", "#typography"]
    growthPoints: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  follows: defineTable({
    followerId: v.string(), // user ID or username
    followingId: v.string(), // user ID or username
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_pair", ["followerId", "followingId"]),

  highlights: defineTable({
    creatorId: v.string(),
    creatorName: v.string(),
    creatorAvatar: v.string(),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("audio")),
    caption: v.optional(v.string()),
    linkedProjectId: v.optional(v.string()),
    linkedProjectTitle: v.optional(v.string()),
    expiresAt: v.number(), // timestamp (Date.now() + 24 * 60 * 60 * 1000)
    viewers: v.array(v.string()), // user IDs who viewed this highlight
    createdAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_expiresAt", ["expiresAt"]),

  projects: defineTable({
    creatorId: v.string(),
    creatorName: v.string(),
    creatorUsername: v.string(),
    creatorAvatar: v.string(),
    title: v.string(),
    description: v.string(),
    goals: v.optional(v.string()),
    discipline: v.string(), // e.g. "Packaging", "Industrial Design", "Illustration", "Typography"
    tags: v.array(v.string()), // e.g. ["#packaging", "#branding", "#kraft", "#sustainable"]
    tools: v.array(v.string()), // e.g. ["Figma", "Blender", "Illustrator", "Physical Prototyping"]
    coverUrl: v.string(),
    privacy: v.union(v.literal("public"), v.literal("unlisted"), v.literal("private")),
    status: v.union(v.literal("in_progress"), v.literal("complete")),
    isExemptPhotography: v.boolean(),
    stage1Completed: v.boolean(),
    stage2Completed: v.boolean(),
    outputUnlocked: v.boolean(),
    outputPublished: v.boolean(),
    stats: v.object({
      views: v.number(),
      critsCount: v.number(),
      bookmarksCount: v.number(),
      timeSpentSeconds: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["creatorId"])
    .index("by_status", ["status"])
    .index("by_discipline", ["discipline"])
    .index("by_created", ["createdAt"]),

  stage1Items: defineTable({
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
    color: v.optional(v.string()), // for stickies or shapes
    content: v.string(), // text content or URL
    title: v.optional(v.string()),
    frameId: v.optional(v.string()), // parent frame ID if grouped
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_frame", ["frameId"]),

  stage2Items: defineTable({
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
    color: v.optional(v.string()), // for stickies or shapes
    content: v.string(), // text content or URL
    title: v.optional(v.string()),
    frameId: v.optional(v.string()), // parent frame ID if grouped
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_frame", ["frameId"]),

  stage2Subcards: defineTable({
    projectId: v.string(),
    title: v.string(),
    processNotes: v.string(), // markdown / text
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
            voters: v.array(v.string()), // array of user IDs
          })
        ),
      })
    ),
    linkedStage1ItemIds: v.array(v.string()),
    orderIndex: v.number(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_order", ["projectId", "orderIndex"]),

  finalOutputs: defineTable({
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
    publishedAt: v.number(),
  }).index("by_project", ["projectId"]),

  crits: defineTable({
    projectId: v.string(),
    authorId: v.string(),
    authorName: v.string(),
    authorUsername: v.string(),
    authorAvatar: v.string(),
    targetStage: v.union(v.literal("stage1"), v.literal("stage2"), v.literal("output")),
    targetSubcardId: v.optional(v.string()),
    whatWorked: v.string(), // constructive feedback prompt 1
    whatToTryNext: v.string(), // constructive feedback prompt 2
    content: v.optional(v.string()),
    skillReactions: v.array(v.string()), // ["Color Balance", "Composition", "Typography", "Hierarchy", "Material Texture", "Narrative/Concept", "Execution", "Lighting"]
    isPinned: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_stage", ["projectId", "targetStage"]),

  feedbackNotes: defineTable({
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
    actionableStatus: v.union(v.literal("todo"), v.literal("addressed"), v.literal("dismissed")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "actionableStatus"]),

  channels: defineTable({
    name: v.string(), // e.g. "Packaging Design"
    slug: v.string(), // e.g. "packaging"
    description: v.string(),
    icon: v.string(), // icon name or glyph
    coverImage: v.string(),
    colorCode: v.string(), // e.g. "#A3E635"
    memberCount: v.number(),
  }).index("by_slug", ["slug"]),

  channelMemberships: defineTable({
    userId: v.string(),
    channelSlug: v.string(),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_channel", ["channelSlug"])
    .index("by_pair", ["userId", "channelSlug"]),

  conversations: defineTable({
    user1Id: v.string(), // Canonical lexicographically ordered user ID
    user2Id: v.string(), // Canonical lexicographically ordered user ID
    participantIds: v.array(v.string()),
    initiatorId: v.string(),
    recipientId: v.string(),
    status: v.union(v.literal("accepted"), v.literal("pending"), v.literal("declined")),
    lastMessageText: v.optional(v.string()),
    lastMessageAt: v.number(),
    lastSenderId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pair", ["user1Id", "user2Id"])
    .index("by_user1", ["user1Id", "status"])
    .index("by_user2", ["user2Id", "status"])
    .index("by_recipient_status", ["recipientId", "status"])
    .index("by_last_message", ["lastMessageAt"]),

  messages: defineTable({
    senderId: v.string(),
    senderName: v.string(),
    senderAvatar: v.string(),
    conversationId: v.optional(v.string()), // for direct messages e.g. "userA_userB" or conversation ID
    channelSlug: v.optional(v.string()), // for channel chat e.g. "packaging"
    receiverId: v.optional(v.string()),
    text: v.string(),
    attachments: v.array(
      v.object({
        type: v.union(v.literal("card"), v.literal("image"), v.literal("file")),
        url: v.optional(v.string()),
        name: v.optional(v.string()),
        cardId: v.optional(v.string()),
        cardTitle: v.optional(v.string()),
        cardCover: v.optional(v.string()),
      })
    ),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_channel", ["channelSlug", "createdAt"]),

  activityInteractions: defineTable({
    userId: v.string(),
    projectId: v.string(),
    type: v.union(v.literal("view"), v.literal("dwell"), v.literal("crit"), v.literal("bookmark"), v.literal("save_note")),
    tags: v.array(v.string()),
    durationSeconds: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_created", ["createdAt"]),
});
