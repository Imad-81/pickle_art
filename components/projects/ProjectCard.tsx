"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Sparkles,
  MessageSquare,
  Bookmark,
  Clock,
  CheckCircle,
  Eye,
  UserPlus,
  UserCheck,
} from "lucide-react";

export function ProjectCard({ project }: { project: any }) {
  const { user, openAuthModal } = useAuth();
  const isFollowing = useQuery(
    api.follows.isFollowing,
    user
      ? {
          followerId: user.id,
          followingId: project.creatorId,
        }
      : "skip"
  );
  const toggleFollowMutation = useMutation(api.follows.toggleFollow);
  const recordInteractionMutation = useMutation(api.projects.recordInteraction);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    await toggleFollowMutation({
      followerId: user.id,
      followingId: project.creatorId,
    });
  };

  const handleCardClick = () => {
    if (user) {
      recordInteractionMutation({
        userId: user.id,
        projectId: project._id,
        type: "view",
        durationSeconds: 5,
      }).catch(console.error);
    }
  };

  // Stage calculation
  const s1 = project.stage1Completed;
  const s2 = project.stage2Completed;
  const s3 = project.status === "complete" || project.outputPublished;

  return (
    <Link
      href={`/project/${project._id}`}
      onClick={handleCardClick}
      className="group flex flex-col bg-[#1C1A17] border border-[#2E2924] hover:border-[#E08B3F]/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Cover Media */}
      <div className="relative w-full aspect-[4/3] bg-[#141210] overflow-hidden">
        <img
          src={project.coverUrl}
          alt={project.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Discipline & WIP Status badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-mono text-[#EDE6DD] border border-white/10 uppercase font-semibold">
            {project.discipline}
          </span>
          {project.status === "in_progress" && (
            <span className="px-2 py-0.5 bg-[#8A9A86]/90 backdrop-blur-md rounded-full text-[10px] font-mono text-[#171512] font-bold">
              WIP
            </span>
          )}
        </div>

        {/* Stage Progress Pills (Bottom of cover image) */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
          <div className="flex-1 flex items-center justify-center gap-1 text-[9px] font-mono">
            <span className={s1 ? "text-[#E08B3F] font-bold" : "text-[#7E776F]"}>S1</span>
            {s1 ? <CheckCircle className="w-2.5 h-2.5 text-[#E08B3F]" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#3E3832]" />}
          </div>
          <div className="w-[1px] h-3 bg-white/20" />
          <div className="flex-1 flex items-center justify-center gap-1 text-[9px] font-mono">
            <span className={s2 ? "text-[#E08B3F] font-bold" : "text-[#7E776F]"}>S2</span>
            {s2 ? <CheckCircle className="w-2.5 h-2.5 text-[#E08B3F]" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#3E3832]" />}
          </div>
          <div className="w-[1px] h-3 bg-white/20" />
          <div className="flex-1 flex items-center justify-center gap-1 text-[9px] font-mono">
            <span className={s3 ? "text-green-400 font-bold" : "text-[#7E776F]"}>Final</span>
            {s3 ? <CheckCircle className="w-2.5 h-2.5 text-green-400" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#3E3832]" />}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Creator row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img
                src={project.creatorAvatar}
                alt={project.creatorName}
                className="w-6 h-6 rounded-full object-cover border border-[#3E3832]"
              />
              <span className="text-xs font-sans text-[#EDE6DD] font-medium truncate max-w-[130px]">
                {project.creatorName}
              </span>
            </div>

            {/* Follow button */}
            {user && user.id !== project.creatorId && (
              <button
                onClick={handleToggleFollow}
                className={`p-1 px-2 rounded-full text-[10px] font-mono flex items-center gap-1 transition-all ${
                  isFollowing
                    ? "bg-[#241F1B] text-[#8A837A] border border-[#3E3832]"
                    : "bg-[#E08B3F]/20 text-[#E08B3F] hover:bg-[#E08B3F]/30 border border-[#E08B3F]/40"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3 h-3 text-green-400" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Title & Description */}
          <h3 className="text-base font-serif font-semibold text-[#EDE6DD] group-hover:text-[#E08B3F] transition-colors leading-snug line-clamp-1">
            {project.title}
          </h3>
          <p className="text-xs text-[#8A837A] font-sans line-clamp-2 mt-1 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Tags & Craft metrics */}
        <div className="pt-2 border-t border-[#2E2924] flex items-center justify-between text-[11px] font-mono text-[#7E776F]">
          <div className="flex items-center gap-1.5 truncate max-w-[170px]">
            {project.tags.slice(0, 2).map((t: string, idx: number) => (
              <span key={idx} className="text-[#8A837A]">
                {t.startsWith("#") ? t : `#${t}`}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[#EDE6DD]">
              <MessageSquare className="w-3 h-3 text-[#E08B3F]" />
              {project.stats?.critsCount || 0}
            </span>
            <span className="flex items-center gap-1 text-[#8A837A]">
              <Eye className="w-3 h-3" />
              {project.stats?.views || 1}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
