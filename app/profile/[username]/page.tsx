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
  MessageSquare,
  Hash,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const params = useParams();
  const rawUsername = (params?.username as string) || "aarohisen";
  const username = decodeURIComponent(rawUsername).replace(/^@/, "");
  const { user, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "complete">("all");

  const profileUser = useQuery(api.users.getByUsername, { username });
  const userProjects = useQuery(
    api.projects.getUserProjects,
    profileUser ? { userId: profileUser._id } : "skip"
  );
  const userChannels = useQuery(
    api.channels.getUserChannels,
    profileUser ? { userId: profileUser._id } : "skip"
  );
  const viewerChannels = useQuery(
    api.channels.getUserChannels,
    user ? { userId: user.id } : "skip"
  );
  const viewerChannelSlugs = new Set(viewerChannels?.map((c) => c.slug.toLowerCase()) || []);

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
              <div className="flex items-center gap-2.5">
                <Link
                  href={`/messages?user=${profileUser._id}`}
                  className="px-4 py-2.5 rounded-xl bg-[#241F1B] hover:bg-[#2D2722] border border-[#3E3832] hover:border-[#A3E635] text-xs font-semibold font-mono text-[#EDE6DD] flex items-center gap-2 transition-all shadow-md"
                >
                  <MessageSquare className="w-4 h-4 text-[#A3E635]" />
                  <span>Message</span>
                </Link>

                <button
                  onClick={handleToggleFollow}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all shadow-md ${
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
              </div>
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

      {/* CHANNELS SECTION (Matches Wireframe: Profile -> Channels -> Growth Trail -> Cards) */}
      <div className="p-6 sm:p-7 bg-[#1C1A17] border border-[#2E2924] rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#A3E635]" />
            <h2 className="text-base font-serif font-bold text-[#EDE6DD]">
              Channels
            </h2>
            {userChannels && (
              <span className="text-xs font-mono text-[#8A837A] bg-[#241F1B] border border-[#2E2924] px-2 py-0.5 rounded-full font-semibold">
                {userChannels.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[11px] text-[#8A837A] hidden sm:inline">
              ● Colored ring = Shared channel
            </span>
            <Link
              href="/messages?tab=channels"
              className="text-[#A3E635] hover:underline flex items-center gap-1"
            >
              <span>Explore All Rooms</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Circular Channel Stories with colored rings per wireframe */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {userChannels && userChannels.length > 0 ? (
            userChannels.map((ch) => {
              const isCommon = isMe || viewerChannelSlugs.has(ch.slug.toLowerCase());
              return (
                <Link
                  key={ch.slug}
                  href={`/messages?tab=channels&channel=${ch.slug}`}
                  className="flex flex-col items-center gap-2 group shrink-0"
                  title={`Enter #${ch.slug} channel`}
                >
                  {/* Circular channel avatar with colored ring */}
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full p-[2.5px] transition-all transform group-hover:scale-105 shadow-md ${
                      isCommon
                        ? "bg-gradient-to-tr from-[#A3E635] via-[#4ADE80] to-[#386641] ring-2 ring-[#A3E635]/40 shadow-[#A3E635]/20"
                        : "bg-[#2E2924] group-hover:bg-[#4E443A]"
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-[#141210] p-1 flex flex-col items-center justify-center relative overflow-hidden">
                      {ch.coverImage ? (
                        <img
                          src={ch.coverImage}
                          alt={ch.name}
                          className="w-full h-full rounded-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center font-bold text-xs font-mono text-[#171512]"
                          style={{ backgroundColor: ch.colorCode || "#A3E635" }}
                        >
                          #{ch.slug[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center max-w-[86px]">
                    <div className="text-xs font-sans font-medium text-[#EDE6DD] group-hover:text-[#A3E635] truncate transition-colors">
                      {ch.name}
                    </div>
                    <div className="text-[10px] font-mono text-[#7E776F] truncate">
                      {isCommon ? "Shared room" : `${ch.memberCount} makers`}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-xs text-[#8A837A] font-mono py-2">
              No channels joined yet.
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
