"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Search, Compass, Sparkles, Filter, Tag, X } from "lucide-react";

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialChannel = searchParams.get("channel") || "";

  const [queryText, setQueryText] = useState(initialQuery);
  const [selectedChannel, setSelectedChannel] = useState(initialChannel);
  const [selectedTag, setSelectedTag] = useState("");

  const searchResults = useQuery(api.recommendations.searchExplore, {
    query: queryText,
    selectedChannel: selectedChannel || undefined,
    selectedTag: selectedTag || undefined,
  });

  const channels = useQuery(api.channels.listChannels, {});
  const allTags = useQuery(api.recommendations.getAllTags, {});

  const handleClearFilters = () => {
    setQueryText("");
    setSelectedChannel("");
    setSelectedTag("");
  };

  const hasFilters = !!queryText || !!selectedChannel || !!selectedTag;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#E08B3F]">
          <Compass className="w-4 h-4" />
          <span>DISCOVER & SEARCH</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#EDE6DD]">
          Explore Creative Craft & Disciplines
        </h1>
        <p className="text-xs text-[#8A837A] font-sans max-w-xl">
          Search behind-the-scenes experiments, tactile prototypes, and published suites across all channels.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7E776F]" />
        <input
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="Search by keywords (e.g. unboxing, joinery, botanical, kraft)..."
          className="w-full bg-[#1C1A17] border border-[#2E2924] focus:border-[#E08B3F] text-sm text-[#EDE6DD] placeholder-[#6E675F] rounded-2xl pl-12 pr-10 py-3.5 focus:outline-none shadow-xl transition-all"
        />
        {queryText && (
          <button
            onClick={() => setQueryText("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[#7E776F] hover:text-[#EDE6DD]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Channel Filters Bar */}
      {channels && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-[#8A837A] uppercase">
            FILTER BY DISCIPLINE
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedChannel("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border shrink-0 ${
                !selectedChannel
                  ? "bg-[#E08B3F] text-[#171512] border-[#E08B3F] font-semibold"
                  : "bg-[#1C1A17] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD]"
              }`}
            >
              All Channels
            </button>
            {channels.map((ch) => {
              const isSelected = selectedChannel.toLowerCase() === ch.slug.toLowerCase();
              return (
                <button
                  key={ch.slug}
                  onClick={() => setSelectedChannel(isSelected ? "" : ch.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border shrink-0 ${
                    isSelected
                      ? "bg-[#2A2521] text-[#E08B3F] border-[#E08B3F] font-semibold"
                      : "bg-[#1C1A17] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD]"
                  }`}
                >
                  #{ch.slug}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hashtags Cloud */}
      {allTags && allTags.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-mono text-[#8A837A] uppercase">
            POPULAR PROCESS HASHTAGS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSelected ? "" : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                    isSelected
                      ? "bg-[#386641] text-[#EDE6DD] border-[#386641] font-semibold"
                      : "bg-[#141210] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active filters pill */}
      {hasFilters && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs font-mono text-[#8A837A]">Active Filters:</span>
          {queryText && (
            <span className="px-2.5 py-0.5 rounded-md bg-[#241F1B] border border-[#3E3832] text-xs font-mono text-[#EDE6DD]">
              "{queryText}"
            </span>
          )}
          {selectedChannel && (
            <span className="px-2.5 py-0.5 rounded-md bg-[#241F1B] border border-[#3E3832] text-xs font-mono text-[#E08B3F]">
              Channel: #{selectedChannel}
            </span>
          )}
          {selectedTag && (
            <span className="px-2.5 py-0.5 rounded-md bg-[#241F1B] border border-[#3E3832] text-xs font-mono text-[#A9F0D1]">
              Tag: {selectedTag}
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-xs font-mono text-red-400 hover:underline ml-2"
          >
            Reset
          </button>
        </div>
      )}

      {/* Results Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-semibold text-[#EDE6DD]">
            Matching Projects ({searchResults?.length || 0})
          </h2>
        </div>

        {searchResults && searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {searchResults.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-3">
            <Sparkles className="w-8 h-8 text-[#E08B3F] mx-auto" />
            <h3 className="text-base font-serif font-medium text-[#EDE6DD]">
              No Projects Found Matching Search Criteria
            </h3>
            <p className="text-xs text-[#8A837A]">
              Try searching with broader keywords or browse all discipline channels above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs font-mono text-[#8A837A]">Loading Discover...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
