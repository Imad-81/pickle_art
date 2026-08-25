"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Compass,
  MessageSquare,
  Flame,
  Palette,
  Package,
  PenTool,
  Type,
  Maximize2,
  Share2,
  Play,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function LandingHero() {
  const [activeStagePreview, setActiveStagePreview] = useState<"stage1" | "stage2" | "output">("stage1");

  const disciplines = [
    {
      name: "Packaging Design",
      slug: "packaging",
      icon: Package,
      color: "#A3E635",
      desc: "Glueless kraft structures, tactile reveals, and unboxing ergonomics.",
      stat: "1.4k makers",
      cover: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Linework & Illustration",
      slug: "illustration",
      icon: PenTool,
      color: "#386641",
      desc: "Character silhouettes, rough thumbnails, and botanical brush studies.",
      stat: "2.3k makers",
      cover: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Variable Typography",
      slug: "typography",
      icon: Type,
      color: "#C97B84",
      desc: "Bespoke glyph weights, grid breakdowns, and experimental print layouts.",
      stat: "980 makers",
      cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Furniture & Industrial",
      slug: "industrial",
      icon: Layers,
      color: "#E08B3F",
      desc: "Wedged tenon joinery, CNC contour studies, and flat-pack mechanics.",
      stat: "860 makers",
      cover: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <div className="w-full space-y-24 pb-20 animate-fade-in">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 max-w-7xl mx-auto text-center space-y-8 overflow-hidden">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 sm:h-[400px] bg-gradient-to-tr from-[#A3E635]/15 via-[#386641]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-[#C97B84]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Hero Tagline pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1F1B17] border border-[#3A342D] shadow-lg">
          <div className="w-2 h-2 rounded-full bg-[#A3E635] animate-ping" />
          <span className="text-xs font-mono text-[#EDE6DD] tracking-wide uppercase font-medium">
            Where Process is the Art
          </span>
          <span className="text-[10px] text-[#A3E635] bg-[#A3E635]/20 px-2 py-0.5 rounded-full font-mono font-bold">
            v2.0
          </span>
        </div>

        {/* Main Heading */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-[#F5EFEB] leading-[1.1]">
            Document the craft. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A3E635] via-[#DDD4C8] to-[#C97B84]">
              Celebrate the iterations.
            </span>
          </h1>
          <p className="text-base sm:text-xl font-sans text-[#9E978E] max-w-2xl mx-auto leading-relaxed">
            Pickle is the quiet home for creators tired of performative final reveals.
            Share moodboards, raw prototypes, constructive crits, and development trails.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/login?mode=signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold font-sans text-sm rounded-2xl shadow-xl shadow-[#A3E635]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5"
          >
            <span>Start Your Process Trail</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-4 bg-[#221E1A] hover:bg-[#2A2420] text-[#EDE6DD] border border-[#3A342D] hover:border-[#A3E635]/50 font-medium font-sans text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <span>Explore Demo Feed</span>
          </Link>
        </div>

        {/* Metrics Badge */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 pt-6 text-xs font-mono text-[#736B62]">
          <div className="flex items-center gap-2">
            <span className="text-[#A3E635] font-bold text-sm">3 Stages</span>
            <span>Structured Process</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-[#A3E635] font-bold text-sm">24h WIPs</span>
            <span>Ephemeral Stories</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <span className="text-[#A3E635] font-bold text-sm">0 Likes</span>
            <span>100% Constructive Crits</span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE 3-STAGE PROCESS CANVAS DEMO */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5EFEB]">
            The 3-Stage Iteration Engine
          </h2>
          <p className="text-xs sm:text-sm text-[#9E978E] font-sans max-w-lg mx-auto">
            From raw moodboards to tactile prototypes, every release carries its full evolutionary story.
          </p>
        </div>

        {/* Stage Selector Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-[#1F1B17] border border-[#2E2924] rounded-2xl max-w-md mx-auto">
          <button
            onClick={() => setActiveStagePreview("stage1")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 ${
              activeStagePreview === "stage1"
                ? "bg-[#A3E635] text-[#171512] font-bold shadow-md"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <span>1. Stitch Canvas</span>
          </button>
          <button
            onClick={() => setActiveStagePreview("stage2")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 ${
              activeStagePreview === "stage2"
                ? "bg-[#A3E635] text-[#171512] font-bold shadow-md"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <span>2. Development</span>
          </button>
          <button
            onClick={() => setActiveStagePreview("output")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-2 ${
              activeStagePreview === "output"
                ? "bg-[#A3E635] text-[#171512] font-bold shadow-md"
                : "text-[#8A837A] hover:text-[#EDE6DD]"
            }`}
          >
            <span>3. Final Release</span>
          </button>
        </div>

        {/* Interactive Preview Canvas Window */}
        <div className="relative bg-[#1C1A17] border border-[#2E2924] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden min-h-[420px] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Top status bar inside demo */}
            <div className="flex items-center justify-between border-b border-[#2E2924] pb-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#A3E635]/20 text-[#A3E635] font-semibold">
                  {activeStagePreview === "stage1"
                    ? "Stage 1: Spatial Ideation"
                    : activeStagePreview === "stage2"
                    ? "Stage 2: Iteration Logs & Material Tests"
                    : "Stage 3: Verified Final Output"}
                </span>
                <span className="text-[#736B62] hidden sm:inline">•</span>
                <span className="text-[#9E978E] hidden sm:inline">Modular Kraft Packaging Concept</span>
              </div>
              <span className="text-[#A3E635]">Live Interactive Mode</span>
            </div>

            {/* Stage 1 Preview View */}
            {activeStagePreview === "stage1" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-fade-in">
                <div className="p-4 bg-[#FFE066] text-[#4A3B00] rounded-xl font-hand text-xs rotate-[-1deg] shadow-lg">
                  "Research insight: eliminating adhesive VOCs requires a 4-point interlocking tab geometry with 1.5mm tolerance."
                </div>
                <div className="p-3 bg-[#221E1A] border border-[#3A342D] rounded-xl space-y-2 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop"
                    alt="Kraft exploration"
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="text-[11px] font-mono text-[#EDE6DD]">Kraft Fiber Grain Tension Test #01</div>
                </div>
                <div className="p-4 bg-[#2A2521] border border-dashed border-[#A3E635] rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                  <Maximize2 className="w-6 h-6 text-[#A3E635]" />
                  <div className="text-xs font-serif text-[#EDE6DD]">Infinite Spatial Canvas</div>
                  <p className="text-[10px] text-[#8A837A] font-mono">Freehand pen, stickies, PDFs & video memo attachments</p>
                </div>
              </div>
            )}

            {/* Stage 2 Preview View */}
            {activeStagePreview === "stage2" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-fade-in">
                <div className="p-5 bg-[#221E1A] border border-[#3A342D] rounded-2xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-[#EDE6DD]">Subcard 01: Die-Cut Variant #3</span>
                    <span className="text-[10px] font-mono text-[#A3E635]">1.5m Drop Passed</span>
                  </div>
                  <p className="text-xs text-[#9E978E] font-sans leading-relaxed">
                    Tested on 350gsm unbleached fluting. The secondary latch locks firmly under 4kg compression without tearing.
                  </p>
                  <div className="p-2.5 bg-[#171512] rounded-xl text-[11px] font-mono text-[#EDE6DD] flex items-center justify-between border border-[#2E2924]">
                    <span>Poll: Latch Feel Satisfaction</span>
                    <span className="text-[#A3E635] font-bold">92% Crisp Lock</span>
                  </div>
                </div>

                <div className="p-5 bg-[#221E1A] border border-[#3A342D] rounded-2xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold text-[#EDE6DD]">Constructive Crit by Aarohi</span>
                    <span className="text-[10px] font-mono text-[#C97B84]">Color & Ergonomics</span>
                  </div>
                  <p className="text-xs text-[#DDD4C8] font-serif italic">
                    "What worked: The tactile reveal sequence is extremely clean. Try rounding the thumb notch radius to 8mm for easier blind opening."
                  </p>
                </div>
              </div>
            )}

            {/* Stage 3 Preview View */}
            {activeStagePreview === "output" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-fade-in">
                <div className="sm:col-span-2 p-5 bg-[#221E1A] border border-[#3A342D] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h3 className="text-base font-serif font-bold text-[#EDE6DD]">Published Project Suite</h3>
                  </div>
                  <p className="text-xs text-[#9E978E] leading-relaxed">
                    The entire evolution — from early sketch failures to finalized CAD production templates — is archived for the community to learn from.
                  </p>
                </div>
                <div className="p-5 bg-[#1F1B17] border border-[#A3E635]/40 rounded-2xl flex flex-col justify-center items-center text-center space-y-2">
                  <div className="text-2xl font-mono font-bold text-[#A3E635]">+140</div>
                  <div className="text-xs font-serif text-[#EDE6DD]">Growth Craft Points</div>
                  <p className="text-[10px] text-[#736B62] font-mono">Rewarded for process depth & constructive reviews</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#2E2924] flex items-center justify-between text-xs font-mono text-[#736B62]">
            <span>Interactive Process Engine</span>
            <Link href="/login?mode=signup" className="text-[#A3E635] hover:underline flex items-center gap-1">
              <span>Create your project</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. DISCIPLINE CHANNELS SHOWCASE */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#A3E635] uppercase">CREATIVE DISCIPLINE ROOMS</div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5EFEB]">
              Tailored Spaces for Every Medium
            </h2>
          </div>
          <Link href="/login" className="text-xs font-mono text-[#A3E635] hover:underline flex items-center gap-1">
            <span>Browse all channel drops</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {disciplines.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.slug}
                className="group p-5 bg-[#1C1A17] hover:bg-[#221E1A] border border-[#2E2924] hover:border-[#A3E635]/50 rounded-2xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#141210]">
                    <img
                      src={d.cover}
                      alt={d.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl text-[#171512] shadow-md font-bold"
                      style={{ backgroundColor: d.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-serif font-bold text-[#EDE6DD] group-hover:text-[#A3E635] transition-colors">
                      {d.name}
                    </h3>
                    <p className="text-xs text-[#8A837A] font-sans mt-1 line-clamp-2 leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2E2924] flex items-center justify-between text-[11px] font-mono text-[#736B62]">
                  <span>{d.stat}</span>
                  <Link href={`/login`} className="text-[#EDE6DD] group-hover:text-[#A3E635] transition-colors">
                    Join Room →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. VALUE PROPOSITION PILLARS */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 bg-gradient-to-br from-[#1C1A17] via-[#221E1A] to-[#171512] border border-[#2E2924] rounded-3xl shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5EFEB]">
              Built Differently from Social Platforms
            </h2>
            <p className="text-xs sm:text-sm text-[#9E978E] max-w-lg mx-auto">
              No engagement traps, no vanity like counts. Just deliberate process and craft advancement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 bg-[#171512] border border-[#2E2924] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#A3E635]/20 text-[#A3E635] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#EDE6DD]">Quiet Feed</h3>
              <p className="text-xs text-[#8A837A] leading-relaxed">
                Chronological process logs and real development updates without algorithmic rage-bait or infinite doomscrolling.
              </p>
            </div>

            <div className="p-6 bg-[#171512] border border-[#2E2924] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#C97B84]/20 text-[#C97B84] flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#EDE6DD]">Constructive Crits</h3>
              <p className="text-xs text-[#8A837A] leading-relaxed">
                Structured feedback prompts focusing on "What Worked" and "What to Try Next" with categorized craft reactions.
              </p>
            </div>

            <div className="p-6 bg-[#171512] border border-[#2E2924] rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#E08B3F]/20 text-[#E08B3F] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#EDE6DD]">Actionable Notes</h3>
              <p className="text-xs text-[#8A837A] leading-relaxed">
                Save critiques directly into your personal Studio Feedback Repository to track your iteration progress over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CALL TO ACTION */}
      <section className="px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5EFEB]">
          Ready to share your process?
        </h2>
        <p className="text-sm text-[#9E978E] max-w-md mx-auto">
          Join craftspeople, designers, and illustrators in building a quieter, more thoughtful creative web.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login?mode=signup"
            className="px-8 py-3.5 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-sm rounded-2xl shadow-xl transition-all"
          >
            Create Your Account
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 bg-[#221E1A] hover:bg-[#2A2420] text-[#EDE6DD] border border-[#3A342D] text-sm rounded-2xl transition-all"
          >
            Sign In with Test Persona
          </Link>
        </div>
      </section>
    </div>
  );
}
