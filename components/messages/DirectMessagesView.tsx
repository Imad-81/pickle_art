"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { resolveMediaUrl } from "@/lib/media";
import { NewMessageModal } from "@/components/messages/NewMessageModal";
import { AttachCardModal } from "@/components/messages/AttachCardModal";
import {
  MessageSquare,
  Plus,
  Send,
  Search,
  CheckCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Layers,
  X,
  ExternalLink,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DirectMessagesViewProps {
  initialTargetUserId?: string | null;
  initialConversationId?: string | null;
}

export function DirectMessagesView({
  initialTargetUserId,
  initialConversationId,
}: DirectMessagesViewProps) {
  const { user, openAuthModal } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"primary" | "requests">("primary");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [searchFilter, setSearchFilter] = useState("");
  const [messageText, setMessageText] = useState("");
  const [attachedCard, setAttachedCard] = useState<{
    id: string;
    title: string;
    coverUrl: string;
    discipline: string;
  } | null>(null);

  const [isNewMessageModalOpen, setNewMessageModalOpen] = useState(false);
  const [isAttachCardModalOpen, setAttachCardModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const currentUserId = user?.id || "";
  const conversations = useQuery(
    api.messages.listUserConversations,
    currentUserId ? { userId: currentUserId, filter: activeSubTab } : "skip"
  );
  const pendingRequestsCount = useQuery(
    api.messages.getPendingRequestCount,
    currentUserId ? { userId: currentUserId } : "skip"
  );

  const activeMessages = useQuery(
    api.messages.getConversationMessages,
    selectedConversationId ? { conversationId: selectedConversationId } : "skip"
  );

  // Mutations
  const getOrCreateConversationMutation = useMutation(
    api.messages.getOrCreateConversation
  );
  const sendDirectMessageMutation = useMutation(api.messages.sendDirectMessage);
  const acceptRequestMutation = useMutation(api.messages.acceptMessageRequest);
  const declineRequestMutation = useMutation(api.messages.declineMessageRequest);
  const markAsReadMutation = useMutation(api.messages.markMessagesAsRead);
  const toggleFollowMutation = useMutation(api.follows.toggleFollow);

  // Handle initial target user deep-linking
  useEffect(() => {
    if (initialTargetUserId && currentUserId && initialTargetUserId !== currentUserId) {
      getOrCreateConversationMutation({
        currentUserId,
        targetUserId: initialTargetUserId,
      })
        .then((convId) => {
          setSelectedConversationId(convId);
        })
        .catch(console.error);
    }
  }, [initialTargetUserId, currentUserId, getOrCreateConversationMutation]);

  // Mark as read when conversation is opened
  useEffect(() => {
    if (selectedConversationId && currentUserId) {
      markAsReadMutation({
        conversationId: selectedConversationId,
        userId: currentUserId,
      }).catch(console.error);
    }
  }, [selectedConversationId, currentUserId, activeMessages, markAsReadMutation]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // Find active conversation details
  const activeConversation = conversations?.find(
    (c) => c._id === selectedConversationId
  );

  // Filter conversations list
  const filteredConversations = (conversations || []).filter((conv) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      conv.otherUser.name.toLowerCase().includes(q) ||
      conv.otherUser.username.toLowerCase().includes(q) ||
      (conv.lastMessageText && conv.lastMessageText.toLowerCase().includes(q))
    );
  });

  const handleSelectCreatorFromModal = async (targetUser: {
    _id: string;
    name: string;
    username: string;
    avatarUrl: string;
  }) => {
    if (!currentUserId) {
      openAuthModal();
      return;
    }
    try {
      const convId = await getOrCreateConversationMutation({
        currentUserId,
        targetUserId: targetUser._id,
      });
      setSelectedConversationId(convId);
      setActiveSubTab("primary");
    } catch (err) {
      console.error("Failed to get/create conversation:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversationId || !activeConversation) {
      if (!user) openAuthModal();
      return;
    }

    if (!messageText.trim() && !attachedCard) return;

    const textToSend = messageText.trim();
    const attachments = attachedCard
      ? [
          {
            type: "card" as const,
            cardId: attachedCard.id,
            cardTitle: attachedCard.title,
            cardCover: attachedCard.coverUrl,
            name: attachedCard.title,
          },
        ]
      : [];

    setMessageText("");
    setAttachedCard(null);

    await sendDirectMessageMutation({
      conversationId: selectedConversationId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      receiverId: activeConversation.otherUser._id,
      text: textToSend,
      attachments,
    });
  };

  const handleAcceptRequest = async () => {
    if (!selectedConversationId || !user) return;
    await acceptRequestMutation({
      conversationId: selectedConversationId as any,
      userId: user.id,
    });
  };

  const handleDeclineRequest = async () => {
    if (!selectedConversationId || !user) return;
    if (confirm("Are you sure you want to decline and delete this message request?")) {
      await declineRequestMutation({
        conversationId: selectedConversationId as any,
        userId: user.id,
      });
      setSelectedConversationId(null);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !activeConversation) {
      openAuthModal();
      return;
    }
    await toggleFollowMutation({
      followerId: user.id,
      followingId: activeConversation.otherUser._id,
    });
  };

  const isPendingForMe =
    activeConversation &&
    activeConversation.status === "pending" &&
    activeConversation.recipientId === currentUserId;

  const isPendingForOther =
    activeConversation &&
    activeConversation.status === "pending" &&
    activeConversation.initiatorId === currentUserId;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[74vh] min-h-[540px]">
      {/* 1. LEFT PANEL: CONVERSATIONS LIST (4 cols) */}
      <div className="lg:col-span-4 bg-[#1C1A17] border border-[#2E2924] rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Top actions & Sub-tabs */}
        <div className="p-3.5 border-b border-[#2E2924] space-y-3 bg-[#141210]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#EDE6DD] font-serif">
              Direct Messages
            </h2>
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal();
                  return;
                }
                setNewMessageModalOpen(true);
              }}
              className="p-1.5 px-2.5 rounded-xl bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New DM</span>
            </button>
          </div>

          {/* Sub-tabs: Primary vs Requests */}
          <div className="flex items-center gap-1.5 p-1 bg-[#1C1A17] border border-[#2E2924] rounded-xl">
            <button
              onClick={() => setActiveSubTab("primary")}
              className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all text-center ${
                activeSubTab === "primary"
                  ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                  : "text-[#8A837A] hover:text-[#EDE6DD]"
              }`}
            >
              Primary
            </button>
            <button
              onClick={() => setActiveSubTab("requests")}
              className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === "requests"
                  ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                  : "text-[#8A837A] hover:text-[#EDE6DD]"
              }`}
            >
              <span>Requests</span>
              {(pendingRequestsCount ?? 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E08B3F] text-black">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7E776F]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter messages..."
              className="w-full bg-[#1C1A17] border border-[#2E2924] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
            />
          </div>
        </div>

        {/* Conversations List Feed */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {!user ? (
            <div className="p-8 text-center text-xs text-[#8A837A] space-y-3">
              <Sparkles className="w-6 h-6 text-[#A3E635] mx-auto" />
              <p>Sign in to view and send direct messages to creators.</p>
              <button
                onClick={openAuthModal}
                className="px-4 py-1.5 bg-[#A3E635] text-[#171512] text-xs font-semibold rounded-lg"
              >
                Sign In
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8A837A] space-y-2">
              <MessageSquare className="w-6 h-6 text-[#8A837A] mx-auto opacity-50" />
              {activeSubTab === "requests" ? (
                <p>No pending message requests. Clean inbox!</p>
              ) : (
                <p>No conversations yet. Tap "New DM" to start chatting with creators!</p>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv._id === selectedConversationId;
              const formattedTime = conv.lastMessageAt
                ? formatDistanceToNow(conv.lastMessageAt, { addSuffix: true })
                : "";

              return (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConversationId(conv._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? "bg-[#241F1B] border-[#A3E635] text-[#EDE6DD] shadow-md"
                      : "bg-[#141210] border-transparent hover:bg-[#1E1B18] text-[#8A837A] hover:text-[#EDE6DD]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.otherUser.avatarUrl}
                      alt={conv.otherUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#2E2924]"
                    />
                    {conv.status === "accepted" && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#1C1A17]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-semibold text-[#EDE6DD] truncate">
                        {conv.otherUser.name}
                      </div>
                      <span className="text-[10px] font-mono text-[#7E776F] shrink-0">
                        {formattedTime.replace("about ", "")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <p className="text-[11px] text-[#8A837A] truncate font-sans">
                        {conv.lastMessageText || "No messages yet"}
                      </p>
                      {conv.status === "pending" && conv.recipientId === currentUserId && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#E08B3F]/20 text-[#E08B3F] border border-[#E08B3F]/40 shrink-0 font-semibold">
                          Request
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#A3E635] shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* User Persona footer */}
        {user && (
          <div className="p-3 bg-[#141210] border-t border-[#2E2924] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-[#EDE6DD] font-medium truncate">{user.name}</span>
            </div>
            <span className="text-[10px] font-mono text-[#A3E635]">
              {user.growthPoints || 50} pts
            </span>
          </div>
        )}
      </div>

      {/* 2. RIGHT PANEL: CHAT THREAD (8 cols) */}
      <div className="lg:col-span-8 bg-[#1C1A17] border border-[#2E2924] rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
        {!selectedConversationId || !activeConversation ? (
          /* Empty Chat State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#241F1B] border border-[#342D26] flex items-center justify-center text-[#A3E635] shadow-xl">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-serif font-bold text-[#EDE6DD]">
                Your Studio Direct Messages
              </h3>
              <p className="text-xs text-[#8A837A] font-sans leading-relaxed">
                Connect 1-on-1 with designers, illustrators, and makers. Share ideas, attach WIP cards, and exchange constructive process critiques.
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal();
                  return;
                }
                setNewMessageModalOpen(true);
              }}
              className="px-5 py-2 rounded-xl bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] text-xs font-semibold font-mono flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Conversation</span>
            </button>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="p-3.5 bg-[#141210] border-b border-[#2E2924] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${activeConversation.otherUser.username}`}
                  className="relative group"
                >
                  <img
                    src={activeConversation.otherUser.avatarUrl}
                    alt={activeConversation.otherUser.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#342D26] group-hover:border-[#A3E635] transition-colors"
                  />
                  {activeConversation.status === "accepted" && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#141210]" />
                  )}
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${activeConversation.otherUser.username}`}
                      className="text-xs font-semibold text-[#EDE6DD] hover:text-[#A3E635] transition-colors"
                    >
                      {activeConversation.otherUser.name}
                    </Link>
                    <span className="text-[10px] font-mono text-[#7E776F]">
                      @{activeConversation.otherUser.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8A837A]">
                    <span className="text-[#A3E635]">
                      {activeConversation.otherUser.growthPoints || 50} craft pts
                    </span>
                    {activeConversation.otherUser.disciplines &&
                      activeConversation.otherUser.disciplines.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">
                            {activeConversation.otherUser.disciplines.join(", ")}
                          </span>
                        </>
                      )}
                  </div>
                </div>
              </div>

              {/* Top Header Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFollow}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                    activeConversation.isFollowing
                      ? "bg-[#241F1B] text-[#8A837A] border border-[#3E3832]"
                      : "bg-[#2A2521] text-[#A3E635] hover:bg-[#342E29] border border-[#3E3832]"
                  }`}
                >
                  {activeConversation.isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-green-400" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/profile/${activeConversation.otherUser.username}`}
                  className="p-1.5 px-2.5 rounded-lg bg-[#241F1B] hover:bg-[#342D26] text-xs font-mono text-[#8A837A] hover:text-[#EDE6DD] flex items-center gap-1 transition-colors"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* INSTAGRAM-STYLE DM REQUEST BANNER (For Recipient) */}
            {isPendingForMe && (
              <div className="p-4 bg-[#241F1B] border-b border-[#3E3832] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-[#E08B3F] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-[#EDE6DD]">
                      Message Request from {activeConversation.otherUser.name} (@
                      {activeConversation.otherUser.username})
                    </div>
                    <p className="text-[11px] text-[#8A837A] font-sans">
                      They have {activeConversation.otherUser.growthPoints || 50} craft points. Accept to allow direct messages and reply.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={handleDeclineRequest}
                    className="px-3 py-1.5 rounded-lg bg-[#1C1A17] hover:bg-red-950/40 border border-[#3E3832] hover:border-red-800/40 text-xs font-mono text-[#8A837A] hover:text-red-400 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptRequest}
                    className="px-4 py-1.5 rounded-lg bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] text-xs font-mono font-semibold transition-all shadow-md"
                  >
                    Accept Request
                  </button>
                </div>
              </div>
            )}

            {/* OUTGOING REQUEST NOTICE (For Sender) */}
            {isPendingForOther && (
              <div className="p-3 bg-[#181613] border-b border-[#2E2924] flex items-center gap-2 text-[11px] text-[#8A837A]">
                <ShieldCheck className="w-4 h-4 text-[#A3E635] shrink-0" />
                <span>
                  Your direct message was sent as a request. Once @
                  {activeConversation.otherUser.username} accepts, you can continue chatting.
                </span>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {activeMessages && activeMessages.length === 0 && (
                <div className="p-12 text-center text-xs text-[#8A837A] space-y-2">
                  <Sparkles className="w-6 h-6 text-[#A3E635] mx-auto" />
                  <p>Say hello to {activeConversation.otherUser.name}!</p>
                </div>
              )}

              {activeMessages &&
                activeMessages.map((msg) => {
                  const isMe = user?.id === msg.senderId;
                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-3 max-w-xl ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                      />

                      <div className="space-y-1">
                        <div
                          className={`flex items-center gap-2 text-[10px] font-mono ${
                            isMe ? "justify-end text-[#A3E635]" : "text-[#8A837A]"
                          }`}
                        >
                          <span className="font-semibold">{msg.senderName}</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div
                          className={`p-3 rounded-2xl text-xs font-sans leading-relaxed ${
                            isMe
                              ? "bg-[#A3E635] text-[#171512] rounded-tr-none font-medium"
                              : "bg-[#241F1B] text-[#EDE6DD] rounded-tl-none border border-[#342D26]"
                          }`}
                        >
                          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                          {/* Render Card Attachment Preview */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att: any, idx: number) => {
                                if (att.type === "card") {
                                  return (
                                    <Link
                                      key={idx}
                                      href={`/project/${att.cardId}`}
                                      className={`block p-2.5 rounded-xl border transition-all ${
                                        isMe
                                          ? "bg-black/30 border-black/30 hover:bg-black/40 text-[#171512]"
                                          : "bg-[#141210] border-[#3E3832] hover:border-[#A3E635]/50 text-[#EDE6DD]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        {att.cardCover && (
                                          <img
                                            src={resolveMediaUrl(att.cardCover)}
                                            alt={att.cardTitle}
                                            className="w-12 h-12 rounded-lg object-cover shrink-0"
                                          />
                                        )}
                                        <div className="min-w-0">
                                          <div className="text-[10px] font-mono opacity-70 uppercase">
                                            Project Card
                                          </div>
                                          <div className="text-xs font-semibold truncate">
                                            {att.cardTitle}
                                          </div>
                                          <div className="text-[10px] font-mono opacity-80 flex items-center gap-1 pt-0.5">
                                            <span>View Process Trail</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached Card Chip Preview before sending */}
            {attachedCard && (
              <div className="px-4 py-2 bg-[#1C1A17] border-t border-[#2E2924] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#EDE6DD]">
                  <img
                    src={resolveMediaUrl(attachedCard.coverUrl)}
                    alt={attachedCard.title}
                    className="w-6 h-6 rounded-md object-cover"
                  />
                  <span className="font-mono text-[11px] text-[#A3E635]">Attached:</span>
                  <span className="truncate font-medium max-w-xs">{attachedCard.title}</span>
                </div>
                <button
                  onClick={() => setAttachedCard(null)}
                  className="p-1 rounded text-[#8A837A] hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Composer Input Bar */}
            {isPendingForMe ? (
              <div className="p-3 bg-[#141210] border-t border-[#2E2924] text-center text-xs text-[#8A837A]">
                Accept this request above to reply to {activeConversation.otherUser.name}.
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-[#141210] border-t border-[#2E2924] flex items-center gap-2"
              >
                {/* Attach Project button */}
                <button
                  type="button"
                  onClick={() => setAttachCardModalOpen(true)}
                  title="Attach a Project / WIP card"
                  className="p-2 rounded-full bg-[#1C1A17] hover:bg-[#2A2521] border border-[#2E2924] hover:border-[#A3E635] text-[#8A837A] hover:text-[#A3E635] transition-colors"
                >
                  <Layers className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${activeConversation.otherUser.name}...`}
                  className="flex-1 bg-[#1C1A17] border border-[#2E2924] rounded-full px-4 py-2.5 text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() && !attachedCard}
                  className="p-2.5 rounded-full bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] disabled:opacity-40 transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <NewMessageModal
        isOpen={isNewMessageModalOpen}
        onClose={() => setNewMessageModalOpen(false)}
        onSelectUser={handleSelectCreatorFromModal}
        currentUserId={currentUserId}
      />

      <AttachCardModal
        isOpen={isAttachCardModalOpen}
        onClose={() => setAttachCardModalOpen(false)}
        onSelectProject={(p) => setAttachedCard(p)}
        userId={currentUserId}
      />
    </div>
  );
}
