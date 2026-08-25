"use client";

import React, { useState, useRef } from "react";
import { resolveMediaUrl } from "@/lib/media";
import {
  Music,
  Video,
  FileText,
  Trash2,
  Copy,
  X,
  RotateCw,
} from "lucide-react";

export type ResizeHandleType = "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w";

interface CanvasItemRendererProps {
  item: any;
  isSelected: boolean;
  isEditable: boolean;
  isLocked: boolean;
  dim: { x: number; y: number; width: number; height: number };
  isResizing: boolean;
  onItemPointerDown: (e: React.PointerEvent, item: any) => void;
  onResizePointerDown: (e: React.PointerEvent, item: any, handle: ResizeHandleType) => void;
  onDelete: (itemId: string) => void;
  onDuplicate: (item: any) => void;
  onUpdateContent: (itemId: string, content: string) => void;
}

export function CanvasItemRenderer({
  item,
  isSelected,
  isEditable,
  isLocked,
  dim,
  isResizing,
  onItemPointerDown,
  onResizePointerDown,
  onDelete,
  onDuplicate,
  onUpdateContent,
}: CanvasItemRendererProps) {
  const [isEditingText, setIsEditingText] = useState(false);

  const strokeColor = item.color || "#A3E635";
  const meta = (item.metadata as any) || {};
  const strokeWidth = meta.strokeWidth || 3;
  const strokeStyle = meta.strokeStyle || "solid";
  const fillStyle = meta.fillStyle || "none";
  const fillColor = meta.fillColor || "transparent";
  const roughness = meta.roughness || "clean";
  const opacity = meta.opacity !== undefined ? meta.opacity : 1;
  const rotation = item.rotation || 0;

  const w = Math.max(dim.width, 20);
  const h = Math.max(dim.height, 20);

  // Stroke dasharray
  const dashArray =
    strokeStyle === "dashed" ? "6 6" : strokeStyle === "dotted" ? "2 4" : undefined;

  // SVG Pattern ID
  const patternId = `hatch-${item._id}`;
  const dotPatternId = `dots-${item._id}`;

  const renderPatterns = () => (
    <defs>
      {/* Diagonal Hachure Pattern */}
      <pattern
        id={patternId}
        width="10"
        height="10"
        patternTransform="rotate(45 0 0)"
        patternUnits="userSpaceOnUse"
      >
        <line x1="0" y1="0" x2="0" y2="10" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.6" />
      </pattern>

      {/* Stippled Dots Pattern */}
      <pattern id={dotPatternId} width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="1.5" fill={strokeColor} fillOpacity="0.7" />
      </pattern>

      {/* Arrowhead marker */}
      <marker
        id={`arrowhead-${item._id}`}
        markerWidth="10"
        markerHeight="8"
        refX="9"
        refY="4"
        orient="auto"
      >
        <polygon points="0 0, 10 4, 0 8" fill={strokeColor} />
      </marker>
    </defs>
  );

  const getComputedFill = () => {
    if (fillStyle === "hachure" || fillStyle === "cross-hatch") return `url(#${patternId})`;
    if (fillStyle === "dots") return `url(#${dotPatternId})`;
    if (fillStyle === "solid") {
      return fillColor !== "transparent" ? fillColor : strokeColor + "20";
    }
    return "transparent";
  };

  // 8-Point Resize Handles
  const renderResizeHandles = () => {
    if (!isSelected || !isEditable || isLocked) return null;
    return (
      <>
        {/* Selection Bounding Box Ring */}
        <div className="absolute -inset-1 border-2 border-[#A3E635] rounded-xl pointer-events-none z-30 shadow-[0_0_12px_rgba(163,230,53,0.3)]" />

        {/* 4 Corner Handles */}
        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "nw")}
          className="absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center pointer-events-auto cursor-nwse-resize z-40 touch-none select-none"
        >
          <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
        </div>

        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "ne")}
          className="absolute -top-3.5 -right-3.5 w-7 h-7 flex items-center justify-center pointer-events-auto cursor-nesw-resize z-40 touch-none select-none"
        >
          <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
        </div>

        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "se")}
          className="absolute -bottom-3.5 -right-3.5 w-7 h-7 flex items-center justify-center pointer-events-auto cursor-nwse-resize z-40 touch-none select-none"
        >
          <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
        </div>

        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "sw")}
          className="absolute -bottom-3.5 -left-3.5 w-7 h-7 flex items-center justify-center pointer-events-auto cursor-nesw-resize z-40 touch-none select-none"
        >
          <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
        </div>

        {/* 4 Edge Midpoint Handles */}
        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "n")}
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-5 flex items-center justify-center pointer-events-auto cursor-ns-resize z-40 touch-none select-none"
        >
          <div className="w-2.5 h-2 bg-[#A3E635] border border-[#171512] rounded-sm" />
        </div>
        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "s")}
          className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-6 h-5 flex items-center justify-center pointer-events-auto cursor-ns-resize z-40 touch-none select-none"
        >
          <div className="w-2.5 h-2 bg-[#A3E635] border border-[#171512] rounded-sm" />
        </div>
        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "w")}
          className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-6 flex items-center justify-center pointer-events-auto cursor-ew-resize z-40 touch-none select-none"
        >
          <div className="w-2 h-2.5 bg-[#A3E635] border border-[#171512] rounded-sm" />
        </div>
        <div
          onPointerDown={(e) => onResizePointerDown(e, item, "e")}
          className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-6 flex items-center justify-center pointer-events-auto cursor-ew-resize z-40 touch-none select-none"
        >
          <div className="w-2 h-2.5 bg-[#A3E635] border border-[#171512] rounded-sm" />
        </div>

        {/* Live Dimension Indicator Badge */}
        {isResizing && (
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#171512] text-[#A3E635] border border-[#A3E635]/50 rounded-md text-[10px] font-mono shadow-2xl whitespace-nowrap z-50 pointer-events-none">
            {Math.round(w)} × {Math.round(h)} px
          </div>
        )}
      </>
    );
  };

  // Floating Context Action Bar
  const renderFloatingActionBar = () => {
    if (!isSelected || !isEditable || isLocked) return null;
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1 bg-[#1C1A17] border border-[#3E3832] rounded-xl shadow-2xl whitespace-nowrap animate-fade-in pointer-events-auto select-none"
      >
        <button
          onClick={() => onDuplicate(item)}
          title="Duplicate (Cmd+D)"
          className="p-1.5 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] rounded-lg transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDelete(item._id)}
          title="Delete (Delete / Backspace)"
          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {rotation !== 0 && (
          <span className="text-[10px] font-mono text-[#8A837A] px-1 border-l border-[#2E2924]">
            {Math.round(rotation)}°
          </span>
        )}
      </div>
    );
  };

  // Shared wrapper style
  const wrapperStyle: React.CSSProperties = {
    left: `${dim.x}px`,
    top: `${dim.y}px`,
    width: `${w}px`,
    height: `${h}px`,
    transform: `rotate(${rotation}deg)`,
    opacity,
    zIndex: item.zIndex || 5,
    touchAction: "none",
  };

  // 1. FREEHAND DRAWING
  if (item.type === "drawing") {
    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        style={wrapperStyle}
        className={`absolute cursor-move select-none ${isSelected ? "ring-1 ring-[#A3E635]" : ""}`}
      >
        {renderFloatingActionBar()}
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible pointer-events-none">
          <path
            d={item.content}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {renderResizeHandles()}
      </div>
    );
  }

  // 2. VECTOR SHAPES (Rectangle, Diamond, Circle, Arrow, Line)
  if (item.type === "shape") {
    const shapeType = meta.shapeType || item.content || "rectangle";
    const labelText = meta.label || (item.content !== shapeType ? item.content : "");

    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditingText(true);
        }}
        style={wrapperStyle}
        className="absolute cursor-move select-none"
      >
        {renderFloatingActionBar()}
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible pointer-events-none">
          {renderPatterns()}

          {shapeType === "rectangle" && (
            <rect
              x="2"
              y="2"
              width={Math.max(w - 4, 1)}
              height={Math.max(h - 4, 1)}
              rx={roughness === "clean" ? 12 : 6}
              fill={getComputedFill()}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
          )}

          {shapeType === "diamond" && (
            <polygon
              points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`}
              fill={getComputedFill()}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
          )}

          {shapeType === "circle" && (
            <ellipse
              cx={w / 2}
              cy={h / 2}
              rx={Math.max(w / 2 - 2, 1)}
              ry={Math.max(h / 2 - 2, 1)}
              fill={getComputedFill()}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
          )}

          {shapeType === "arrow" && (
            <line
              x1="4"
              y1={h / 2}
              x2={Math.max(w - 8, 4)}
              y2={h / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              markerEnd={`url(#arrowhead-${item._id})`}
            />
          )}

          {shapeType === "line" && (
            <line
              x1="4"
              y1={h / 2}
              x2={Math.max(w - 4, 4)}
              y2={h / 2}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={dashArray}
            />
          )}
        </svg>

        {/* Centered Inline Text Label */}
        {isEditingText ? (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-2 flex items-center justify-center z-30 pointer-events-auto"
          >
            <textarea
              autoFocus
              defaultValue={labelText}
              onBlur={(e) => {
                setIsEditingText(false);
                onUpdateContent(item._id, e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  setIsEditingText(false);
                  onUpdateContent(item._id, (e.target as HTMLTextAreaElement).value);
                }
              }}
              className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-xs font-mono text-center text-[#EDE6DD] placeholder-[#736B62]"
              placeholder="Type label..."
            />
          </div>
        ) : labelText ? (
          <div className="absolute inset-2 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-mono text-center text-[#EDE6DD] font-medium max-w-full break-words">
              {labelText}
            </span>
          </div>
        ) : null}

        {renderResizeHandles()}
      </div>
    );
  }

  // 3. STICKY NOTE
  if (item.type === "text_sticky") {
    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        style={{
          ...wrapperStyle,
          backgroundColor: item.color || "#FFE066",
        }}
        className={`absolute p-3 sm:p-4 rounded-sm shadow-xl font-hand cursor-move select-none ${
          isSelected ? "ring-2 ring-[#A3E635] ring-offset-2 ring-offset-black scale-[1.01]" : "hover:scale-[1.005]"
        }`}
      >
        {renderFloatingActionBar()}
        {isEditable && !isLocked ? (
          <textarea
            onPointerDown={(e) => e.stopPropagation()}
            value={item.content}
            onChange={(e) => onUpdateContent(item._id, e.target.value)}
            className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-sm font-hand text-black leading-snug cursor-text"
          />
        ) : (
          <p className="text-sm font-hand text-black leading-snug pointer-events-none">{item.content}</p>
        )}
        {renderResizeHandles()}
      </div>
    );
  }

  // 4. IMAGE NODE
  if (item.type === "image") {
    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        style={wrapperStyle}
        className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border transition-all cursor-move shadow-xl flex flex-col select-none ${
          isSelected ? "border-[#A3E635] ring-2 ring-[#A3E635]/50 scale-[1.01]" : "border-[#342D26] hover:border-[#4E443A]"
        }`}
      >
        {renderFloatingActionBar()}
        <img
          src={resolveMediaUrl(item.content)}
          alt={item.title || "Board Image"}
          className="w-full flex-1 min-h-0 object-cover pointer-events-none rounded-t-xl"
          draggable={false}
        />
        {meta.caption && (
          <div className="p-2 bg-[#1C1A17] text-[11px] font-mono text-[#8A837A] shrink-0 border-t border-[#2E2924] truncate pointer-events-none">
            {meta.caption}
          </div>
        )}
        {renderResizeHandles()}
      </div>
    );
  }

  // 5. AUDIO NODE
  if (item.type === "audio") {
    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        style={wrapperStyle}
        className={`absolute p-4 rounded-xl bg-[#241F1B] border border-[#342D26] shadow-xl flex flex-col gap-2 cursor-move select-none ${
          isSelected ? "border-[#A3E635] ring-2 ring-[#A3E635]/50" : ""
        }`}
      >
        {renderFloatingActionBar()}
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 text-xs font-mono text-[#A3E635]">
            <Music className="w-4 h-4" />
            <span className="truncate max-w-[180px]">{item.title || "Audio Memo"}</span>
          </div>
        </div>
        <audio
          src={resolveMediaUrl(item.content)}
          controls
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full h-8 pointer-events-auto"
        />
        {renderResizeHandles()}
      </div>
    );
  }

  // 6. VIDEO NODE
  if (item.type === "video") {
    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        style={wrapperStyle}
        className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border shadow-xl cursor-move flex flex-col select-none ${
          isSelected ? "border-[#A3E635]" : "border-[#342D26]"
        }`}
      >
        {renderFloatingActionBar()}
        <video
          src={resolveMediaUrl(item.content)}
          controls
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full flex-1 min-h-0 object-cover pointer-events-auto"
        />
        {renderResizeHandles()}
      </div>
    );
  }

  // 7. PDF NODE
  if (item.type === "pdf") {
    const pdfUrl = resolveMediaUrl(item.content);
    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        style={wrapperStyle}
        className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border shadow-xl cursor-move select-none ${
          isSelected ? "border-[#A3E635] ring-2 ring-[#A3E635]/50" : "border-[#3E3832] hover:border-[#4E443A]"
        }`}
      >
        {renderFloatingActionBar()}
        <div className="flex items-center justify-between px-3 py-2 bg-[#1C1A17] border-b border-[#2E2924] pointer-events-none">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-3.5 h-3.5 text-[#A3E635] shrink-0" />
            <span className="text-[11px] font-mono font-medium text-[#EDE6DD] truncate">
              {item.title || "Document.pdf"}
            </span>
          </div>
        </div>
        <iframe
          src={pdfUrl}
          title={item.title || "PDF Preview"}
          className="w-full h-[calc(100%-34px)] pointer-events-none"
          style={{ border: "none" }}
        />
        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-2 right-2 z-20 px-2 py-1 bg-[#171512]/90 border border-[#3E3832] rounded-lg text-[10px] font-mono text-[#A3E635] transition-colors pointer-events-auto"
        >
          Open PDF ↗
        </a>
        {renderResizeHandles()}
      </div>
    );
  }

  // 8. SECTION FRAME
  if (item.type === "frame") {
    return (
      <div
        onPointerDown={(e) => onItemPointerDown(e, item)}
        style={wrapperStyle}
        className={`absolute rounded-2xl border-2 border-dashed transition-shadow select-none ${
          isSelected
            ? "border-[#A3E635] bg-[#221E1A]/60 shadow-2xl"
            : "border-[#3D3630] bg-[#1C1A17]/30 hover:border-[#524941]"
        }`}
      >
        {renderFloatingActionBar()}
        <div className="flex items-center justify-between px-3 py-2 bg-[#221E1A] border-b border-[#2E2924] rounded-t-xl cursor-move pointer-events-none">
          <span className="text-xs font-mono font-semibold text-[#EDE6DD] truncate">
            {item.title || "Section Frame"}
          </span>
        </div>
        {renderResizeHandles()}
      </div>
    );
  }

  return null;
}
