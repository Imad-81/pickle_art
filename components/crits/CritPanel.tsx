"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  MessageSquare,
  Sparkles,
  Pin,
  Send,
  CheckCircle2,
  Tag,
  ThumbsUp,
  Filter,
} from "lucide-react";

const SKILL_BADGES = [
  "Color Balance",
  "Composition",
  "Typography",
  "Hierarchy",
  "Material Texture",
  "Narrative/Concept",
  "Execution",
  "Lighting",
];

export function CritPanel({
  projectId,
  projectTitle,
  currentStage = "stage1",
  subcardId,
}: {
  projectId: string;
  projectTitle: string;
  currentStage?: "overview" | "stage1" | "stage2" | "output";
  subcardId?: string;
}) {
  const { user, openAuthModal } = useAuth();
  const [filterStage, setFilterStage] = useState<"all" | "stage1" | "stage2" | "output">("all");
  const [targetStage, setTargetStage] = useState<"stage1" | "stage2" | "output">(
    currentStage === "overview" || !currentStage ? "stage1" : currentStage
  );

  useEffect(() => {
    if (currentStage && currentStage !== "overview") {
      setTargetStage(currentStage);
    }
  }, [currentStage]);

  // Query all project crits by default
  const allCrits = useQuery(api.crits.getCritsByStage, {
    projectId,
    subcardId,
  });

  const addCritMutation = useMutation(api.crits.addCrit);
  const togglePinMutation = useMutation(api.crits.togglePinCrit);
  const toggleSkillMutation = useMutation(api.crits.toggleSkillReaction);

  const [whatWorked, setWhatWorked] = useState("");
  const [whatToTryNext, setWhatToTryNext] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute counts
  const totalCount = allCrits?.length || 0;
  const stage1Count = allCrits?.filter((c) => c.targetStage === "stage1").length || 0;
  const stage2Count = allCrits?.filter((c) => c.targetStage === "stage2").length || 0;
  const outputCount = allCrits?.filter((c) => c.targetStage === "output").length || 0;

  // Filtered crits (defaults to showing ALL crits)
  const displayedCrits = filterStage === "all"
    ? allCrits
    : allCrits?.filter((c) => c.targetStage === filterStage);

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmitCrit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!whatWorked.trim() && !whatToTryNext.trim() && !generalComment.trim()) return;

    try {
      setIsSubmitting(true);
      await addCritMutation({
        projectId,
        authorId: user.id,
        authorName: user.name,
        authorUsername: user.username,
        authorAvatar: user.avatarUrl,
        targetStage: targetStage,
        targetSubcardId: subcardId,
        whatWorked: whatWorked.trim() || "Clear creative intent.",
        whatToTryNext: whatToTryNext.trim() || "Keep iterating on craft.",
        content: generalComment.trim() || undefined,
        skillReactions: selectedSkills,
      });

      setWhatWorked("");
      setWhatToTryNext("");
      setGeneralComment("");
      setSelectedSkills([]);
    } catch (err: any) {
      alert("Failed to submit crit: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "stage1":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#241F1B] text-[#A3E635] border border-[#3E3832]">
            Stage 1: Board
          </span>
        );
      case "stage2":
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#241F1B] text-[#A3E635] border border-[#3E3832]">
            Stage 2: Posts
          </span>
        );
      case "output":
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#241F1B] text-green-400 border border-[#3E3832]">
            Output: Final
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Header & Unified Crits View Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2924] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/20 text-[#A3E635] shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-semibold text-[#EDE6DD] flex items-center gap-2">
              <span>Crits & Constructive Feedback</span>
              <span className="text-xs font-mono text-[#A3E635] bg-[#A3E635]/10 border border-[#A3E635]/30 px-2 py-0.5 rounded-full font-semibold">
                {totalCount} total
              </span>
            </h3>
            <p className="text-xs text-[#7E776F] font-sans">
              Observations, reflections, and craft explorations across the project
            </p>
          </div>
        </div>

        {/* Quick Filter (Defaults to All Crits) */}
        <div className="flex items-center gap-1 bg-[#141210] p-1 border border-[#2E2924] rounded-xl self-start sm:self-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterStage("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              filterStage === "all"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            All Crits ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("stage1")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              filterStage === "stage1"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            Stage 1 ({stage1Count})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("stage2")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              filterStage === "stage2"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            Stage 2 ({stage2Count})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("output")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              filterStage === "output"
                ? "bg-[#2A2521] text-green-400 font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            Final ({outputCount})
          </button>
        </div>
      </div>

      {/* New Constructive Critique Form */}
      <form
        onSubmit={handleSubmitCrit}
        className="p-5 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-mono text-[#A3E635] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OFFER CONSTRUCTIVE CRAFT CRITIQUE</span>
          </div>

          {/* Stage Target Selector for new crit */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-[#8A837A] text-[11px]">Anchoring to:</span>
            <div className="flex items-center bg-[#141210] p-0.5 rounded-lg border border-[#2E2924]">
              <button
                type="button"
                onClick={() => setTargetStage("stage1")}
                className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                  targetStage === "stage1"
                    ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                    : "text-[#8A837A] hover:text-[#EDE6DD]"
                }`}
              >
                Stage 1
              </button>
              <button
                type="button"
                onClick={() => setTargetStage("stage2")}
                className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                  targetStage === "stage2"
                    ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                    : "text-[#8A837A] hover:text-[#EDE6DD]"
                }`}
              >
                Stage 2
              </button>
              <button
                type="button"
                onClick={() => setTargetStage("output")}
                className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                  targetStage === "output"
                    ? "bg-[#2A2521] text-green-400 font-semibold border border-[#3E3832]"
                    : "text-[#8A837A] hover:text-[#EDE6DD]"
                }`}
              >
                Final Output
              </button>
            </div>
          </div>
        </div>

        {/* Prompt 1 */}
        <div>
          <label className="block text-xs font-mono text-[#EDE6DD] mb-1">
            1. WHAT WORKED WELL (OBSERVATION OF CRAFT & DECISIONS)
          </label>
          <textarea
            value={whatWorked}
            onChange={(e) => setWhatWorked(e.target.value)}
            placeholder="e.g. The grain texture alignment across the joint highlights the natural ash timber..."
            rows={2}
            className="w-full px-3.5 py-2 bg-[#141210] border border-[#2E2924] rounded-lg text-xs font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
          />
        </div>

        {/* Prompt 2 */}
        <div>
          <label className="block text-xs font-mono text-[#EDE6DD] mb-1">
            2. WHAT TO TRY NEXT (SUGGESTION FOR EXPLORATION)
          </label>
          <textarea
            value={whatToTryNext}
            onChange={(e) => setWhatToTryNext(e.target.value)}
            placeholder="e.g. Try testing a 15% deeper chamfer to see if hand-feel improves on edge grasp..."
            rows={2}
            className="w-full px-3.5 py-2 bg-[#141210] border border-[#2E2924] rounded-lg text-xs font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
          />
        </div>

        {/* Skill-tagged Reaction Chips */}
        <div>
          <label className="block text-[11px] font-mono text-[#8A837A] mb-1.5">
            SKILL RECOGNITION (NO EMPTY LIKES — NAME THE CRAFT)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_BADGES.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => handleToggleSkill(skill)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all border ${
                    isSelected
                      ? "bg-[#386641] text-[#EDE6DD] border-[#386641] shadow-sm font-semibold"
                      : "bg-[#141210] text-[#8A837A] border-[#2E2924] hover:border-[#4E443A] hover:text-[#EDE6DD]"
                  }`}
                >
                  +{skill}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] font-semibold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Crit</span>
          </button>
        </div>
      </form>

      {/* List of Crits */}
      <div className="space-y-4">
        {displayedCrits && displayedCrits.length === 0 && (
          <div className="p-8 text-center bg-[#1C1A17] border border-dashed border-[#2E2924] rounded-2xl text-xs text-[#8A837A]">
            {filterStage === "all"
              ? "No critiques posted on this project yet. Be the first to offer constructive feedback!"
              : `No critiques anchored to ${filterStage === "stage1" ? "Stage 1" : filterStage === "stage2" ? "Stage 2" : "Final Output"} yet.`}
          </div>
        )}

        {displayedCrits &&
          displayedCrits.map((crit) => {
            return (
              <div
                key={crit._id}
                className={`p-5 bg-[#1C1A17] border rounded-2xl shadow-md space-y-3 transition-all ${
                  crit.isPinned ? "border-[#A3E635]/60 bg-[#1E1B17]" : "border-[#2E2924]"
                }`}
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={crit.authorAvatar}
                      alt={crit.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-[#3E3832]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#EDE6DD] flex items-center gap-2">
                        <span>{crit.authorName}</span>
                        {getStageBadge(crit.targetStage)}
                        {crit.isPinned && (
                          <span className="text-[10px] text-[#A3E635] font-mono flex items-center gap-0.5">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#7E776F] font-mono mt-0.5">
                        @{crit.authorUsername} ·{" "}
                        {new Date(crit.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePinMutation({ critId: crit._id as any })}
                      className="p-1.5 text-[#7E776F] hover:text-[#A3E635]"
                      title={crit.isPinned ? "Unpin crit" : "Pin crit"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* What Worked */}
                <div className="p-3 bg-[#141210] rounded-xl border border-[#26211D]">
                  <div className="text-[10px] font-mono text-[#8A9A86] uppercase mb-1">
                    ✓ What worked well
                  </div>
                  <p className="text-xs font-serif text-[#EDE6DD] leading-relaxed">
                    {crit.whatWorked}
                  </p>
                </div>

                {/* What to try next */}
                <div className="p-3 bg-[#141210] rounded-xl border border-[#26211D]">
                  <div className="text-[10px] font-mono text-[#A3E635] uppercase mb-1">
                    → What to try next
                  </div>
                  <p className="text-xs font-serif text-[#EDE6DD] leading-relaxed">
                    {crit.whatToTryNext}
                  </p>
                </div>

                {/* Skill Badges */}
                {crit.skillReactions && crit.skillReactions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {crit.skillReactions.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#386641]/20 text-[#A9F0D1] border border-[#386641]/40"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
