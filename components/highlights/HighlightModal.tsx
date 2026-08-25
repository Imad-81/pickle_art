"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { resolveMediaUrl } from "@/lib/media";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles, Send, Clock, ArrowUpRight, Play, Pause } from "lucide-react";

interface HighlightItem {
  _id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "audio";
  caption?: string;
  linkedProjectId?: string;
  linkedProjectTitle?: string;
  expiresAt: number;
  viewers: string[];
  createdAt: number;
}

interface CreatorHighlightGroup {
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  hasUnseen: boolean;
  items: HighlightItem[];
}

export function HighlightModal({
  groups,
  initialGroupIndex,
  onClose,
}: {
  groups: CreatorHighlightGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const markViewed = useMutation(api.highlights.markHighlightViewed);
  const sendDM = useMutation(api.channels.sendDirectMessage);

  const currentGroup = groups[groupIndex];
  const currentItem = currentGroup?.items[itemIndex];

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const DURATION_MS = 5000; // 5 seconds per story

  const handleNext = () => {
    if (!currentGroup) return;
    if (itemIndex < currentGroup.items.length - 1) {
      setItemIndex(itemIndex + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setItemIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setItemIndex(groups[groupIndex - 1].items.length - 1);
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in reply input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === "ArrowRight" || e.key === "n" || e.key === "N" || e.key === "l") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "p" || e.key === "P" || e.key === "h") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [groupIndex, itemIndex, groups, onClose]);

  // Mark viewed when item changes
  useEffect(() => {
    if (currentItem && user) {
      markViewed({
        highlightId: currentItem._id as any,
        userId: user.id,
      }).catch(console.error);
    }
  }, [currentItem, user, markViewed]);

  // Progress timer
  useEffect(() => {
    setProgress(0);
    if (!currentItem || isPaused) return;

    const interval = 50; // update every 50ms
    const step = (interval / DURATION_MS) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIndex, itemIndex, isPaused, currentItem]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user || !currentItem) return;

    try {
      setIsSendingReply(true);
      const conversationId = [user.id, currentItem.creatorId].sort().join("_");
      await sendDM({
        conversationId,
        senderId: user.id,
        senderName: user.name,
        senderAvatar: user.avatarUrl,
        receiverId: currentItem.creatorId,
        text: `Replying to 24h story: "${replyText.trim()}"`,
        attachments: [
          {
            type: "image",
            url: currentItem.mediaUrl,
            name: "Story snapshot",
          },
        ],
      });
      setReplyText("");
      alert("Sent crit reply to creator's DMs!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!currentGroup || !currentItem) return null;

  // Calculate remaining time
  const remainingHours = Math.max(
    1,
    Math.round((currentItem.expiresAt - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fade-in select-none">
      {/* Background close overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Story Container */}
      <div
        className="relative z-10 w-full max-w-sm sm:max-w-md h-[88vh] max-h-[780px] bg-[#171512] rounded-3xl overflow-hidden border border-[#3A342D] shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Header & Segmented Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/85 via-black/45 to-transparent">
          {/* Segmented Progress Bars */}
          <div className="flex gap-1.5 mb-3">
            {currentGroup.items.map((it, idx) => {
              let fill = 0;
              if (idx < itemIndex) fill = 100;
              else if (idx === itemIndex) fill = progress;

              return (
                <div key={it._id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#A3E635] transition-all duration-75"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Creator Profile & Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentGroup.creatorAvatar}
                alt={currentGroup.creatorName}
                className="w-9 h-9 rounded-full object-cover border-2 border-[#A3E635]"
              />
              <div>
                <div className="text-xs font-semibold text-[#EDE6DD] flex items-center gap-1.5">
                  {currentGroup.creatorName}
                  <span className="text-[10px] text-[#A3E635] font-mono flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {remainingHours}h left
                  </span>
                </div>
                <div className="text-[10px] text-[#9E978E] font-mono">
                  {new Date(currentItem.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Play / Pause Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className="p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                title={isPaused ? "Play (Space)" : "Pause (Space)"}
              >
                {isPaused ? <Play className="w-4 h-4 text-[#A3E635]" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                title="Mute/Unmute (M)"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative w-full h-full flex items-center justify-center bg-[#12100E] overflow-hidden">
          {currentItem.mediaType === "image" && (
            <img
              src={resolveMediaUrl(currentItem.mediaUrl)}
              alt="Story Media"
              className="w-full h-full object-contain"
            />
          )}

          {currentItem.mediaType === "video" && (
            <video
              src={resolveMediaUrl(currentItem.mediaUrl)}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              className="w-full h-full object-contain"
            />
          )}

          {currentItem.mediaType === "audio" && (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center bg-gradient-to-br from-[#241F1B] to-[#171512] w-full h-full">
              <div className="w-20 h-20 rounded-full bg-[#A3E635]/20 flex items-center justify-center text-[#A3E635] animate-pulse">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="text-sm font-serif italic text-[#EDE6DD]">Audio Process Thought</div>
              <audio src={resolveMediaUrl(currentItem.mediaUrl)} autoPlay muted={isMuted} controls className="w-64" />
            </div>
          )}

          {/* Navigation Tap Zones */}
          <div
            className="absolute left-0 top-16 bottom-24 w-1/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="absolute right-0 top-16 bottom-24 w-1/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* Bottom Caption & Reply Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          {/* Linked project chip */}
          {currentItem.linkedProjectTitle && currentItem.linkedProjectId && (
            <Link
              href={`/project/${currentItem.linkedProjectId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A3E635]/20 hover:bg-[#A3E635]/30 border border-[#A3E635]/40 text-[#A3E635] text-xs font-mono rounded-full mb-2.5 transition-colors"
            >
              <span>Attached: {currentItem.linkedProjectTitle}</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          )}

          {/* Caption */}
          {currentItem.caption && (
            <p className="text-xs sm:text-sm font-serif text-[#EDE6DD] line-clamp-3 mb-3 leading-relaxed drop-shadow-md">
              "{currentItem.caption}"
            </p>
          )}

          {/* Quick Crit / Reply to DM */}
          <form
            onSubmit={handleSendReply}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Send constructive crit or note..."
              className="flex-1 bg-black/60 border border-[#3E3832] rounded-full px-4 py-2 text-xs text-[#EDE6DD] placeholder-[#7E776F] focus:outline-none focus:border-[#A3E635]"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSendingReply}
              className="p-2 rounded-full bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* External Arrow Buttons for Desktop */}
      <button
        onClick={handlePrev}
        className="hidden md:flex absolute left-8 p-3 rounded-full bg-[#241F1B]/80 text-[#EDE6DD] hover:bg-[#2A2521] border border-[#342D26] transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-8 p-3 rounded-full bg-[#241F1B]/80 text-[#EDE6DD] hover:bg-[#2A2521] border border-[#342D26] transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
