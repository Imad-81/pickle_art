import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.string(),
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.currentUserId === args.targetUserId) {
      throw new Error("Cannot message yourself");
    }

    const [user1Id, user2Id] = [args.currentUserId, args.targetUserId].sort();

    // Check if conversation exists
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_pair", (q) => q.eq("user1Id", user1Id).eq("user2Id", user2Id))
      .first();

    if (existing) {
      return existing._id;
    }

    // Determine initial status based on follow status
    // If targetUser already follows currentUserId -> "accepted"
    // Otherwise -> "pending" (DM request)
    const isTargetFollowingCurrent = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.targetUserId).eq("followingId", args.currentUserId)
      )
      .first();

    const initialStatus = isTargetFollowingCurrent ? "accepted" : "pending";
    const now = Date.now();

    const conversationId = await ctx.db.insert("conversations", {
      user1Id,
      user2Id,
      participantIds: [args.currentUserId, args.targetUserId],
      initiatorId: args.currentUserId,
      recipientId: args.targetUserId,
      status: initialStatus,
      lastMessageText: undefined,
      lastMessageAt: now,
      lastSenderId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return conversationId;
  },
});

export const getConversationById = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const listUserConversations = query({
  args: {
    userId: v.string(),
    filter: v.union(v.literal("primary"), v.literal("requests")),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return [];

    // Query conversations where user is user1 or user2
    const convsAsUser1 = await ctx.db
      .query("conversations")
      .withIndex("by_user1", (q) => q.eq("user1Id", args.userId))
      .collect();

    const convsAsUser2 = await ctx.db
      .query("conversations")
      .withIndex("by_user2", (q) => q.eq("user2Id", args.userId))
      .collect();

    const allConvs = [...convsAsUser1, ...convsAsUser2];

    // Filter by tab:
    // requests: status === "pending" AND recipientId === userId (Incoming requests)
    // primary: status === "accepted" OR (status === "pending" AND initiatorId === userId)
    const filteredConvs = allConvs.filter((c) => {
      if (c.status === "declined") return false;
      if (args.filter === "requests") {
        return c.status === "pending" && c.recipientId === args.userId;
      } else {
        return c.status === "accepted" || (c.status === "pending" && c.initiatorId === args.userId);
      }
    });

    // Populate other participant metadata
    const populated = await Promise.all(
      filteredConvs.map(async (conv) => {
        const otherUserId = conv.participantIds.find((id) => id !== args.userId) || conv.recipientId;

        // Try getting user from users table
        let otherUser = null;
        try {
          otherUser = await ctx.db.get(otherUserId as Id<"users">);
        } catch {
          // not an Id<"users"> format
        }

        if (!otherUser) {
          otherUser = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", otherUserId))
            .first();
        }

        if (!otherUser) {
          otherUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", otherUserId))
            .first();
        }

        // Check if current user is following other user
        const isFollowingOther = otherUser
          ? await ctx.db
              .query("follows")
              .withIndex("by_pair", (q) =>
                q.eq("followerId", args.userId).eq("followingId", otherUser._id)
              )
              .first()
          : null;

        // Check unread messages in this conversation for current user
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .filter((q) =>
            q.and(
              q.eq(q.field("receiverId"), args.userId),
              q.neq(q.field("senderId"), args.userId),
              q.eq(q.field("isRead"), false)
            )
          )
          .collect();

        return {
          ...conv,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name,
                username: otherUser.username,
                avatarUrl: otherUser.avatarUrl,
                bio: otherUser.bio,
                growthPoints: otherUser.growthPoints,
                disciplines: otherUser.disciplines,
              }
            : {
                _id: otherUserId,
                name: otherUserId,
                username: otherUserId,
                avatarUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${otherUserId}`,
                bio: "",
                growthPoints: 50,
                disciplines: [],
              },
          isFollowing: !!isFollowingOther,
          unreadCount: unreadMessages.length,
        };
      })
    );

    // Sort by lastMessageAt descending
    populated.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return populated;
  },
});

export const getPendingRequestCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) return 0;
    const requests = await ctx.db
      .query("conversations")
      .withIndex("by_recipient_status", (q) =>
        q.eq("recipientId", args.userId).eq("status", "pending")
      )
      .collect();
    return requests.length;
  },
});

export const getConversationMessages = query({
  args: {
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.conversationId) return [];
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

export const sendDirectMessage = mutation({
  args: {
    conversationId: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    senderAvatar: v.string(),
    receiverId: v.string(),
    text: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("card"), v.literal("image"), v.literal("file")),
          url: v.optional(v.string()),
          name: v.optional(v.string()),
          cardId: v.optional(v.string()),
          cardTitle: v.optional(v.string()),
          cardCover: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Insert message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      senderName: args.senderName,
      senderAvatar: args.senderAvatar,
      receiverId: args.receiverId,
      text: args.text,
      attachments: args.attachments || [],
      isRead: false,
      createdAt: now,
    });

    // 2. Update conversation summary
    try {
      const conv = await ctx.db.get(args.conversationId as Id<"conversations">);
      if (conv) {
        let snippet = args.text;
        if (!snippet && args.attachments && args.attachments.length > 0) {
          snippet = `Shared ${args.attachments[0].cardTitle || "a card"}`;
        }
        await ctx.db.patch(conv._id, {
          lastMessageText: snippet,
          lastMessageAt: now,
          lastSenderId: args.senderId,
          updatedAt: now,
        });
      }
    } catch (e) {
      console.error("Error updating conversation metadata:", e);
    }

    return messageId;
  },
});

export const acceptMessageRequest = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) {
      throw new Error("Conversation not found");
    }

    if (conv.recipientId !== args.userId && !conv.participantIds.includes(args.userId)) {
      throw new Error("Unauthorized to accept this request");
    }

    await ctx.db.patch(args.conversationId, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const declineMessageRequest = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) {
      throw new Error("Conversation not found");
    }

    if (conv.recipientId !== args.userId && !conv.participantIds.includes(args.userId)) {
      throw new Error("Unauthorized to decline this request");
    }

    // Delete associated messages
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const msg of msgs) {
      await ctx.db.delete(msg._id);
    }

    // Delete conversation
    await ctx.db.delete(args.conversationId);

    return true;
  },
});

export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) =>
        q.and(
          q.eq(q.field("receiverId"), args.userId),
          q.eq(q.field("isRead"), false)
        )
      )
      .collect();

    for (const msg of unread) {
      await ctx.db.patch(msg._id, { isRead: true });
    }

    return unread.length;
  },
});

export const searchCreatorsForDM = query({
  args: {
    currentUserId: v.string(),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const queryLower = args.query.toLowerCase().trim();

    // Filter out current user
    const otherUsers = allUsers.filter(
      (u) => u._id !== args.currentUserId && u.username !== args.currentUserId
    );

    // Get following list to prioritize mutuals
    const followingIds = (
      await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", args.currentUserId))
        .collect()
    ).map((f) => f.followingId);

    let filtered = otherUsers;
    if (queryLower) {
      filtered = otherUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(queryLower) ||
          u.username.toLowerCase().includes(queryLower) ||
          u.disciplines.some((d) => d.toLowerCase().includes(queryLower)) ||
          (u.bio && u.bio.toLowerCase().includes(queryLower))
      );
    }

    return filtered.map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      disciplines: u.disciplines,
      growthPoints: u.growthPoints,
      isFollowing: followingIds.includes(u._id) || followingIds.includes(u.username),
    }));
  },
});
