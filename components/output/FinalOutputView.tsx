"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { uploadMedia } from "@/lib/uploader";
import {
  AlertCircle,
  Sparkles,
  ArrowRight,
  Upload,
  Download,
  FileText,
  CheckCircle,
  Eye,
  Camera,
  Layers,
  Loader2,
} from "lucide-react";

export function FinalOutputView({
  project,
  isOwner = false,
  onNavigateToStage1,
  onNavigateToStage2,
}: {
  project: any;
  isOwner?: boolean;
  onNavigateToStage1?: () => void;
  onNavigateToStage2?: () => void;
}) {
  const finalOutput = useQuery(api.output.getOutputByProject, {
    projectId: project._id,
  });
  const saveOutputMutation = useMutation(api.output.saveFinalOutput);
  const updateProjectMutation = useMutation(api.projects.updateProject);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [behindTheScenes, setBehindTheScenes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. GATED REJECTION SCREEN (Matches Wireframe Exactly)
  const isGated =
    !project.isExemptPhotography &&
    (!project.stage1Completed || !project.stage2Completed);

  if (isGated) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-14 bg-[#1C1A17] border border-[#3E292E] rounded-2xl max-w-xl mx-auto text-center space-y-6 animate-fade-in shadow-2xl my-6">
        {/* Wireframe Pink/Rose Alert Badge */}
        <div className="w-16 h-16 rounded-full bg-[#C97B84]/20 border border-[#C97B84]/50 flex items-center justify-center text-[#C97B84] shadow-lg shadow-[#C97B84]/10">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-[#EDE6DD]">
            Can't upload file. Error.
          </h2>
          <p className="text-sm font-sans text-[#C97B84] mt-1 font-medium">
            Stage 1 or Stage 2 or both are incomplete.
          </p>
          <p className="text-xs text-[#8A837A] mt-2 max-w-md mx-auto leading-relaxed">
            Pickle is designed for process over polish. Document your research canvas in Stage 1 and iterations in Stage 2 to unlock your final output showcase.
          </p>
        </div>

        {/* Action Buttons from Wireframe */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {onNavigateToStage1 && (
            <button
              onClick={onNavigateToStage1}
              className="px-6 py-2.5 bg-[#2A2521] hover:bg-[#342E29] border border-[#3E3832] text-[#EDE6DD] text-xs font-semibold rounded-xl transition-all"
            >
              Go to Step 1 (Moodboard)
            </button>
          )}
          {onNavigateToStage2 && (
            <button
              onClick={onNavigateToStage2}
              className="px-6 py-2.5 bg-[#C97B84] hover:bg-[#B56A73] text-[#171512] text-xs font-semibold rounded-xl transition-all shadow-md"
            >
              Go to Step 2 (Experiments)
            </button>
          )}
        </div>

        {/* Photography Exemption Toggle */}
        {isOwner && (
          <div className="pt-4 border-t border-[#2E2924] w-full">
            <button
              onClick={() =>
                updateProjectMutation({
                  projectId: project._id,
                  isExemptPhotography: true,
                })
              }
              className="inline-flex items-center gap-2 text-xs font-mono text-[#8A837A] hover:text-[#E08B3F] transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Enable Single-Shot / Photography Exemption</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. UNLOCKED STATE: Published Output Showcase or Upload Form
  const handleSaveOutput = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsPublishing(true);

      const mediaUrls: any[] = [];
      const fileAttachments: any[] = [];

      for (const f of files) {
        const res = await uploadMedia(f, { folder: `projects/${project._id}/output` });
        if (res.type === "image" || res.type === "video") {
          mediaUrls.push({ url: res.url, type: res.type, caption: f.name });
        } else {
          fileAttachments.push({
            name: f.name,
            url: res.url,
            sizeBytes: res.size,
            type: f.type,
          });
        }
      }

      await saveOutputMutation({
        projectId: project._id,
        title: title || project.title + " — Final Showcase",
        summary: summary || project.description,
        behindTheScenes: behindTheScenes || "Completed with iterative stages.",
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : [{ url: project.coverUrl, type: "image" }],
        fileAttachments,
        publishNow: true,
      });

      setIsEditing(false);
    } catch (err: any) {
      alert("Failed to save final output: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#1C1A17] border border-[#2E2924] rounded-2xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#E08B3F] mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span>STAGE 3: FINAL OUTPUT & RELEASE</span>
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#EDE6DD]">
            Final Presentation & Assets
          </h2>
          <p className="text-xs text-[#8A837A] mt-0.5 font-sans">
            The finished craft backed by the full transparent development process.
          </p>
        </div>

        {isOwner && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E08B3F] hover:bg-[#CA782F] text-[#171512] font-semibold text-xs rounded-xl shadow-md"
          >
            <Upload className="w-4 h-4" />
            <span>{finalOutput ? "Update Showcase" : "Upload Final Output"}</span>
          </button>
        )}
      </div>

      {/* Editing / Uploading Form */}
      {isEditing && isOwner && (
        <form
          onSubmit={handleSaveOutput}
          className="p-6 bg-[#1C1A17] border border-[#E08B3F]/50 rounded-2xl space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#EDE6DD] font-mono">
              UPLOAD FINAL PRESENTATION
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-[#8A837A] hover:text-[#EDE6DD]"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              FINAL TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={project.title + " — Final Release"}
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              PROJECT SUMMARY
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Comprehensive summary of the final craft..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              BEHIND THE SCENES NARRATIVE
            </label>
            <textarea
              value={behindTheScenes}
              onChange={(e) => setBehindTheScenes(e.target.value)}
              placeholder="Reflections on what this project taught you, what trade-offs you made..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              FINAL RENDERS & DOWNLOADABLE ASSETS
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border border-dashed border-[#342D26] hover:border-[#E08B3F] rounded-xl bg-[#141210] text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.zip"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-[#E08B3F] mx-auto mb-2" />
              <span className="text-xs text-[#EDE6DD] block">
                {files.length > 0
                  ? `${files.length} file(s) ready to upload`
                  : "Drop final high-res renders, posters, videos, or design packages"}
              </span>
              <span className="text-[10px] text-[#7E776F] font-mono mt-1 block">
                ⚡ Automatically compressed in browser before S3 storage
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-[#241F1B] text-xs font-medium rounded-xl text-[#EDE6DD]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className="px-6 py-2 bg-[#E08B3F] hover:bg-[#CA782F] text-[#171512] font-semibold text-xs rounded-xl flex items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Final Output</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Published Output Showcase */}
      {finalOutput ? (
        <div className="p-6 sm:p-8 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#EDE6DD]">
              {finalOutput.title}
            </h1>
            <p className="text-sm font-serif text-[#EDE6DD]/90 leading-relaxed">
              {finalOutput.summary}
            </p>
          </div>

          {/* Media Presentation */}
          {finalOutput.mediaUrls && finalOutput.mediaUrls.length > 0 && (
            <div className="space-y-4">
              {finalOutput.mediaUrls.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden bg-[#141210] border border-[#2E2924] shadow-xl"
                >
                  {m.type === "image" && (
                    <img
                      src={m.url}
                      alt={m.caption || "Final output"}
                      className="w-full h-auto max-h-[640px] object-contain"
                    />
                  )}
                  {m.type === "video" && (
                    <video src={m.url} controls className="w-full h-auto max-h-[640px]" />
                  )}
                  {m.caption && (
                    <div className="p-3 bg-[#171512] text-xs font-mono text-[#8A837A]">
                      {m.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Behind the scenes narration */}
          {finalOutput.behindTheScenes && (
            <div className="p-5 bg-[#241F1B] rounded-xl border border-[#342D26] space-y-2">
              <div className="text-xs font-mono text-[#E08B3F] font-semibold">
                BEHIND THE SCENES & REFLECTIONS
              </div>
              <p className="text-sm font-serif text-[#EDE6DD]/90 leading-relaxed italic">
                "{finalOutput.behindTheScenes}"
              </p>
            </div>
          )}

          {/* Downloadable Assets */}
          {finalOutput.fileAttachments && finalOutput.fileAttachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono text-[#9E978E]">ATTACHED ASSETS & FILES</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {finalOutput.fileAttachments.map((f: any, idx: number) => (
                  <a
                    key={idx}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 bg-[#141210] hover:bg-[#241F1B] border border-[#2E2924] rounded-xl text-xs text-[#EDE6DD] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#E08B3F]" />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <Download className="w-4 h-4 text-[#8A837A]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        !isEditing && (
          <div className="p-12 text-center bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-4">
            <Sparkles className="w-8 h-8 text-[#E08B3F] mx-auto" />
            <h3 className="text-lg font-serif font-medium text-[#EDE6DD]">
              Stage 1 & Stage 2 Completed — Output Ready to Upload!
            </h3>
            <p className="text-xs text-[#8A837A] max-w-md mx-auto">
              Your research canvas and development iterations are recorded. Upload your final renders to publish your project.
            </p>
            {isOwner && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-[#E08B3F] text-[#171512] font-semibold text-xs rounded-xl shadow-lg"
              >
                Upload Final Release
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
