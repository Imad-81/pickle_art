"use client";

import React from "react";
import {
  Palette,
  Layers,
  Trash2,
  Copy,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUpToLine,
  ArrowDownToLine,
  MoveUp,
  MoveDown,
  X,
  Lock,
  Unlock,
  Check,
  Grid,
  Sparkles,
} from "lucide-react";

export interface ElementProperties {
  strokeColor: string;
  fillColor?: string;
  fillStyle?: "none" | "solid" | "hachure" | "cross-hatch" | "dots";
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  roughness?: "clean" | "artist" | "rough";
  opacity?: number;
  zIndex?: number;
}

const STROKE_COLORS = [
  { name: "Lime", color: "#A3E635" },
  { name: "Rose", color: "#C97B84" },
  { name: "Moss", color: "#386641" },
  { name: "Amber", color: "#E08B3F" },
  { name: "Sky", color: "#60A5FA" },
  { name: "Purple", color: "#C084FC" },
  { name: "Yellow", color: "#FFE066" },
  { name: "White", color: "#F5EFEB" },
  { name: "Charcoal", color: "#2E2924" },
];

const FILL_COLORS = [
  { name: "Transparent", color: "transparent" },
  { name: "Lime Tint", color: "#A3E635" },
  { name: "Rose Tint", color: "#C97B84" },
  { name: "Amber Tint", color: "#E08B3F" },
  { name: "Sky Tint", color: "#60A5FA" },
  { name: "Paper Yellow", color: "#FFE066" },
  { name: "Dark Surface", color: "#1C1916" },
];

