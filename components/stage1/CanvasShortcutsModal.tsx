"use client";

import React from "react";
import { X, Keyboard, Command } from "lucide-react";

interface CanvasShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "Tool Selection",
    shortcuts: [
      { key: "1 / V", desc: "Select & Move tool" },
      { key: "2 / R", desc: "Rectangle shape" },
      { key: "3 / D", desc: "Diamond shape" },
      { key: "4 / O / C", desc: "Circle / Ellipse shape" },
      { key: "5 / A", desc: "Directional Arrow" },
      { key: "6 / L", desc: "Connection Line" },
      { key: "7 / P", desc: "Freehand Pen" },
      { key: "8 / S / T", desc: "Sticky Note / Text" },
      { key: "9 / M", desc: "Upload Media" },
      { key: "0 / E", desc: "Eraser tool" },
      { key: "H / Space", desc: "Pan / Hand mode" },
      { key: "F", desc: "Add Section Frame" },
    ],
  },
  {
    title: "Editing & Actions",
    shortcuts: [
      { key: "Del / Backspace", desc: "Delete selected item(s)" },
      { key: "Cmd + D", desc: "Duplicate selected item(s)" },
      { key: "Cmd + Z", desc: "Undo last action" },
      { key: "Cmd + Shift + Z", desc: "Redo action" },
      { key: "Cmd + Y", desc: "Redo action" },
      { key: "Cmd + V", desc: "Paste image / text from clipboard" },
      { key: "Cmd + A", desc: "Select all items" },
      { key: "Esc", desc: "Deselect / Return to select tool" },
      { key: "Double Click", desc: "Edit text on any shape" },
    ],
  },
  {
    title: "Navigation & View",
    shortcuts: [
      { key: "Pinch / Scroll", desc: "Zoom in and out" },
      { key: "Space + Drag", desc: "Pan canvas smoothly" },
      { key: "Shift + 1", desc: "Fit all items to screen" },
      { key: "Shift + 0", desc: "Reset zoom to 100%" },
      { key: "F11", desc: "Toggle Fullscreen mode" },
      { key: "?", desc: "Open this shortcuts menu" },
    ],
  },
  {
    title: "Layering & Precision",
    shortcuts: [
      { key: "]", desc: "Bring forward" },
      { key: "[", desc: "Send backward" },
      { key: "Shift + ]", desc: "Bring to front" },
      { key: "Shift + [", desc: "Send to back" },
      { key: "Shift + Rotate", desc: "Snap rotation to 15° angles" },
    ],
  },
];

export function CanvasShortcutsModal({ isOpen, onClose }: CanvasShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#1C1A17] border border-[#2E2924] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E2924] bg-[#141210]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#A3E635]/15 border border-[#A3E635]/30 flex items-center justify-center text-[#A3E635]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#EDE6DD]">
                Keyboard Shortcuts & Commands
              </h2>
              <p className="text-xs font-mono text-[#8A837A]">
                Excalidraw-grade speed controls for Pickle Board
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#A3E635] font-semibold border-b border-[#2E2924] pb-1">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((sc) => (
                    <div
                      key={sc.key}
                      className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded-lg bg-[#241F1B]/50 hover:bg-[#241F1B] transition-colors"
                    >
                      <span className="text-[#DDD4C8]">{sc.desc}</span>
                      <kbd className="px-2 py-0.5 rounded bg-[#171512] border border-[#3E3832] text-[#A3E635] font-bold text-[11px] shadow-sm whitespace-nowrap">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2E2924] bg-[#141210] flex items-center justify-between text-xs font-mono text-[#8A837A]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[#241F1B] text-[#EDE6DD]">?</kbd> anytime to open</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#A3E635] text-[#171512] font-semibold hover:bg-[#84CC16] transition-colors text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
