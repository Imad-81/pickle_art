"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { HighlightModal } from "./HighlightModal";
import { CreateHighlightModal } from "./CreateHighlightModal";
import { Plus, Sparkles } from "lucide-react";

export function HighlightBar() {
  const { user, openAuthModal } = useAuth();
  const highlightGroups = useQuery(api.highlights.getActiveHighlights, {
    currentUserId: user?.id,
  });

  const [activeStoryGroupIndex, setActiveStoryGroupIndex] = useState<number | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleOpenCreate = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    setCreateModalOpen(true);
  };

  return (
    <section className="w-full py-4 border-b border-[#2E2924] bg-[#1A1815]/50 overflow-hidden">
      <div className="flex items-center gap-4 overflow-x-auto px-4 sm:px-6 no-scrollbar">
        {/* 1. Creator's Own "+ Share 24h WIP" bubble */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            onClick={handleOpenCreate}
            className="relative group p-0.5 rounded-full focus:outline-none"
          >
            <div className="w-16 h-16 rounded-full bg-[#241F1B] border-2 border-dashed border-[#E08B3F]/60 group-hover:border-[#E08B3F] flex items-center justify-center transition-all group-hover:scale-105">
              {user ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-14 h-14 rounded-full object-cover opacity-80 group-hover:opacity-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#1C1A17] flex items-center justify-center text-[#E08B3F]">
                  <Sparkles className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Plus badge */}
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#E08B3F] text-[#171512] flex items-center justify-center font-bold shadow-md border-2 border-[#171512]">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </button>
          <span className="text-[11px] font-sans font-medium text-[#EDE6DD] max-w-[68px] truncate text-center">
            Your 24h WIP
          </span>
        </div>

        {/* 2. Active Stories from other Creators */}
        {highlightGroups &&
          highlightGroups.map((group, index) => {
            const hasUnseen = group.hasUnseen;
            return (
              <div key={group.creatorId} className="flex flex-col items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setActiveStoryGroupIndex(index)}
                  className="relative group p-0.5 rounded-full focus:outline-none transition-transform hover:scale-105 active:scale-95"
                >
                  {/* Glowing Animated Ring */}
                  <div
                    className={`w-16 h-16 rounded-full p-[2.5px] ${
                      hasUnseen
                        ? "bg-gradient-to-tr from-[#E08B3F] via-[#C97B84] to-[#386641] shadow-lg shadow-[#E08B3F]/20 animate-pulse"
                        : "bg-[#3D3630]"
                    }`}
                  >
                    <img
                      src={group.creatorAvatar}
                      alt={group.creatorName}
                      className="w-full h-full rounded-full object-cover bg-[#171512] border-2 border-[#171512]"
                    />
                  </div>

                  {/* 24h Pill */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-[#171512] border border-[#E08B3F]/50 rounded-full text-[9px] font-mono text-[#E08B3F] tracking-tighter">
                    24h
                  </div>
                </button>

                <span className="text-[11px] font-sans text-[#EDE6DD] max-w-[68px] truncate text-center font-medium">
                  {group.creatorName.split(" ")[0]}
                </span>
              </div>
            );
          })}
      </div>

      {/* Fullscreen Story Viewer Modal */}
      {activeStoryGroupIndex !== null && highlightGroups && (
        <HighlightModal
          groups={highlightGroups as any}
          initialGroupIndex={activeStoryGroupIndex}
          onClose={() => setActiveStoryGroupIndex(null)}
        />
      )}

      {/* Create Story Modal */}
      <CreateHighlightModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </section>
  );
}
