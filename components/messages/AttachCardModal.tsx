"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { resolveMediaUrl } from "@/lib/media";
import { X, Layers, Search, Check, Sparkles } from "lucide-react";

interface AttachCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: {
    id: string;
    title: string;
    coverUrl: string;
    discipline: string;
  }) => void;
  userId: string;
}

export function AttachCardModal({
  isOpen,
  onClose,
  onSelectProject,
  userId,
}: AttachCardModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const userProjects = useQuery(api.projects.getUserProjects, { userId });
  const allProjects = useQuery(api.projects.listProjects, {});

  if (!isOpen) return null;

  const displayedProjects = searchQuery.trim()
    ? (allProjects || []).filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.discipline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : userProjects && userProjects.length > 0
    ? userProjects
    : allProjects || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#1C1A17] border border-[#2E2924] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2924] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#EDE6DD]">
                Share Project or WIP Card
              </h2>
              <p className="text-[11px] text-[#8A837A]">
                Attach a project to share your process directly in this DM.
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E776F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by title or discipline..."
            className="w-full bg-[#141210] border border-[#2E2924] rounded-xl pl-10 pr-4 py-2 text-xs text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
          />
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px]">
          {displayedProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8A837A] space-y-2">
              <Sparkles className="w-5 h-5 mx-auto text-[#A3E635]" />
              <p>No projects found. Create a project to share its process!</p>
            </div>
          ) : (
            displayedProjects.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  onSelectProject({
                    id: p._id,
                    title: p.title,
                    coverUrl: p.coverUrl,
                    discipline: p.discipline,
                  });
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] hover:border-[#A3E635]/40 rounded-2xl transition-all text-left group"
              >
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={resolveMediaUrl(p.coverUrl)}
                    alt={p.title}
                    className="w-12 h-12 rounded-xl object-cover border border-[#2E2924] shrink-0"
                  />
                  <div className="truncate space-y-1">
                    <div className="text-xs font-semibold text-[#EDE6DD] group-hover:text-[#A3E635] truncate transition-colors">
                      {p.title}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#8A837A]">
                      <span>{p.discipline}</span>
                      <span>•</span>
                      <span
                        className={
                          p.status === "complete" ? "text-green-400" : "text-[#E08B3F]"
                        }
                      >
                        {p.status === "complete" ? "Complete" : "WIP"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1 bg-[#2A2521] group-hover:bg-[#A3E635] text-[#8A837A] group-hover:text-[#171512] rounded-lg text-[10px] font-mono font-semibold transition-all shrink-0">
                  Select
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
