"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { HighlightBar } from "@/components/highlights/HighlightBar";
import { ProjectCard } from "@/components/projects/ProjectCard";
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
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"following" | "discover">("discover");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  const feeds = useQuery(api.recommendations.getHomepageFeeds, {
    currentUserId: user?.id,
  });

  const channels = useQuery(api.channels.listChannels, {});

  const tags = ["all", "packaging", "illustration", "typography", "industrial", "motion", "architecture"];

  return (
    <div className="min-h-screen bg-[#171512] text-[#EDE6DD] space-y-6">
      {/* 1. 24-Hour Highlights (Instagram-Style Stories) Bar */}
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
                  ? "bg-[#E08B3F] text-[#171512] font-semibold shadow-md"
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
                  ? "bg-[#E08B3F] text-[#171512] font-semibold shadow-md"
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
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all border shrink-0 ${
                  selectedTag === t
                    ? "bg-[#2A2521] text-[#E08B3F] border-[#E08B3F] font-semibold"
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

            {feeds?.followingFeed && feeds.followingFeed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {feeds.followingFeed.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            ) : (
              <div className="p-16 text-center bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4">
                <Users className="w-10 h-10 text-[#E08B3F] mx-auto" />
                <h3 className="text-base font-serif font-medium text-[#EDE6DD]">
                  No Updates from Followed Creators Yet
                </h3>
                <p className="text-xs text-[#8A837A] max-w-sm mx-auto">
                  Follow craftspeople on the Discover tab to build your custom, quiet inspiration stream.
                </p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="px-4 py-2 bg-[#E08B3F] text-[#171512] font-semibold text-xs rounded-xl"
                >
                  Explore Creators
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB B: DISCOVER STREAM */}
        {activeTab === "discover" && (
          <div className="space-y-12 animate-fade-in">
            {/* Stream 1: In Progress WIPs (Process First!) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8A9A86] animate-ping" />
                  <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
                    In Progress — Live Craft & Iteration
                  </h2>
                </div>
                <span className="text-xs font-mono text-[#8A9A86]">
                  {feeds?.inProgress?.length || 0} active logs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {feeds?.inProgress?.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </section>

            {/* Stream 2: Recommended For You (Hashtag & Engagement Affinity) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E08B3F]" />
                  <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
                    Recommended For Your Craft Interests
                  </h2>
                </div>
                <Link
                  href="/discover"
                  className="text-xs font-mono text-[#E08B3F] hover:underline flex items-center gap-1"
                >
                  <span>Explore all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {feeds?.recommendedForYou?.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </section>

            {/* Stream 3: Discipline Channels Bar */}
            {channels && channels.length > 0 && (
              <section className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-[#EDE6DD] uppercase tracking-wider">
                    Creative Discipline Channels
                  </h3>
                  <Link
                    href="/messages"
                    className="text-xs font-mono text-[#E08B3F] hover:underline"
                  >
                    Join Channel Chats →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {channels.map((ch) => (
                    <Link
                      key={ch.slug}
                      href={`/discover?channel=${ch.slug}`}
                      className="p-3 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] rounded-xl text-center transition-all group"
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-sm text-[#171512]"
                        style={{ backgroundColor: ch.colorCode }}
                      >
                        #{ch.slug[0].toUpperCase()}
                      </div>
                      <div className="text-xs font-semibold text-[#EDE6DD] group-hover:text-[#E08B3F] transition-colors truncate">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {feeds?.completeWork?.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
