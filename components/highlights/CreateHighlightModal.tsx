"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { uploadMedia } from "@/lib/uploader";
import { X, Upload, Camera, Sparkles, Image, Video, Music, ArrowRight, Loader2 } from "lucide-react";

export function CreateHighlightModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createHighlightMutation = useMutation(api.highlights.createHighlight);

  const userProjects = useQuery(
    api.projects.getUserProjects,
    user ? { userId: user.id } : "skip"
  );

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    const type = selected.type.toLowerCase();
    if (type.startsWith("video/")) {
      setMediaType("video");
    } else if (type.startsWith("audio/")) {
      setMediaType("audio");
    } else {
      setMediaType("image");
    }

    const objUrl = URL.createObjectURL(selected);
    setPreviewUrl(objUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Upload with browser compression
      const uploadRes = await uploadMedia(file, {
        folder: "highlights",
        onProgress: (p) => setUploadProgress(p),
      });

      const selectedProject = userProjects?.find((p) => p._id === selectedProjectId);

      await createHighlightMutation({
        creatorId: user.id,
        creatorName: user.name,
        creatorAvatar: user.avatarUrl,
        mediaUrl: uploadRes.url,
        mediaType,
        caption: caption.trim() || undefined,
        linkedProjectId: selectedProjectId || undefined,
        linkedProjectTitle: selectedProject?.title || undefined,
      });

      onClose();
      setFile(null);
      setPreviewUrl(null);
      setCaption("");
      setSelectedProjectId("");
    } catch (err: any) {
      console.error("Failed to post highlight:", err);
      alert(err.message || "Failed to upload 24h highlight");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-2xl p-6 text-[#EDE6DD] overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#9E978E] hover:text-[#EDE6DD] hover:bg-[#2A2521] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#E08B3F]/20 text-[#E08B3F] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-medium">Post a 24-Hour Process Snapshot</h3>
            <p className="text-xs text-[#8A837A] font-sans">
              Share raw sketches, audio thoughts, or work-in-progress. Disappears in 24 hours.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Picker / Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full h-56 rounded-xl border-2 border-dashed border-[#342D26] hover:border-[#E08B3F] bg-[#141210] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
              previewUrl ? "border-solid border-[#E08B3F]/60" : ""
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-black/40">
                {mediaType === "image" && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                )}
                {mediaType === "video" && (
                  <video src={previewUrl} className="w-full h-full object-contain" controls />
                )}
                {mediaType === "audio" && (
                  <div className="flex flex-col items-center gap-3 p-4">
                    <Music className="w-12 h-12 text-[#E08B3F]" />
                    <span className="text-xs font-mono text-[#EDE6DD]">{file?.name}</span>
                    <audio src={previewUrl} controls className="w-64 mt-2" />
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-md text-[10px] font-mono text-[#EDE6DD]">
                  Click to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#241F1B] border border-[#342D26] flex items-center justify-center text-[#E08B3F]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-[#EDE6DD]">Drop or click to upload media</div>
                <div className="text-xs text-[#7E776F]">Supports Images, Videos (MP4/WebM), Audio snippets</div>
                <div className="text-[10px] text-[#E08B3F] font-mono mt-1">
                  ⚡ Auto-compressed in your browser
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1">
              PROCESS NOTE / CAPTION (OPTIONAL)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What experiment or decision are you exploring right now? (e.g. testing color contrast on cold press...)"
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F] transition-colors"
            />
          </div>

          {/* Link to existing project */}
          {userProjects && userProjects.length > 0 && (
            <div>
              <label className="block text-xs font-mono text-[#9E978E] mb-1">
                ATTACH TO PROJECT (OPTIONAL)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#141210] border border-[#2E2924] rounded-lg text-xs font-sans text-[#EDE6DD] focus:outline-none focus:border-[#E08B3F]"
              >
                <option value="">No project linked (Standalone 24h WIP)</option>
                {userProjects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.discipline})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[#E08B3F]">
                <span>Compressing & uploading to S3...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#2A2521] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E08B3F] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-[#2A2521] hover:bg-[#342E29] text-xs font-medium rounded-xl text-[#EDE6DD] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-5 py-2 bg-[#E08B3F] hover:bg-[#CA782F] disabled:opacity-50 text-[#171512] font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>Post to 24h Highlights</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
