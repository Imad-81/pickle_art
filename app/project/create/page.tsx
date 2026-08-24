"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { uploadMedia } from "@/lib/uploader";
import {
  Sparkles,
  Upload,
  Layers,
  ArrowRight,
  Camera,
  Tag,
  Wrench,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

const DISCIPLINES = [
  "Packaging",
  "Illustration",
  "Typography",
  "Industrial Design",
  "Motion",
  "Architecture",
  "Photography",
  "Brand Identity",
];

export default function CreateProjectPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const createProjectMutation = useMutation(api.projects.createProject);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goals, setGoals] = useState("");
  const [discipline, setDiscipline] = useState("Packaging");
  const [tagsInput, setTagsInput] = useState("#packaging, #branding, #craft");
  const [toolsInput, setToolsInput] = useState("Figma, Physical Mockups, Blender");
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">("public");
  const [isExemptPhotography, setIsExemptPhotography] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    if (!title.trim() || !description.trim()) return;

    try {
      setIsCreating(true);

      let coverUrl =
        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1000&auto=format&fit=crop";

      if (coverFile) {
        const uploadRes = await uploadMedia(coverFile, { folder: "project_covers" });
        coverUrl = uploadRes.url;
      }

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const tools = toolsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const projectId = await createProjectMutation({
        creatorId: user.id,
        creatorName: user.name,
        creatorUsername: user.username,
        creatorAvatar: user.avatarUrl,
        title: title.trim(),
        description: description.trim(),
        goals: goals.trim() || undefined,
        discipline,
        tags,
        tools,
        coverUrl,
        privacy,
        isExemptPhotography: isExemptPhotography || discipline === "Photography",
      });

      router.push(`/project/${projectId}`);
    } catch (err: any) {
      alert("Failed to create project: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171512] text-[#EDE6DD] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#8A837A] hover:text-[#EDE6DD] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>

        {/* Header */}
        <div className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-1 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-[#E08B3F]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>START A NEW CRAFT LOG</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#EDE6DD]">
            Create a New Project
          </h1>
          <p className="text-xs text-[#8A837A] font-sans">
            Your project starts on the Stage 1 Stitch Board — drop in research, sketches, and references.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-[#1C1A17] border border-[#2E2924] rounded-2xl space-y-5 shadow-2xl">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-2 uppercase">
              PROJECT COVER IMAGE (AUTO-COMPRESSED IN BROWSER)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-48 rounded-xl border-2 border-dashed border-[#342D26] hover:border-[#E08B3F] bg-[#141210] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              {coverPreview ? (
                <div className="w-full h-full relative">
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 rounded-md text-[10px] font-mono text-[#EDE6DD]">
                    Click to change
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Upload className="w-8 h-8 text-[#E08B3F] mx-auto" />
                  <div className="text-xs font-medium text-[#EDE6DD]">
                    Click to upload high-res cover image
                  </div>
                  <div className="text-[10px] text-[#7E776F] font-mono">
                    PNG, JPEG, WebP · Auto-compressed before S3 upload
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1 uppercase">
              PROJECT TITLE *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Modular Kraft Packaging Suite"
              required
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1 uppercase">
              DESCRIPTION / PREMISE *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you creating and why does the process matter?"
              rows={3}
              required
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          {/* Goals */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1 uppercase">
              GOALS & THESIS (OPTIONAL)
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. Eliminate adhesives, withstand drop tests, achieve tactile unboxing..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-sm font-serif text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          {/* Discipline */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1 uppercase">
              DISCIPLINE CHANNEL
            </label>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-xs font-sans text-[#EDE6DD] focus:outline-none focus:border-[#E08B3F]"
            >
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1 uppercase">
              INTEREST HASHTAGS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#packaging, #branding, #kraft, #sustainable"
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-xs font-mono text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          {/* Tools */}
          <div>
            <label className="block text-xs font-mono text-[#9E978E] mb-1 uppercase">
              TOOLS & MEDIUMS (COMMA SEPARATED)
            </label>
            <input
              type="text"
              value={toolsInput}
              onChange={(e) => setToolsInput(e.target.value)}
              placeholder="Illustrator, Laser Cutter, Blender, Physical Prototyping"
              className="w-full px-3.5 py-2.5 bg-[#141210] border border-[#2E2924] rounded-lg text-xs font-mono text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none focus:border-[#E08B3F]"
            />
          </div>

          {/* Photography Exemption */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-mono text-[#EDE6DD] cursor-pointer">
              <input
                type="checkbox"
                checked={isExemptPhotography}
                onChange={(e) => setIsExemptPhotography(e.target.checked)}
                className="rounded accent-[#E08B3F]"
              />
              <span>Single-shot / Photography Exemption (Skip stage gating)</span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#2E2924] flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-3 bg-[#E08B3F] hover:bg-[#CA782F] disabled:opacity-50 text-[#171512] font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Initializing Stage 1 Canvas...</span>
                </>
              ) : (
                <>
                  <span>Create Project & Open Stage 1</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
