"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, DEMO_PERSONAS } from "@/components/providers/AuthProvider";
import { HighlightBar } from "@/components/highlights/HighlightBar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  Sparkles,
  Users,
  Compass,
  Flame,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  LogIn,
  Eye,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user, switchPersona, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<"following" | "discover">("discover");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [forceViewLanding, setForceViewLanding] = useState(false);

  const feeds = useQuery(api.recommendations.getHomepageFeeds, {
    currentUserId: user?.id,
  });

  const channels = useQuery(api.channels.listChannels, {});

  const tags = [
    "all",
    "packaging",
    "illustration",
    "typography",
    "industrial",
    "motion",
    "architecture",
    "kraft",
    "concept-art",
    "joinery",
  ];

  // If user is guest or explicitly requested to view landing page
  if (!user || forceViewLanding) {
    return (
      <div className="min-h-screen bg-[#171512] text-[#EDE6DD]">
        {/* Guest top switcher banner */}
        <div className="bg-[#1C1A17] border-b border-[#2E2924] px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-[#9E978E] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
              <span>Explore Pickle as a guest or select an instant test persona:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.username}
                  onClick={() => {
                    switchPersona(p.username);
                    setForceViewLanding(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] border border-[#3A342D] text-[11px] font-mono text-[#EDE6DD] hover:text-[#A3E635] transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <img src={p.avatarUrl} alt={p.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                  <span>@{p.username}</span>
                </button>
              ))}

              <Link
                href="/login"
                className="px-3 py-1 rounded-lg bg-[#A3E635] text-[#171512] text-xs font-semibold font-sans hover:bg-[#84CC16] transition-colors shrink-0"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <LandingHero />
      </div>
    );
  }

  // Filter projects by tag if not "all"
  const filterByTag = (items: any[] | undefined) => {
    if (!items) return [];
    if (selectedTag === "all") return items;
    const cleanTag = selectedTag.toLowerCase().replace(/^#/, "");
    return items.filter(
      (p) =>
        p.discipline.toLowerCase().includes(cleanTag) ||
        p.tags.some((t: string) => t.toLowerCase().replace(/^#/, "").includes(cleanTag))
    );
  };

  const filteredInProgress = filterByTag(feeds?.inProgress);
  const filteredRecommended = filterByTag(feeds?.recommendedForYou);
  const filteredComplete = filterByTag(feeds?.completeWork);
  const filteredFollowing = filterByTag(feeds?.followingFeed);

  return (
    <div className="min-h-screen bg-[#171512] text-[#EDE6DD] space-y-6 pb-36">
      {/* 1. 24-Hour Highlights (Stories) Bar */}
      <HighlightBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* 2. Feed Tab Switcher & Tag Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-[#2E2924] pb-4">
          {/* Main Feed Tabs */}
          <div className="flex items-center gap-2 p-1 bg-[#1C1A17] border border-[#2E2924] rounded-2xl">
            <button
              onClick={() => setActiveTab("discover")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-sans font-medium transition-all ${
                activeTab === "discover"
                  ? "bg-[#A3E635] text-[#171512] font-semibold shadow-md"
                  : "text-[#8A837A] hover:text-[#EDE6DD]"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Discover & Process</span>
            </button>

            <button
              onClick={() => setActiveTab("following")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-sans font-medium transition-all ${
                activeTab === "following"
                  ? "bg-[#A3E635] text-[#171512] font-semibold shadow-md"
                  : "text-[#8A837A] hover:text-[#EDE6DD]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Following Feed</span>
            </button>
          </div>

          {/* Hashtag Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all border shrink-0 ${
                  selectedTag === t
                    ? "bg-[#27221E] text-[#A3E635] border-[#A3E635] font-semibold shadow-sm"
                    : "bg-[#1C1A17] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD] hover:border-[#3E3832]"
                }`}
              >
                {t === "all" ? "All Disciplines" : `#${t}`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. TAB A: FOLLOWING FEED */}
        {activeTab === "following" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
                  Updates from Creators & Channels You Follow
                </h2>
                <p className="text-xs text-[#8A837A] font-sans mt-0.5">
                  Chronological development logs and fresh project drops.
                </p>
              </div>
            </div>

            {filteredFollowing && filteredFollowing.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredFollowing.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-[#1C1A17] border border-[#2E2924] rounded-3xl space-y-4">
                <Users className="w-10 h-10 text-[#A3E635] mx-auto" />
                <h3 className="text-base font-serif font-medium text-[#EDE6DD]">
                  No Updates from Followed Creators in #{selectedTag}
                </h3>
                <p className="text-xs text-[#8A837A] max-w-sm mx-auto">
                  Follow craftspeople on the Discover tab to build your custom, quiet inspiration stream.
                </p>
                <button
                  onClick={() => {
                    setSelectedTag("all");
                    setActiveTab("discover");
                  }}
                  className="px-5 py-2 bg-[#A3E635] text-[#171512] font-semibold text-xs rounded-xl"
                >
                  Explore Creators
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB B: DISCOVER STREAM */}
        {activeTab === "discover" && (
          <div className="space-y-14 animate-fade-in">
            {/* Stream 1: In Progress WIPs (Process First!) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8A9A86] animate-ping" />
                  <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
                    In Progress — Live Craft & Iteration
                  </h2>
                </div>
                <span className="text-xs font-mono text-[#8A9A86]">
                  {filteredInProgress.length} active logs
                </span>
              </div>

              {filteredInProgress.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredInProgress.map((project) => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-[#1C1A17] border border-[#2E2924] rounded-2xl text-xs text-[#8A837A]">
                  No active WIPs matching #{selectedTag}.
                </div>
              )}
            </section>

            {/* Stream 2: Recommended For You (Hashtag & Engagement Affinity) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A3E635]" />
                  <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
                    Recommended For Your Craft Interests
                  </h2>
                </div>
                <Link
                  href="/discover"
                  className="text-xs font-mono text-[#A3E635] hover:underline flex items-center gap-1"
                >
                  <span>Explore all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {filteredRecommended.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredRecommended.map((project) => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-[#1C1A17] border border-[#2E2924] rounded-2xl text-xs text-[#8A837A]">
                  No recommended projects matching #{selectedTag}.
                </div>
              )}
            </section>

            {/* Stream 3: Discipline Channels Bar */}
            {channels && channels.length > 0 && (
              <section className="p-6 sm:p-7 bg-[#1C1A17] border border-[#2E2924] rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-serif font-bold text-[#EDE6DD] uppercase tracking-wider">
                      Creative Discipline Rooms
                    </h3>
                    <p className="text-xs text-[#8A837A]">
                      Explore behind-the-scenes developments in dedicated rooms.
                    </p>
                  </div>
                  <Link
                    href="/messages?tab=channels"
                    className="text-xs font-mono text-[#A3E635] hover:underline"
                  >
                    Join Channel Chats →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
                  {channels.map((ch) => (
                    <Link
                      key={ch.slug}
                      href={`/discover?channel=${ch.slug}`}
                      className="p-3.5 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] hover:border-[#A3E635]/40 rounded-2xl text-center transition-all group shadow-md"
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-sm text-[#171512] shadow-sm group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: ch.colorCode }}
                      >
                        #{ch.slug[0].toUpperCase()}
                      </div>
                      <div className="text-xs font-semibold text-[#EDE6DD] group-hover:text-[#A3E635] transition-colors truncate">
                        {ch.name}
                      </div>
                      <div className="text-[10px] text-[#7E776F] font-mono mt-0.5">
                        {ch.memberCount} makers
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Stream 4: Completed Releases (Gated & Verified) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
                    Complete Work — Full Process Behind Each Piece
                  </h2>
                </div>
              </div>

              {filteredComplete.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredComplete.map((project) => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-[#1C1A17] border border-[#2E2924] rounded-2xl text-xs text-[#8A837A]">
                  No completed releases matching #{selectedTag}.
                </div>
              )}
            </section>

            {/* End of Stream / Extended Footer */}
            <section className="pt-10 border-t border-[#2E2924] text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#241F1B] border border-[#3E3832] text-[#A3E635] shadow-lg mb-1">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-serif font-bold text-[#EDE6DD]">
                  You've caught up with the latest drops
                </h3>
                <p className="text-xs text-[#8A837A] font-sans">
                  Pickle is designed for quiet focus. Ready to document your own project?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/project/create"
                  className="px-5 py-2.5 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  + Start New Project
                </Link>
                <button
                  onClick={() => setForceViewLanding(true)}
                  className="px-4 py-2.5 bg-[#241F1B] hover:bg-[#2E2822] text-[#8A837A] hover:text-[#EDE6DD] border border-[#3A342D] text-xs font-mono rounded-xl transition-colors"
                >
                  View Landing Page
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
