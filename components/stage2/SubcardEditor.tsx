"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { uploadMedia } from "@/lib/uploader";
import { resolveMediaUrl } from "@/lib/media";
import {
  Plus,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  Vote,
  Upload,
  Loader2,
} from "lucide-react";

export function SubcardEditor({
  projectId,
  isEditable = true,
  onNavigateToOutput,
  onSwitchToBoard,
}: {
  projectId: string;
  isEditable?: boolean;
  onNavigateToOutput?: () => void;
  onSwitchToBoard?: () => void;
}) {
  const { user } = useAuth();
  const subcards = useQuery(api.stage2.getSubcardsByProject, { projectId });
  const createSubcardMutation = useMutation(api.stage2.createSubcard);
  const deleteSubcardMutation = useMutation(api.stage2.deleteSubcard);
  const votePollMutation = useMutation(api.stage2.votePoll);

  // New subcard form state
  const [isAddingSubcard, setIsAddingSubcard] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Poll builder in new subcard
  const [enablePoll, setEnablePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOption1, setPollOption1] = useState("");
  const [pollOption2, setPollOption2] = useState("");
  const [pollOption3, setPollOption3] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateSubcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsUploading(true);
      const mediaUrls: Array<{ url: string; type: "image" | "video" | "audio"; caption?: string }> = [];

      for (const f of newFiles) {
        const res = await uploadMedia(f, { folder: `projects/${projectId}/stage2` });
        mediaUrls.push({
          url: res.url,
          type: res.type === "video" ? "video" : res.type === "audio" ? "audio" : "image",
          caption: f.name,
        });
      }

      let pollData = undefined;
      if (enablePoll && pollQuestion.trim() && pollOption1.trim() && pollOption2.trim()) {
        const options = [
          { id: "opt_1", text: pollOption1.trim(), voters: [] },
          { id: "opt_2", text: pollOption2.trim(), voters: [] },
        ];
        if (pollOption3.trim()) {
          options.push({ id: "opt_3", text: pollOption3.trim(), voters: [] });
        }
        pollData = {
          question: pollQuestion.trim(),
          isOpen: true,
          options,
        };
      }

      await createSubcardMutation({
        projectId,
        title: newTitle.trim(),
        processNotes: newNotes.trim(),
        mediaUrls,
        poll: pollData,
      });

      // Reset
      setNewTitle("");
      setNewNotes("");
      setNewFiles([]);
      setEnablePoll(false);
      setPollQuestion("");
      setPollOption1("");
      setPollOption2("");
      setPollOption3("");
      setIsAddingSubcard(false);
    } catch (err: any) {
      console.error(err);
      alert("Failed to create iteration post: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVote = async (subcardId: string, optionId: string) => {
    if (!user) {
      alert("Please sign in or select a demo persona to vote!");
      return;
    }
    await votePollMutation({
      subcardId: subcardId as any,
      optionId,
      userId: user.id,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#1C1A17] border border-[#2E2924] rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#A3E635] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>STAGE 2: DEVELOPMENT & EXPERIMENTS</span>
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
            Iteration Posts & Decisions
          </h2>
          <p className="text-xs text-[#8A837A] mt-0.5 font-sans">
            Step through mockups, test runs, and open community decision polls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onSwitchToBoard && (
            <button
              onClick={onSwitchToBoard}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#241F1B] hover:bg-[#2F2923] border border-[#3E3832] text-xs font-mono text-[#EDE6DD] rounded-xl transition-colors"
            >
              <span>Stitch Board 🎨</span>
            </button>
          )}
          {isEditable && (
            <button
              onClick={() => setIsAddingSubcard(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] font-semibold text-xs rounded-xl transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Experiment</span>
            </button>
          )}
          {onNavigateToOutput && (
            <button
              onClick={onNavigateToOutput}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2A2521] hover:bg-[#342E29] border border-[#3E3832] text-xs font-medium text-[#EDE6DD] rounded-xl transition-colors"
            >
              <span>Output</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Add New Experiment Subcard Form */}
      {isAddingSubcard && (
        <form
          onSubmit={handleCreateSubcard}
          className="p-6 bg-[#1C1A17] border border-[#A3E635]/50 rounded-2xl space-y-4 animate-fade-in shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#EDE6DD] font-mono">
              NEW EXPERIMENT POST / SUB-CARD
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingSubcard(false)}
              className="text-xs text-[#8A837A] hover:text-[#EDE6DD]"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              EXPERIMENT TITLE
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Iteration 02 — Laser Cut Crease & Score Tests"
              required
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              PROCESS NOTES (WHY THIS ITERATION HAPPENED)
            </label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Describe what hypothesis you were testing, what failed, and what you learned..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#A3E635]"
            />
          </div>

          {/* Media Attachments */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              MEDIA ATTACHMENTS
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border border-dashed border-[#342D26] hover:border-[#A3E635] rounded-xl bg-[#141210] text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
              <Upload className="w-5 h-5 text-[#A3E635] mx-auto mb-1" />
              <span className="text-xs text-[#EDE6DD]">
                {newFiles.length > 0
                  ? `${newFiles.length} file(s) selected`
                  : "Click to upload iteration sketches, photos, or clips"}
              </span>
            </div>
          </div>

          {/* Community Poll Toggle */}
          <div className="pt-2 border-t border-[#2E2924]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-[#EDE6DD]">
              <input
                type="checkbox"
                checked={enablePoll}
                onChange={(e) => setEnablePoll(e.target.checked)}
                className="rounded accent-[#A3E635]"
              />
              <span>Open a Community Decision Poll for this experiment</span>
            </label>

            {enablePoll && (
              <div className="mt-3 space-y-2 p-3.5 bg-[#141210] rounded-xl border border-[#2E2924]">
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Decision question (e.g. Which bevel angle fits best?)"
                  className="w-full px-3 py-2 bg-[#1C1A17] border border-[#342D26] rounded-lg text-xs text-[#EDE6DD] focus:outline-none focus:border-[#A3E635]"
                />
                <input
                  type="text"
                  value={pollOption1}
                  onChange={(e) => setPollOption1(e.target.value)}
                  placeholder="Option 1"
                  className="w-full px-3 py-1.5 bg-[#1C1A17] border border-[#342D26] rounded-lg text-xs text-[#EDE6DD]"
                />
                <input
                  type="text"
                  value={pollOption2}
                  onChange={(e) => setPollOption2(e.target.value)}
                  placeholder="Option 2"
                  className="w-full px-3 py-1.5 bg-[#1C1A17] border border-[#342D26] rounded-lg text-xs text-[#EDE6DD]"
                />
                <input
                  type="text"
                  value={pollOption3}
                  onChange={(e) => setPollOption3(e.target.value)}
                  placeholder="Option 3 (Optional)"
                  className="w-full px-3 py-1.5 bg-[#1C1A17] border border-[#342D26] rounded-lg text-xs text-[#EDE6DD]"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingSubcard(false)}
              className="px-4 py-2 bg-[#241F1B] text-xs font-medium rounded-xl text-[#EDE6DD]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] font-semibold text-xs rounded-xl flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Post Experiment</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* List of Sub-cards / Experiment Posts */}
      <div className="space-y-6">
        {subcards && subcards.length === 0 && !isAddingSubcard && (
          <div className="p-12 text-center bg-[#1C1A17] border border-dashed border-[#2E2924] rounded-2xl">
            <Sparkles className="w-8 h-8 text-[#A3E635] mx-auto mb-3" />
            <h3 className="text-base font-serif font-medium text-[#EDE6DD]">
              No Experiments Documented Yet
            </h3>
            <p className="text-xs text-[#8A837A] max-w-md mx-auto mt-1 mb-4">
              Stage 2 is where false starts, material tests, and design iterations live.
            </p>
            {isEditable && (
              <button
                onClick={() => setIsAddingSubcard(true)}
                className="px-4 py-2 bg-[#A3E635] text-[#171512] font-semibold text-xs rounded-xl"
              >
                Add First Experiment Post
              </button>
            )}
          </div>
        )}

        {subcards &&
          subcards.map((card, idx) => {
            return (
              <div
                key={card._id}
                className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-xl space-y-4 transition-all hover:border-[#3D3630]"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#A3E635]/20 text-[#A3E635] font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-serif font-semibold text-[#EDE6DD]">
                      {card.title}
                    </h3>
                  </div>

                  {isEditable && (
                    <button
                      onClick={() => deleteSubcardMutation({ subcardId: card._id as any })}
                      className="p-1.5 text-[#7E776F] hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Process Notes (in warm literary serif) */}
                {card.processNotes && (
                  <p className="text-sm font-serif text-[#EDE6DD]/90 leading-relaxed bg-[#141210] p-4 rounded-xl border border-[#26211D]">
                    {card.processNotes}
                  </p>
                )}

                {/* Media Gallery */}
                {card.mediaUrls && card.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {card.mediaUrls.map((media, mIdx) => (
                      <div
                        key={mIdx}
                        className="rounded-xl overflow-hidden bg-[#141210] border border-[#2E2924]"
                      >
                        {media.type === "image" && (
                          <img
                            src={resolveMediaUrl(media.url)}
                            alt={media.caption || "Experiment media"}
                            className="w-full h-56 object-cover"
                          />
                        )}
                        {media.type === "video" && (
                          <video src={resolveMediaUrl(media.url)} controls className="w-full h-56 object-cover" />
                        )}
                        {media.caption && (
                          <div className="p-2 text-[11px] font-mono text-[#8A837A] bg-[#171512]">
                            {media.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Community Poll / Decision */}
                {card.poll && card.poll.options && (
                  <div className="mt-4 p-4 bg-[#241F1B] rounded-xl border border-[#3E3832] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#A3E635]">
                      <Vote className="w-4 h-4" />
                      <span className="font-semibold">COMMUNITY DECISION POLL</span>
                    </div>
                    <div className="text-sm font-serif text-[#EDE6DD] font-medium">
                      "{card.poll.question}"
                    </div>

                    <div className="space-y-2 pt-1">
                      {card.poll.options.map((opt) => {
                        const totalVotes = card.poll!.options.reduce(
                          (acc, o) => acc + o.voters.length,
                          0
                        );
                        const optVotes = opt.voters.length;
                        const percentage =
                          totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                        const hasVoted = user && opt.voters.includes(user.id);

                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleVote(card._id, opt.id)}
                            className={`w-full relative overflow-hidden text-left p-3 rounded-lg border transition-all ${
                              hasVoted
                                ? "border-[#A3E635] bg-[#A3E635]/10 text-[#EDE6DD]"
                                : "border-[#342D26] bg-[#1C1A17] hover:border-[#4E443A] text-[#9E978E]"
                            }`}
                          >
                            {/* Percentage Bar */}
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-[#A3E635]/20 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />

                            <div className="relative flex items-center justify-between z-10 text-xs">
                              <span className="font-medium text-[#EDE6DD] flex items-center gap-2">
                                {hasVoted && <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" />}
                                {opt.text}
                              </span>
                              <span className="font-mono text-[#A3E635] font-semibold">
                                {percentage}% ({optVotes})
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
