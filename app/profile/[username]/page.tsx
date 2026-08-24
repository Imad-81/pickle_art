"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { GrowthTrailChart } from "@/components/profile/GrowthTrailChart";
import { ProjectCard } from "@/components/projects/ProjectCard";
import {
  User,
  Sparkles,
  Layers,
  CheckCircle2,
  Bookmark,
  UserPlus,
  UserCheck,
  Award,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const params = useParams();
  const username = (params.username as string) || "aarohisen";
  const { user, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "complete">("all");

  const profileUser = useQuery(api.users.getByUsername, { username });
  const userProjects = useQuery(
    api.projects.getUserProjects,
    profileUser ? { userId: profileUser._id } : "skip"
  );

  const isFollowing = useQuery(
    api.follows.isFollowing,
    user && profileUser
      ? {
          followerId: user.id,
          followingId: profileUser._id,
        }
      : "skip"
  );
  const toggleFollowMutation = useMutation(api.follows.toggleFollow);

  if (!profileUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs font-mono text-[#8A837A]">
        Loading creator profile...
      </div>
    );
  }

  const isMe = user?.id === profileUser._id || user?.username === profileUser.username;

  const handleToggleFollow = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    await toggleFollowMutation({
      followerId: user.id,
      followingId: profileUser._id,
    });
  };

  const filteredProjects = userProjects?.filter((p) => {
    if (activeTab === "in_progress") return p.status === "in_progress";
    if (activeTab === "complete") return p.status === "complete";
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
      {/* Top Profile Header */}
      <div className="p-6 sm:p-8 bg-[#1C1A17] border border-[#2E2924] rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Creator Details */}
          <div className="flex items-center gap-5">
            <img
              src={profileUser.avatarUrl}
              alt={profileUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[#A3E635] shadow-xl"
            />
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#EDE6DD]">
                {profileUser.name}
              </h1>
              <div className="text-xs font-mono text-[#8A837A]">
                @{profileUser.username}
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#A3E635]/20 text-[#A3E635] border border-[#A3E635]/40 font-semibold">
                  {profileUser.growthPoints || 50} craft pts
                </span>
              </div>
            </div>
          </div>

          {/* Follow / Edit Profile */}
          <div>
            {!isMe ? (
              <button
                onClick={handleToggleFollow}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all shadow-md ${
                  isFollowing
                    ? "bg-[#241F1B] text-[#8A837A] border border-[#3E3832]"
                    : "bg-[#A3E635] text-[#171512] hover:bg-[#65A30D]"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-green-400" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow Creator</span>
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/project/create"
                className="px-5 py-2.5 bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] font-semibold text-xs rounded-xl shadow-md transition-all inline-block"
              >
                + New Project
              </Link>
            )}
          </div>
        </div>

        {/* Bio & Disciplines */}
        <div className="pt-2 border-t border-[#2E2924] space-y-3">
          {profileUser.bio && (
            <p className="text-sm font-serif text-[#EDE6DD]/90 max-w-2xl leading-relaxed">
              "{profileUser.bio}"
            </p>
          )}

          {profileUser.disciplines && (
            <div className="flex flex-wrap gap-1.5">
              {profileUser.disciplines.map((d: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#141210] border border-[#2E2924] rounded-full text-xs font-mono text-[#8A837A]"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Growth Trail Milestone Chart (Celebrating Progress, not likes) */}
      <GrowthTrailChart
        growthPoints={profileUser.growthPoints || 540}
        username={profileUser.username}
      />

      {/* Portfolio Tabs & Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2924] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === "all"
                  ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                  : "text-[#8A837A] hover:text-[#EDE6DD]"
              }`}
            >
              All Projects ({userProjects?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("in_progress")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === "in_progress"
                  ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                  : "text-[#8A837A] hover:text-[#EDE6DD]"
              }`}
            >
              In Progress WIPs
            </button>
            <button
              onClick={() => setActiveTab("complete")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === "complete"
                  ? "bg-[#2A2521] text-[#A3E635] font-semibold border border-[#3E3832]"
                  : "text-[#8A837A] hover:text-[#EDE6DD]"
              }`}
            >
              Complete Releases
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects && filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#1C1A17] border border-dashed border-[#2E2924] rounded-2xl text-xs text-[#8A837A]">
            No projects in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}
