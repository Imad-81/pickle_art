"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

export function FeedbackNotesView() {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState<"screen1" | "screen2">("screen2");
  const [filterStatus, setFilterStatus] = useState<"all" | "todo" | "addressed" | "dismissed">("all");

  const notes = useQuery(
    api.crits.getUserFeedbackNotes,
    user
      ? {
          userId: user.id,
          status: filterStatus === "all" ? undefined : filterStatus,
        }
      : "skip"
  );

  const updateStatusMutation = useMutation(api.crits.updateFeedbackNoteStatus);

  if (!user) {
    return (
      <div className="p-12 text-center bg-[#1C1A17] border border-[#2E2924] rounded-2xl max-w-md mx-auto my-12 space-y-4">
        <BookOpen className="w-10 h-10 text-[#E08B3F] mx-auto" />
        <h3 className="text-lg font-serif font-medium text-[#EDE6DD]">
          Personal Feedback Notebook
        </h3>
        <p className="text-xs text-[#8A837A]">
          Sign in or switch persona to review and manage actionable critiques saved from your projects.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fade-in px-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E08B3F]/20 text-[#E08B3F] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-[#EDE6DD]">
              Feedback Notes Repository
            </h1>
            <p className="text-xs text-[#8A837A] font-sans">
              Curated critique repository — turn peer insights into documented iterations.
            </p>
          </div>
        </div>

        {/* Screen Switcher matching wireframe */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141210] border border-[#2E2924] rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveScreen("screen1")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeScreen === "screen1"
                ? "bg-[#2A2521] text-[#E08B3F] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            Overview (Screen 1)
          </button>
          <button
            onClick={() => setActiveScreen("screen2")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeScreen === "screen2"
                ? "bg-[#2A2521] text-[#E08B3F] font-semibold border border-[#3E3832]"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            Checklist Table (Screen 2)
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border ${
            filterStatus === "all"
              ? "bg-[#E08B3F] text-[#171512] border-[#E08B3F] font-semibold"
              : "bg-[#1C1A17] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD]"
          }`}
        >
          All Saved Notes ({notes?.length || 0})
        </button>
        <button
          onClick={() => setFilterStatus("todo")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border ${
            filterStatus === "todo"
              ? "bg-amber-600 text-white border-amber-600 font-semibold"
              : "bg-[#1C1A17] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD]"
          }`}
        >
          To Action (Todo)
        </button>
        <button
          onClick={() => setFilterStatus("addressed")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border ${
            filterStatus === "addressed"
              ? "bg-green-700 text-white border-green-700 font-semibold"
              : "bg-[#1C1A17] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD]"
          }`}
        >
          Addressed / Iterated
        </button>
        <button
          onClick={() => setFilterStatus("dismissed")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border ${
            filterStatus === "dismissed"
              ? "bg-stone-700 text-white border-stone-700 font-semibold"
              : "bg-[#1C1A17] text-[#8A837A] border-[#2E2924] hover:text-[#EDE6DD]"
          }`}
        >
          Dismissed
        </button>
      </div>

      {/* SCREEN 2: Table / Split Checklist View (Matches Wireframe 20.50.50 (2) Screen 2) */}
      {activeScreen === "screen2" && (
        <div className="bg-[#1C1A17] border border-[#2E2924] rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2E2924] bg-[#141210] text-[11px] font-mono text-[#8A837A] uppercase">
                  <th className="py-3 px-4">Project & Stage</th>
                  <th className="py-3 px-4">Critique (What Worked / What to Try)</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2924] text-xs">
                {notes && notes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8A837A]">
                      No feedback notes in this category. Click "Save Note" on any critique to add it here.
                    </td>
                  </tr>
                )}
                {notes &&
                  notes.map((note) => {
                    return (
                      <tr
                        key={note._id}
                        className="hover:bg-[#221E1A]/70 transition-colors group"
                      >
                        {/* Project & Stage */}
                        <td className="py-4 px-4 align-top max-w-[200px]">
                          <div className="font-semibold text-[#EDE6DD] font-serif truncate">
                            {note.projectTitle}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#2A2521] text-[#E08B3F] border border-[#3E3832] uppercase">
                            {note.stage}
                          </span>
                        </td>

                        {/* Critique details */}
                        <td className="py-4 px-4 align-top max-w-md">
                          <div className="space-y-2">
                            <div className="text-[#A9F0D1] bg-[#141210] p-2 rounded-lg border border-[#26211D]">
                              <span className="font-mono text-[10px] uppercase text-[#8A9A86] block">
                                ✓ What worked:
                              </span>
                              <span className="font-serif leading-relaxed text-xs">
                                {note.whatWorked}
                              </span>
                            </div>
                            <div className="text-[#FFD0A1] bg-[#141210] p-2 rounded-lg border border-[#26211D]">
                              <span className="font-mono text-[10px] uppercase text-[#E08B3F] block">
                                → What to try next:
                              </span>
                              <span className="font-serif leading-relaxed text-xs">
                                {note.whatToTryNext}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="py-4 px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <img
                              src={note.authorAvatar}
                              alt={note.authorName}
                              className="w-6 h-6 rounded-full object-cover border border-[#3E3832]"
                            />
                            <span className="text-[#EDE6DD] text-xs">{note.authorName}</span>
                          </div>
                        </td>

                        {/* Status Pills */}
                        <td className="py-4 px-4 align-top text-center">
                          <select
                            value={note.actionableStatus}
                            onChange={(e) =>
                              updateStatusMutation({
                                noteId: note._id,
                                actionableStatus: e.target.value as any,
                              })
                            }
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono border focus:outline-none cursor-pointer ${
                              note.actionableStatus === "todo"
                                ? "bg-amber-950/50 text-amber-300 border-amber-800"
                                : note.actionableStatus === "addressed"
                                ? "bg-green-950/50 text-green-300 border-green-800"
                                : "bg-stone-900 text-stone-400 border-stone-700"
                            }`}
                          >
                            <option value="todo">⏳ To Action</option>
                            <option value="addressed">✓ Addressed</option>
                            <option value="dismissed">✕ Dismissed</option>
                          </select>
                        </td>

                        {/* Jump to Project */}
                        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                          <Link
                            href={`/project/${note.projectId}`}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#E08B3F] hover:underline"
                          >
                            <span>Open Project</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCREEN 1: Overview Grid of Cards (Matches Wireframe 20.50.50 (2) Screen 1) */}
      {activeScreen === "screen1" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {notes &&
            notes.map((note) => (
              <div
                key={note._id}
                className="p-5 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-3 shadow-xl hover:border-[#E08B3F]/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-[#2A2521] text-[#E08B3F] px-2 py-0.5 rounded">
                    {note.stage}
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      note.actionableStatus === "todo" ? "text-amber-400" : "text-green-400"
                    }`}
                  >
                    {note.actionableStatus === "todo" ? "● Pending Action" : "✓ Iterated"}
                  </span>
                </div>

                <h3 className="text-sm font-serif font-bold text-[#EDE6DD] truncate">
                  {note.projectTitle}
                </h3>

                <p className="text-xs font-serif text-[#EDE6DD]/80 line-clamp-3 leading-relaxed">
                  "{note.whatToTryNext}"
                </p>

                <div className="pt-2 border-t border-[#2E2924] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={note.authorAvatar}
                      alt={note.authorName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-[11px] text-[#8A837A]">{note.authorName}</span>
                  </div>
                  <Link
                    href={`/project/${note.projectId}`}
                    className="text-xs font-mono text-[#E08B3F] flex items-center gap-1 hover:underline"
                  >
                    <span>View Card</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