interface CanvasInspectorProps {
  selectedItems: any[];
  properties: ElementProperties;
  onUpdateProperties: (newProps: Partial<ElementProperties>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onAlign?: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onClose: () => void;
}

export function CanvasInspector({
  selectedItems,
  properties,
  onUpdateProperties,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onAlign,
  onClose,
}: CanvasInspectorProps) {
  if (!selectedItems || selectedItems.length === 0) return null;

  const isMulti = selectedItems.length > 1;
  const primaryItem = selectedItems[0];
  const itemType = isMulti ? "multiple" : primaryItem.type;

  const currentStroke = properties.strokeColor || primaryItem.color || "#A3E635";
  const currentFill = properties.fillColor || (primaryItem.metadata as any)?.fillColor || "transparent";
  const currentFillStyle = properties.fillStyle || (primaryItem.metadata as any)?.fillStyle || (itemType === "shape" ? "solid" : "none");
  const currentWidth = properties.strokeWidth || (primaryItem.metadata as any)?.strokeWidth || 3;
  const currentStyle = properties.strokeStyle || (primaryItem.metadata as any)?.strokeStyle || "solid";
  const currentRoughness = properties.roughness || (primaryItem.metadata as any)?.roughness || "clean";
  const currentOpacity = properties.opacity !== undefined ? properties.opacity : ((primaryItem.metadata as any)?.opacity ?? 1);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-16 left-4 z-40 w-64 bg-[#1C1A17]/95 backdrop-blur-xl border border-[#2E2924] rounded-3xl shadow-2xl p-4 text-xs font-mono text-[#DDD4C8] space-y-4 animate-fade-in pointer-events-auto select-none max-h-[calc(100%-80px)] overflow-y-auto scrollbar-thin"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2E2924] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_#A3E635]" />
          <span className="font-semibold uppercase tracking-wider text-[#A3E635] text-[11px]">
            {isMulti ? `${selectedItems.length} Items Selected` : `${itemType} Properties`}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#8A837A] hover:text-[#EDE6DD] rounded-lg hover:bg-[#241F1B] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stroke Color */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-[#8A837A]">Stroke Color</label>
        <div className="grid grid-cols-5 gap-1.5">
          {STROKE_COLORS.map((col) => (
            <button
              key={col.name}
              onClick={() => onUpdateProperties({ strokeColor: col.color })}
              style={{ backgroundColor: col.color }}
              className={`h-6 rounded-lg border transition-all flex items-center justify-center ${
                currentStroke === col.color
                  ? "border-[#171512] ring-2 ring-[#A3E635] scale-105"
                  : "border-black/40 hover:scale-105 opacity-80 hover:opacity-100"
              }`}
              title={col.name}
            >
              {currentStroke === col.color && (
                <Check className={`w-3 h-3 ${col.color === "#F5EFEB" || col.color === "#FFE066" ? "text-black" : "text-white"}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fill Color & Style (for shapes and stickies) */}
      {(itemType === "shape" || itemType === "text_sticky" || isMulti) && (
        <div className="space-y-2 border-t border-[#2E2924] pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-[#8A837A]">Background Fill</label>
            <span className="text-[10px] text-[#A3E635] capitalize">{currentFillStyle}</span>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {(["none", "solid", "hachure", "dots"] as const).map((style) => (
              <button
                key={style}
                onClick={() => onUpdateProperties({ fillStyle: style })}
                className={`px-2 py-1 rounded-lg text-[10px] border transition-all capitalize ${
                  currentFillStyle === style
                    ? "bg-[#A3E635] text-[#171512] font-bold border-[#A3E635]"
                    : "bg-[#241F1B] text-[#8A837A] border-[#3E3832] hover:text-[#EDE6DD]"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          {currentFillStyle !== "none" && (
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {FILL_COLORS.map((col) => (
                <button
                  key={col.name}
                  onClick={() => onUpdateProperties({ fillColor: col.color })}
                  style={{ backgroundColor: col.color }}
                  className={`h-5 rounded-lg border transition-all ${
                    currentFill === col.color
                      ? "border-[#171512] ring-2 ring-[#A3E635]"
                      : "border-black/40 hover:scale-105"
                  }`}
                  title={col.name}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stroke Width & Stroke Style */}
      <div className="space-y-2 border-t border-[#2E2924] pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider text-[#8A837A]">Stroke Width</label>
          <span className="text-[10px] text-[#A3E635]">{currentWidth}px</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: "Thin", w: 1.5 },
            { label: "Med", w: 3 },
            { label: "Bold", w: 5 },
            { label: "Heavy", w: 8 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onUpdateProperties({ strokeWidth: item.w })}
              className={`px-1.5 py-1 rounded-lg text-[10px] border transition-all ${
                Math.abs(currentWidth - item.w) < 0.5
                  ? "bg-[#A3E635] text-[#171512] font-bold border-[#A3E635]"
                  : "bg-[#241F1B] text-[#8A837A] border-[#3E3832] hover:text-[#EDE6DD]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1 pt-1">
          {(["solid", "dashed", "dotted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdateProperties({ strokeStyle: s })}
              className={`px-2 py-1 rounded-lg text-[10px] border transition-all capitalize ${
                currentStyle === s
                  ? "bg-[#A3E635] text-[#171512] font-bold border-[#A3E635]"
                  : "bg-[#241F1B] text-[#8A837A] border-[#3E3832] hover:text-[#EDE6DD]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Aesthetic Roughness (Architect vs Artist Sketch) */}
      <div className="space-y-1.5 border-t border-[#2E2924] pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider text-[#8A837A]">Aesthetic Mode</label>
          <span className="text-[10px] text-[#A3E635] capitalize">{currentRoughness}</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(["clean", "artist", "rough"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onUpdateProperties({ roughness: mode })}
              className={`px-1.5 py-1 rounded-lg text-[10px] border transition-all capitalize ${
                currentRoughness === mode
                  ? "bg-[#A3E635] text-[#171512] font-bold border-[#A3E635]"
                  : "bg-[#241F1B] text-[#8A837A] border-[#3E3832] hover:text-[#EDE6DD]"
              }`}
            >
              {mode === "clean" ? "Architect" : mode === "artist" ? "Artist" : "Rough"}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-1.5 border-t border-[#2E2924] pt-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase tracking-wider text-[#8A837A]">Opacity</label>
          <span className="text-[10px] text-[#A3E635]">{Math.round(currentOpacity * 100)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={currentOpacity}
          onChange={(e) => onUpdateProperties({ opacity: parseFloat(e.target.value) })}
          className="w-full accent-[#A3E635] h-1.5 bg-[#241F1B] rounded-lg cursor-pointer"
        />
      </div>

      {/* Alignment (when multiple items selected) */}
      {isMulti && onAlign && (
        <div className="space-y-1.5 border-t border-[#2E2924] pt-2">
          <label className="text-[10px] uppercase tracking-wider text-[#8A837A]">Align Items</label>
          <div className="grid grid-cols-6 gap-1">
            <button
              onClick={() => onAlign("left")}
              title="Align Left"
              className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign("center")}
              title="Align Center"
              className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign("right")}
              title="Align Right"
              className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign("top")}
              title="Align Top"
              className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign("middle")}
              title="Align Middle"
              className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign("bottom")}
              title="Align Bottom"
              className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Layering & Quick Actions */}
      <div className="space-y-2 border-t border-[#2E2924] pt-2">
        <label className="text-[10px] uppercase tracking-wider text-[#8A837A]">Layering & Actions</label>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={onBringForward}
            title="Bring Forward (])"
            className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
          >
            <MoveUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSendBackward}
            title="Send Backward ([)"
            className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
          >
            <MoveDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onBringToFront}
            title="Bring to Front (Shift + ])"
            className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSendToBack}
            title="Send to Back (Shift + [)"
            className="p-1.5 rounded-lg bg-[#241F1B] hover:bg-[#2F2923] text-[#8A837A] hover:text-[#EDE6DD] flex items-center justify-center border border-[#3E3832]"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={onDuplicate}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#241F1B] hover:bg-[#2F2923] border border-[#3E3832] text-[#EDE6DD] text-[11px] font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>Duplicate</span>
          </button>

          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[11px] font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
