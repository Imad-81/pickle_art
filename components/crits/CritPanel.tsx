"use client";

import React, { useState } from "react";
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
  currentStage,
  subcardId,
}: {
  projectId: string;
  projectTitle: string;
  currentStage: "stage1" | "stage2" | "output";
  subcardId?: string;
}) {
  const { user, openAuthModal } = useAuth();
  const crits = useQuery(api.crits.getCritsByStage, {
    projectId,
    stage: currentStage,
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
        targetStage: currentStage,
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


  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#A3E635]" />
          <h3 className="text-base font-serif font-semibold text-[#EDE6DD]">
            Stage-Pinned Crits & Feedback
          </h3>
        </div>
        <span className="text-xs font-mono text-[#8A837A]">
          {crits?.length || 0} constructive reflections
        </span>
      </div>

      {/* New Constructive Critique Form */}
      <form
        onSubmit={handleSubmitCrit}
        className="p-5 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4 shadow-xl"
      >
        <div className="text-xs font-mono text-[#A3E635] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OFFER CONSTRUCTIVE CRAFT CRITIQUE</span>
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

      {/* List of Stage Crits */}
      <div className="space-y-4">
        {crits && crits.length === 0 && (
          <div className="p-8 text-center bg-[#1C1A17] border border-dashed border-[#2E2924] rounded-2xl text-xs text-[#8A837A]">
            No critiques anchored to this stage yet. Be the first to offer constructive feedback!
          </div>
        )}

        {crits &&
          crits.map((crit) => {
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
                      <div className="text-xs font-semibold text-[#EDE6DD] flex items-center gap-1.5">
                        {crit.authorName}
                        {crit.isPinned && (
                          <span className="text-[10px] text-[#A3E635] font-mono flex items-center gap-0.5">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#7E776F] font-mono">
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
