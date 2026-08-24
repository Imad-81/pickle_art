"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Search, Plus, Compass, User, LogIn, ChevronDown, Sparkles, BookOpen, Layers, LogOut, MessageSquare } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function Navbar() {
  const { user, openAuthModal, switchPersona, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();

  const pendingRequestsCount = useQuery(
    api.messages.getPendingRequestCount,
    user ? { userId: user.id } : "skip"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#171512]/95 backdrop-blur-md border-b border-[#2E2924] px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#A3E635] to-[#4D7C0F] text-[#171512] font-serif font-bold text-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            p.
          </div>
          <span className="text-xl font-serif font-bold tracking-tight text-[#EDE6DD]">
            pickle<span className="text-[#A3E635]">.</span>
          </span>
        </Link>

        {/* Tagline / Subtitle (hidden on small screens) */}
        <span className="hidden md:inline-block text-xs font-mono text-[#8A837A] border-l border-[#2E2924] pl-4 py-1">
          process is progress
        </span>
      </div>

      {/* Global Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E776F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, #hashtag, discipline..."
            className="w-full bg-[#221E1A] hover:bg-[#28231E] focus:bg-[#1C1916] text-[#EDE6DD] placeholder-[#6E675F] text-xs font-sans rounded-full pl-10 pr-4 py-2 border border-[#342D26] focus:border-[#A3E635] focus:outline-none transition-all"
          />
        </div>
      </form>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Messages Hub Button with badge */}
        <Link
          href="/messages"
          className="relative p-2 rounded-full bg-[#241F1B] hover:bg-[#2D2722] border border-[#342D26] hover:border-[#A3E635] text-[#8A837A] hover:text-[#EDE6DD] transition-all"
          title="Studio Messages & DMs"
        >
          <MessageSquare className="w-4 h-4" />
          {(pendingRequestsCount ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#E08B3F] text-black">
              {pendingRequestsCount}
            </span>
          )}
        </Link>

        {/* Create Project Button */}
        <Link
          href="/project/create"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] text-xs font-semibold font-sans shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>

        {/* User / Persona Menu */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 bg-[#241F1B] hover:bg-[#2D2722] border border-[#342D26] rounded-full transition-all"
            >
              <span className="text-xs font-medium text-[#EDE6DD] hidden md:inline truncate max-w-[100px]">
                {user.name}
              </span>
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-[#A3E635]/40"
              />
              <ChevronDown className="w-3.5 h-3.5 text-[#7E776F] mr-1" />
            </button>

            {/* Dropdown */}
            {isProfileMenuOpen && (
              <div
                onMouseLeave={() => setProfileMenuOpen(false)}
                className="absolute right-0 mt-2 w-56 bg-[#1C1A17] border border-[#2E2924] rounded-xl shadow-2xl py-2 z-50 animate-fade-in"
              >
                <div className="px-3.5 py-2 border-b border-[#2E2924]">
                  <div className="text-xs font-medium text-[#EDE6DD]">{user.name}</div>
                  <div className="text-[10px] text-[#7E776F] font-mono">@{user.username}</div>
                  <div className="mt-1 text-[10px] text-[#A3E635] font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{user.growthPoints || 50} craft pts</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href={`/profile/${user.username}`}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#EDE6DD] hover:bg-[#2A2521] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#8A837A]" />
                    <span>View Profile & Trail</span>
                  </Link>
                  <Link
                    href="/messages?tab=dm"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center justify-between px-3.5 py-2 text-xs text-[#EDE6DD] hover:bg-[#2A2521] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#8A837A]" />
                      <span>Direct Messages</span>
                    </div>
                    {(pendingRequestsCount ?? 0) > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#E08B3F] text-black font-mono">
                        {pendingRequestsCount} req
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/messages?tab=feedback_notes"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#EDE6DD] hover:bg-[#2A2521] transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-[#8A837A]" />
                    <span>Feedback Notebook</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#A3E635] hover:bg-[#2A2521] transition-colors text-left"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Switch Test Persona</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#2E2924]">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-[#2A2521] transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2A2521] hover:bg-[#342E29] border border-[#3E3832] text-xs font-medium text-[#EDE6DD] rounded-full transition-all"
          >
            <LogIn className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
