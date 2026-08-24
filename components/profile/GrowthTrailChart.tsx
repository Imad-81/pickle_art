"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, CheckCircle, Flame, Calendar, Award } from "lucide-react";

interface Milestone {
  id: string;
  month: string;
  points: number;
  label: string;
  description: string;
  date: string;
}

export function GrowthTrailChart({
  growthPoints = 540,
  username = "aarohisen",
}: {
  growthPoints?: number;
  username?: string;
}) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const milestones: Milestone[] = [
    {
      id: "m1",
      month: "Jan",
      points: 80,
      label: "First Stitch Moodboard Created",
      description: "Documented initial raw botanical dye references and paper tests.",
      date: "Jan 14, 2026",
    },
    {
      id: "m2",
      month: "Feb",
      points: 160,
      label: "Stage 2 Decision Poll Launched",
      description: "Engaged 42 creators on UV pigment longevity options.",
      date: "Feb 22, 2026",
    },
    {
      id: "m3",
      month: "Mar",
      points: 270,
      label: "10 Constructive Crits Given",
      description: "Awarded peer craft badges for color balance and hierarchy.",
      date: "Mar 18, 2026",
    },
    {
      id: "m4",
      month: "Apr",
      points: 360,
      label: "Packaging Suit Published",
      description: "Passed drop tests and unlocked stage 3 final release.",
      date: "Apr 09, 2026",
    },
    {
      id: "m5",
      month: "May",
      points: 440,
      label: "Feedback Notes Addressed",
      description: "Iterated dieline latch geometry following community feedback.",
      date: "May 25, 2026",
    },
    {
      id: "m6",
      month: "Jun",
      points: 540,
      label: "Craft Mastery Milestone",
      description: "50+ hours of transparent craft development logged.",
      date: "Jun 12, 2026",
    },
  ];

  const triggerCelebration = (m: Milestone) => {
    setSelectedMilestone(m);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#E08B3F", "#B5731C", "#386641", "#EDE6DD"],
    });
  };

  const maxPoints = 600;
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 30;

  // Calculate SVG line points
  const points = milestones.map((m, index) => {
    const x = paddingX + (index / (milestones.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (m.points / maxPoints) * (height - paddingY * 2);
    return { x, y, milestone: m };
  });

  const pathD = points.reduce((acc, curr, index) => {
    if (index === 0) return `M ${curr.x} ${curr.y}`;
    // Smooth bezier curve
    const prev = points[index - 1];
    const cpX1 = prev.x + (curr.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (curr.x - prev.x) / 2;
    const cpY2 = curr.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="p-6 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#E08B3F] mb-0.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>GROWTH TRAIL & CRAFT TIMELINE</span>
          </div>
          <h3 className="text-lg font-serif font-semibold text-[#EDE6DD]">
            Milestones of Effort, Not Likes
          </h3>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#241F1B] border border-[#E08B3F]/40 rounded-xl">
          <Sparkles className="w-4 h-4 text-[#E08B3F]" />
          <span className="text-xs font-mono font-bold text-[#E08B3F]">
            {growthPoints} craft points
          </span>
        </div>
      </div>

      {/* SVG Growth Trail Visual Graph */}
      <div className="relative w-full overflow-x-auto bg-[#141210] p-4 rounded-xl border border-[#26211D]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          {/* Gradient Fill */}
          <defs>
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E08B3F" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#E08B3F" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path d={areaD} fill="url(#growthGradient)" />

          {/* Golden / Amber Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#E08B3F"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Nodes */}
          {points.map((p) => {
            const isSelected = selectedMilestone?.id === p.milestone.id;
            return (
              <g key={p.milestone.id} className="cursor-pointer" onClick={() => triggerCelebration(p.milestone)}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? "7" : "5"}
                  className="transition-all fill-[#171512] stroke-[#E08B3F] stroke-[2.5]"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? "4" : "2.5"}
                  className="fill-[#E08B3F]"
                />
                <text
                  x={p.x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-[#8A837A] text-[10px] font-mono"
                >
                  {p.milestone.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Milestone Detail Box */}
      {selectedMilestone ? (
        <div className="p-4 bg-[#241F1B] border border-[#E08B3F]/40 rounded-xl flex items-start justify-between gap-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#E08B3F]">
              <Award className="w-3.5 h-3.5" />
              <span>{selectedMilestone.date} · +{selectedMilestone.points} pts</span>
            </div>
            <div className="text-sm font-serif font-semibold text-[#EDE6DD] mt-1">
              {selectedMilestone.label}
            </div>
            <p className="text-xs text-[#EDE6DD]/80 font-sans mt-0.5">
              {selectedMilestone.description}
            </p>
          </div>
          <button
            onClick={() => setSelectedMilestone(null)}
            className="text-xs text-[#8A837A] hover:text-[#EDE6DD]"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="text-center py-1 text-xs font-mono text-[#7E776F]">
          Tap any milestone node on the trail to inspect your documented development.
        </div>
      )}
    </div>
  );
}
