"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { resolveMediaUrl } from "@/lib/media";
import { StitchCanvas } from "@/components/stage1/StitchCanvas";
import { Stage2View } from "@/components/stage2/Stage2View";
import { FinalOutputView } from "@/components/output/FinalOutputView";
import { CritPanel } from "@/components/crits/CritPanel";
import {
  Sparkles,
  Layers,
  CheckCircle,
  Clock,
  MessageSquare,
  Bookmark,
  Share2,
  UserPlus,
  UserCheck,
  ChevronLeft,
  Settings,
  Eye,
} from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user, openAuthModal } = useAuth();

  const [activeStage, setActiveStage] = useState<"overview" | "stage1" | "stage2" | "output">("overview");
  const critSectionRef = useRef<HTMLDivElement>(null);

  const scrollToCrits = () => {
    critSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const project = useQuery(api.projects.getProjectById, {
    projectId: projectId as any,
  });

  const isFollowing = useQuery(
    api.follows.isFollowing,
    user && project
      ? {
          followerId: user.id,
          followingId: project.creatorId,
        }
      : "skip"
  );
  const toggleFollowMutation = useMutation(api.follows.toggleFollow);
  const recordInteractionMutation = useMutation(api.projects.recordInteraction);

  // Track dwell time beacon
  useEffect(() => {
    if (!project || !user) return;
    const startTime = Date.now();

    return () => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds > 3) {
        recordInteractionMutation({
          userId: user.id,
          projectId: project._id,
          type: "dwell",
          durationSeconds,
        }).catch(console.error);
      }
    };
  }, [project, user, recordInteractionMutation]);

  if (!project) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-[#8A837A] font-mono text-xs">
        Loading creative project...
      </div>
    );
  }

  const isOwner = user?.id === project.creatorId;

  const handleToggleFollow = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    await toggleFollowMutation({
      followerId: user.id,
      followingId: project.creatorId,
    });
  };

  return (
    <div className="min-h-screen bg-[#171512] text-[#EDE6DD]">
      {/* Project Top Navigation Bar */}
      <div className="sticky top-14 sm:top-16 z-30 w-full bg-[#1A1815]/95 backdrop-blur-md border-b border-[#2E2924] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Back & Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#EDE6DD] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="truncate max-w-[200px] sm:max-w-md">
            <h1 className="text-sm font-serif font-bold text-[#EDE6DD] truncate">
              {project.title}
            </h1>
            <div className="text-[10px] font-mono text-[#8A837A]">
              by @{project.creatorUsername} · {project.discipline}
            </div>
          </div>
        </div>

        {/* Stage Tabs (Wireframe Navigation) */}
        <div className="flex items-center gap-1 p-1 bg-[#141210] border border-[#2E2924] rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveStage("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              activeStage === "overview"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveStage("stage1")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              activeStage === "stage1"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <span>Stage 1: Board</span>
            {project.stage1Completed && <CheckCircle className="w-3 h-3 text-[#A3E635]" />}
          </button>
          <button
            onClick={() => setActiveStage("stage2")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              activeStage === "stage2"
                ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <span>Stage 2: Board & Posts</span>
            {project.stage2Completed && <CheckCircle className="w-3 h-3 text-[#A3E635]" />}
          </button>
          <button
            onClick={() => setActiveStage("output")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 ${
              activeStage === "output"
                ? "bg-[#2A2521] text-green-400 font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <span>Output: Final</span>
            {project.outputPublished && <CheckCircle className="w-3 h-3 text-green-400" />}
          </button>
        </div>

        {/* Crit Scroll Action */}
        <button
          onClick={scrollToCrits}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#3E3832] bg-[#241F1B] text-[#EDE6DD] hover:border-[#A3E635] hover:text-[#A3E635] text-xs font-mono transition-all shrink-0 active:scale-95 cursor-pointer shadow-sm group"
          title="Scroll to Crits"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#A3E635] group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Crits ({project.stats?.critsCount || 0})</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* TAB 1: OVERVIEW */}
        {activeStage === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left Col: Hero Image & Stages Summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl overflow-hidden bg-[#1C1A17] border border-[#2E2924] shadow-2xl">
                <img
                  src={resolveMediaUrl(project.coverUrl)}
                  alt={project.title}
                  className="w-full h-auto max-h-[480px] object-cover"
                />
              </div>

              <div className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4">
                <h2 className="text-xl font-serif font-bold text-[#EDE6DD]">Project Premise & Intent</h2>
                <p className="text-sm font-serif text-[#EDE6DD]/90 leading-relaxed">
                  {project.description}
                </p>

                {project.goals && (
                  <div className="p-4 bg-[#141210] rounded-xl border border-[#26211D] space-y-1">
                    <div className="text-xs font-mono text-[#A3E635]">CREATIVE GOALS & THESIS</div>
                    <p className="text-xs font-serif text-[#EDE6DD]/80 leading-relaxed">
                      {project.goals}
                    </p>
                  </div>
                )}
              </div>

              {/* Stage Progression Banner */}
              <div className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono text-[#8A837A] uppercase">
                    Three-Stage Craft Lifecycle
                  </h3>
                  <span className="text-xs font-mono text-[#A3E635]">
                    {project.status === "complete" ? "Published Release" : "In Active Iteration"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveStage("stage1")}
                    className="p-4 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[#A3E635]">Stage 1</span>
                      {project.stage1Completed && <CheckCircle className="w-4 h-4 text-[#A3E635]" />}
                    </div>
                    <div className="text-sm font-serif font-semibold text-[#EDE6DD] group-hover:text-[#A3E635]">
                      Research Board
                    </div>
                    <p className="text-[11px] text-[#7E776F] mt-1">
                      Infinite Stitch canvas with references & sketches.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveStage("stage2")}
                    className="p-4 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[#A3E635]">Stage 2</span>
                      {project.stage2Completed && <CheckCircle className="w-4 h-4 text-[#A3E635]" />}
                    </div>
                    <div className="text-sm font-serif font-semibold text-[#EDE6DD] group-hover:text-[#A3E635]">
                      Board & Posts
                    </div>
                    <p className="text-[11px] text-[#7E776F] mt-1">
                      Infinite Stitch canvas + experiment logs & polls.
                    </p>
                  </button>

                  <button
                    onClick={() => setActiveStage("output")}
                    className="p-4 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-green-400">Final</span>
                      {project.outputPublished && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </div>
                    <div className="text-sm font-serif font-semibold text-[#EDE6DD] group-hover:text-green-400">
                      Output Release
                    </div>
                    <p className="text-[11px] text-[#7E776F] mt-1">
                      Final presentation & asset package.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Creator Profile & Tools & Tags */}
            <div className="space-y-6">
              {/* Creator Card */}
              <div className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={project.creatorAvatar}
                    alt={project.creatorName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#A3E635]"
                  />
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#EDE6DD]">
                      {project.creatorName}
                    </h3>
                    <div className="text-xs font-mono text-[#7E776F]">
                      @{project.creatorUsername}
                    </div>
                    <Link
                      href={`/profile/${project.creatorUsername}`}
                      className="text-xs font-mono text-[#A3E635] hover:underline block mt-0.5"
                    >
                      View Growth Trail →
                    </Link>
                  </div>
                </div>

                {/* Follow Button */}
                {user && user.id !== project.creatorId && (
                  <button
                    onClick={handleToggleFollow}
                    className={`w-full py-2 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-all ${
                      isFollowing
                        ? "bg-[#241F1B] text-[#8A837A] border border-[#3E3832]"
                        : "bg-[#A3E635] text-[#171512] hover:bg-[#65A30D]"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-green-400" />
                        <span>Following Creator</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow Creator</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Tools & Discipline */}
              <div className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4 shadow-xl">
                <div>
                  <div className="text-xs font-mono text-[#8A837A] mb-2 uppercase">DISCIPLINE</div>
                  <span className="px-3 py-1 bg-[#241F1B] border border-[#3E3832] rounded-full text-xs font-mono text-[#EDE6DD]">
                    {project.discipline}
                  </span>
                </div>

                {project.tools && project.tools.length > 0 && (
                  <div>
                    <div className="text-xs font-mono text-[#8A837A] mb-2 uppercase">
                      TOOLS & MEDIUMS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tools.map((tool: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-[#141210] border border-[#26211D] rounded-lg text-xs font-mono text-[#EDE6DD]"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {project.tags && project.tags.length > 0 && (
                  <div>
                    <div className="text-xs font-mono text-[#8A837A] mb-2 uppercase">
                      INTEREST HASHTAGS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag: string, idx: number) => (
                        <Link
                          key={idx}
                          href={`/discover?q=${encodeURIComponent(tag)}`}
                          className="px-2.5 py-1 bg-[#241F1B] hover:bg-[#2E2924] border border-[#3E3832] rounded-full text-xs font-mono text-[#A3E635] transition-colors"
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAGE 1 (Google Stitch Moodboard) */}
        {activeStage === "stage1" && (
          <div className="animate-fade-in">
            <StitchCanvas
              projectId={project._id}
              isEditable={isOwner}
              onNavigateToStage2={() => setActiveStage("stage2")}
            />
          </div>
        )}

        {/* TAB 3: STAGE 2 (Stitch Board & Sub-cards/Experiments) */}
        {activeStage === "stage2" && (
          <div className="animate-fade-in">
            <Stage2View
              projectId={project._id}
              isEditable={isOwner}
              onNavigateToOutput={() => setActiveStage("output")}
            />
          </div>
        )}

        {/* TAB 4: STAGE 3 (Gated Final Output) */}
        {activeStage === "output" && (
          <div className="animate-fade-in">
            <FinalOutputView
              project={project}
              isOwner={isOwner}
              onNavigateToStage1={() => setActiveStage("stage1")}
              onNavigateToStage2={() => setActiveStage("stage2")}
            />
          </div>
        )}

        {/* Stage-Pinned Crits Section (Always Visible by Default) */}
        <div ref={critSectionRef} id="crits-section" className="mt-12 border-t border-[#2E2924] pt-8 scroll-mt-24">
          <CritPanel
            projectId={project._id}
            projectTitle={project.title}
            currentStage={
              activeStage === "stage1"
                ? "stage1"
                : activeStage === "stage2"
                ? "stage2"
                : activeStage === "output"
                ? "output"
                : "stage1"
            }
          />
        </div>
      </div>
    </div>
  );
}
