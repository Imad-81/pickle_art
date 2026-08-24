"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { resolveMediaUrl } from "@/lib/media";
import { FeedbackNotesView } from "@/components/feedback/FeedbackNotesView";
import { LeaveChannelModal } from "@/components/channels/LeaveChannelModal";
import {
  Hash,
  MessageSquare,
  BookOpen,
  Send,
  Plus,
  Users,
  LogOut,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function MessagesHubPage() {
  const { user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<"channels" | "feedback_notes">("channels");
  const [activeChannelSlug, setActiveChannelSlug] = useState("packaging");
  const [messageText, setMessageText] = useState("");
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);

  const channels = useQuery(api.channels.listChannels, {});
  const channelMessages = useQuery(api.channels.getChannelMessages, {
    channelSlug: activeChannelSlug,
  });

  const sendMessageMutation = useMutation(api.channels.sendChannelMessage);
  const joinChannelMutation = useMutation(api.channels.joinChannel);
  const leaveChannelMutation = useMutation(api.channels.leaveChannel);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!messageText.trim()) return;

    await sendMessageMutation({
      channelSlug: activeChannelSlug,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      text: messageText.trim(),
    });

    setMessageText("");
  };

  const handleConfirmLeave = async () => {
    if (!user) return;
    await leaveChannelMutation({
      userId: user.id,
      channelSlug: activeChannelSlug,
    });
    setLeaveModalOpen(false);
  };

  const currentChannel = channels?.find((c) => c.slug === activeChannelSlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Top Hub Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#EDE6DD]">
            Studio Notes & Channel Chats
          </h1>
          <p className="text-xs text-[#8A837A] font-sans">
            Real-time discipline rooms and your personal feedback repository.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141210] border border-[#2E2924] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("channels")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === "channels"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Discipline Channels</span>
          </button>
          <button
            onClick={() => setActiveTab("feedback_notes")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTab === "feedback_notes"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Feedback Notebook</span>
          </button>
        </div>
      </div>

      {/* 1. FEEDBACK NOTES TAB */}
      {activeTab === "feedback_notes" && <FeedbackNotesView />}

      {/* 2. CHANNELS CHAT TAB */}
      {activeTab === "channels" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[72vh] min-h-[500px]">
          {/* Channel Sidebar */}
          <div className="lg:col-span-1 bg-[#1C1A17] border border-[#2E2924] rounded-2xl p-4 space-y-3 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#8A837A] uppercase px-2 mb-2">
                DISCIPLINE ROOMS
              </div>
              {channels &&
                channels.map((ch) => {
                  const isActive = ch.slug === activeChannelSlug;
                  return (
                    <button
                      key={ch.slug}
                      onClick={() => setActiveChannelSlug(ch.slug)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                        isActive
                          ? "bg-[#241F1B] border-[#A3E635] text-[#EDE6DD]"
                          : "bg-[#141210] border-transparent text-[#8A837A] hover:bg-[#1E1B18] hover:text-[#EDE6DD]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ch.colorCode }}
                        />
                        <span className="text-xs font-medium truncate font-sans">
                          #{ch.slug}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#7E776F]">
                        {ch.memberCount}
                      </span>
                    </button>
                  );
                })}
            </div>

            {/* Quick user status */}
            {user && (
              <div className="pt-3 border-t border-[#2E2924] flex items-center gap-2">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
                <div className="truncate">
                  <div className="text-xs font-medium text-[#EDE6DD] truncate">{user.name}</div>
                  <div className="text-[10px] text-green-400 font-mono">● Online</div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Room */}
          <div className="lg:col-span-3 bg-[#1C1A17] border border-[#2E2924] rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Channel Top Bar */}
            <div className="p-4 bg-[#141210] border-b border-[#2E2924] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center font-mono font-bold text-xs">
                  #
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#EDE6DD]">
                    #{currentChannel?.name || activeChannelSlug}
                  </h2>
                  <p className="text-[11px] text-[#8A837A] truncate max-w-sm">
                    {currentChannel?.description}
                  </p>
                </div>
              </div>

              {/* Leave Channel button matching wireframe */}
              <button
                onClick={() => setLeaveModalOpen(true)}
                className="p-1.5 px-2.5 rounded-lg bg-[#241F1B] hover:bg-[#342D26] text-xs font-mono text-[#8A837A] hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Leave Room</span>
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {channelMessages && channelMessages.length === 0 && (
                <div className="p-12 text-center text-xs text-[#8A837A] space-y-2">
                  <Sparkles className="w-6 h-6 text-[#A3E635] mx-auto" />
                  <p>No messages yet in #{activeChannelSlug}. Share a thought or WIP card!</p>
                </div>
              )}

              {channelMessages &&
                channelMessages.map((msg) => {
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
                        <div className={`flex items-center gap-2 text-[10px] font-mono ${isMe ? "justify-end text-[#A3E635]" : "text-[#8A837A]"}`}>
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
                          {msg.text}

                          {/* Render Card Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {msg.attachments.map((att: any, aIdx: number) => (
                                <div
                                  key={aIdx}
                                  className="p-2 bg-black/40 rounded-xl border border-white/10 flex items-center gap-2"
                                >
                                  {att.url && (
                                    <img
                                      src={resolveMediaUrl(att.url)}
                                      alt="Attachment"
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                  )}
                                  <span className="text-[11px] truncate font-mono">
                                    {att.name || "Media"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#141210] border-t border-[#2E2924] flex items-center gap-2"
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message #${activeChannelSlug}...`}
                className="flex-1 bg-[#1C1A17] border border-[#2E2924] rounded-full px-4 py-2.5 text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="p-2.5 rounded-full bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] disabled:opacity-40 transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Leave Channel Modal */}
      <LeaveChannelModal
        isOpen={isLeaveModalOpen}
        channelName={currentChannel?.name || activeChannelSlug}
        onConfirm={handleConfirmLeave}
        onCancel={() => setLeaveModalOpen(false)}
      />
    </div>
  );
}
