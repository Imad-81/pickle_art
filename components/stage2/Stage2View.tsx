"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StitchCanvas } from "@/components/stage1/StitchCanvas";
import { SubcardEditor } from "@/components/stage2/SubcardEditor";
import { Sparkles, LayoutGrid, FileText, Layers } from "lucide-react";

export function Stage2View({
  projectId,
  isEditable = true,
  onNavigateToOutput,
}: {
  projectId: string;
  isEditable?: boolean;
  onNavigateToOutput?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"board" | "posts">("board");

  const canvasItems = useQuery(api.stage2.getCanvasItemsByProject, { projectId });
  const subcards = useQuery(api.stage2.getSubcardsByProject, { projectId });

  const canvasCount = canvasItems?.length || 0;
  const subcardCount = subcards?.length || 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stage 2 Segmented Control Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#A3E635] animate-pulse" />
          <span className="text-xs font-mono font-bold text-[#EDE6DD] uppercase tracking-wider">
            Stage 2: Development Hub
          </span>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#141210] border border-[#2E2924] rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("board")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
              activeTab === "board"
                ? "bg-[#2A2521] text-[#A3E635] font-bold border border-[#3E3832] shadow-sm"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Stitch Board</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "board"
                  ? "bg-[#A3E635]/20 text-[#A3E635]"
                  : "bg-[#241F1B] text-[#7E776F]"
              }`}
            >
              {canvasCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${
              activeTab === "posts"
                ? "bg-[#2A2521] text-[#A3E635] font-bold border border-[#3E3832] shadow-sm"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Iteration Posts</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "posts"
                  ? "bg-[#A3E635]/20 text-[#A3E635]"
                  : "bg-[#241F1B] text-[#7E776F]"
              }`}
            >
              {subcardCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mode 1: Stage 2 Stitch Canvas (Infinite Spatial Board) */}
      {activeTab === "board" && (
        <div className="animate-fade-in">
          <StitchCanvas
            projectId={projectId}
            stage="stage2"
            isEditable={isEditable}
            onNavigateToOutput={onNavigateToOutput}
            onSwitchToPosts={() => setActiveTab("posts")}
          />
        </div>
      )}

      {/* Mode 2: Stage 2 Iteration Posts & Polls (Step-by-step experiment logs) */}
      {activeTab === "posts" && (
        <div className="animate-fade-in">
          <SubcardEditor
            projectId={projectId}
            isEditable={isEditable}
            onNavigateToOutput={onNavigateToOutput}
            onSwitchToBoard={() => setActiveTab("board")}
          />
        </div>
      )}
    </div>
  );
}
