"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Sparkles,
  Check,
  ArrowRight,
  Package,
  PenTool,
  Type,
  Layers,
  Film,
  Compass,
  BookOpen,
  Music,
  CheckCircle2,
  User,
  AtSign,
} from "lucide-react";

interface DisciplineOption {
  id: string;
  name: string;
  icon: any;
  color: string;
  desc: string;
  tags: string[];
}

const DISCIPLINE_OPTIONS: DisciplineOption[] = [
  {
    id: "packaging",
    name: "Packaging & Unboxing",
    icon: Package,
    color: "#A3E635",
    desc: "Glueless kraft structures, tactile reveals, die-cuts, and sustainable craft.",
    tags: ["#packaging", "#kraft", "#unboxing", "#sustainable"],
  },
  {
    id: "illustration",
    name: "Linework & Concept Art",
    icon: PenTool,
    color: "#386641",
    desc: "Character silhouettes, rough thumbnails, anatomical sketches & world-building.",
    tags: ["#illustration", "#conceptart", "#sketch", "#character"],
  },
  {
    id: "typography",
    name: "Variable Typography & Print",
    icon: Type,
    color: "#C97B84",
    desc: "Bespoke glyph weights, editorial grids, screenprint assets & variable type.",
    tags: ["#typography", "#editorial", "#print", "#letterforms"],
  },
  {
    id: "industrial",
    name: "Furniture & Industrial Design",
    icon: Layers,
    color: "#E08B3F",
    desc: "Japanese timber joinery, ergonomic prototypes, low-poly seating & CAD.",
    tags: ["#industrial", "#furniture", "#woodworking", "#joinery"],
  },
  {
    id: "motion",
    name: "3D Motion & Simulation",
    icon: Film,
    color: "#60A5FA",
    desc: "Kinetic particle physics, procedural easing curves & spatial simulations.",
    tags: ["#motion", "#3d", "#simulation", "#vfx"],
  },
  {
    id: "architecture",
    name: "Architecture & Space",
    icon: Compass,
    color: "#8A9A86",
    desc: "Volumetric light wells, material explorations & atmospheric sketches.",
    tags: ["#architecture", "#spatial", "#structures", "#interior"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(user?.name || "Pickle Creator");
  const [username, setUsername] = useState(user?.username || "new_creator");
  const [bio, setBio] = useState(user?.bio || "Documenting raw experiments and iteration trails.");
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([
    "packaging",
    "illustration",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "Pickle Creator");
      setUsername(user.username || "new_creator");
      if (user.bio) setBio(user.bio);
    }
  }, [user]);

  const toggleDiscipline = (id: string) => {
    setSelectedDisciplines((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (selectedDisciplines.length === 0) {
      alert("Please select at least one craft discipline to personalize your feed!");
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = user?.id || user?.email || username;
      const formattedDisciplines = selectedDisciplines.map((d) => `#${d}`);

      await completeOnboardingMutation({
        userId,
        name: name.trim() || "Pickle Creator",
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: bio.trim(),
        disciplines: formattedDisciplines,
      });

      // Redirect to home feed
      router.push("/");
    } catch (err) {
      console.error("Onboarding submission failed:", err);
      router.push("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-96 bg-gradient-to-tr from-[#A3E635]/15 via-[#386641]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-2xl bg-[#1C1A17] border border-[#2E2924] rounded-3xl shadow-2xl p-6 sm:p-10 space-y-8 animate-fade-in">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-[#2E2924] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635] text-[#171512] font-serif font-bold text-lg flex items-center justify-center shadow-md">
              p.
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#F5EFEB]">
                {step === 1 ? "Creator Identity" : "Choose Your Craft Interests"}
              </h1>
              <p className="text-xs text-[#8A837A] font-sans">
                {step === 1
                  ? "Set up your public maker identity and process bio."
                  : "We'll customize your quiet feed and auto-join matching rooms."}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-[#A3E635] bg-[#A3E635]/15 px-3 py-1 rounded-full font-semibold">
            Step {step} of 2
          </div>
        </div>

        {/* STEP 1: Profile Details */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-xs font-mono text-[#9E978E] mb-1.5 uppercase">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7E776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarohi Sen"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#141210] border border-[#2E2924] focus:border-[#A3E635] rounded-xl text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#9E978E] mb-1.5 uppercase">
                Creator Handle (@username)
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-[#7E776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="aarohisen"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#141210] border border-[#2E2924] focus:border-[#A3E635] rounded-xl text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#9E978E] mb-1.5 uppercase">
                Maker Bio / Focus
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="What materials, techniques, or medium do you currently explore?"
                className="w-full p-3.5 bg-[#141210] border border-[#2E2924] focus:border-[#A3E635] rounded-xl text-sm text-[#EDE6DD] placeholder-[#6E675F] focus:outline-none transition-colors resize-none font-sans"
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-xs font-sans rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
            >
              <span>Next: Select Craft Interests</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Choose Interests & Disciplines */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DISCIPLINE_OPTIONS.map((opt) => {
                const isSelected = selectedDisciplines.includes(opt.id);
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleDiscipline(opt.id)}
                    className={`p-4 rounded-2xl text-left border transition-all flex items-start gap-3.5 relative ${
                      isSelected
                        ? "bg-[#241F1B] border-[#A3E635] text-[#EDE6DD] shadow-lg scale-[1.01]"
                        : "bg-[#141210] border-[#2E2924] text-[#8A837A] hover:bg-[#1A1815] hover:border-[#3A342D]"
                    }`}
                  >
                    <div
                      className="p-2.5 rounded-xl text-[#171512] shrink-0 shadow-md font-bold"
                      style={{ backgroundColor: opt.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="text-xs font-semibold text-[#EDE6DD] flex items-center justify-between">
                        <span>{opt.name}</span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#A3E635] text-[#171512] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8A837A] font-sans leading-relaxed line-clamp-2">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Initial Bonus Points banner */}
            <div className="p-4 bg-[#241F1B] border border-[#3A342D] rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#EDE6DD]">
                <Sparkles className="w-4 h-4 text-[#A3E635]" />
                <span>Onboarding Reward: +100 Craft Points</span>
              </div>
              <span className="text-[10px] font-mono text-[#A3E635] font-semibold">
                Auto-joined {selectedDisciplines.length} Channels
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3.5 bg-[#241F1B] hover:bg-[#2D2722] text-[#8A837A] hover:text-[#EDE6DD] border border-[#3A342D] text-xs font-mono rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSubmitting || selectedDisciplines.length === 0}
                className="flex-1 py-3.5 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-xs font-sans rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Complete Setup & Enter Studio</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
