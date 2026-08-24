"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Search, MessageSquare, Sparkles, UserCheck, ShieldCheck } from "lucide-react";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: {
    _id: string;
    name: string;
    username: string;
    avatarUrl: string;
  }) => void;
  currentUserId: string;
}

export function NewMessageModal({
  isOpen,
  onClose,
  onSelectUser,
  currentUserId,
}: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const creators = useQuery(api.messages.searchCreatorsForDM, {
    currentUserId,
    query: searchQuery,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-[#1C1A17] border border-[#2E2924] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2924] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#EDE6DD]">New Direct Message</h2>
              <p className="text-[11px] text-[#8A837A]">
                Start a 1-on-1 studio conversation with any creator.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#2A2521] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E776F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, @handle, discipline..."
            autoFocus
            className="w-full bg-[#141210] border border-[#2E2924] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
          />
        </div>

        {/* Info Note on DM Requests */}
        <div className="p-3 bg-[#141210] border border-[#2E2924] rounded-xl flex items-start gap-2 text-[11px] text-[#8A837A]">
          <ShieldCheck className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
          <p>
            If they don't follow you yet, your message will arrive as a DM request that they can preview and accept.
          </p>
        </div>

        {/* Creators List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px]">
          {creators === undefined ? (
            <div className="p-8 text-center text-xs font-mono text-[#8A837A]">
              Searching creators...
            </div>
          ) : creators.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8A837A] space-y-2">
              <Sparkles className="w-5 h-5 mx-auto text-[#A3E635]" />
              <p>No creators found matching "{searchQuery}".</p>
            </div>
          ) : (
            creators.map((c) => (
              <button
                key={c._id}
                onClick={() => {
                  onSelectUser({
                    _id: c._id,
                    name: c.name,
                    username: c.username,
                    avatarUrl: c.avatarUrl,
                  });
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] hover:border-[#A3E635]/40 rounded-2xl transition-all text-left group"
              >
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={c.avatarUrl}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#2E2924] shrink-0"
                  />
                  <div className="truncate space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#EDE6DD] group-hover:text-[#A3E635] truncate transition-colors">
                        {c.name}
                      </span>
                      {c.isFollowing && (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-green-400 bg-green-950/40 px-1.5 py-0.2 rounded border border-green-800/40">
                          <UserCheck className="w-2.5 h-2.5" /> Following
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#8A837A]">
                      @{c.username}
                    </div>
                    {c.bio && (
                      <p className="text-[11px] text-[#7E776F] truncate max-w-xs font-sans">
                        {c.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-3 py-1 bg-[#2A2521] group-hover:bg-[#A3E635] text-[#8A837A] group-hover:text-[#171512] rounded-lg text-[10px] font-mono font-semibold transition-all shrink-0 ml-2">
                  Message
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
