"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { uploadMedia } from "@/lib/uploader";
import { resolveMediaUrl } from "@/lib/media";
import {
  MousePointer,
  Hand,
  StickyNote,
  Image as ImageIcon,
  Type,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Plus,
  Music,
  Video,
  FileText,
  Square,
  Sparkles,
  ArrowRight,
  Upload,
  CheckCircle,
  Loader2,
} from "lucide-react";

const STICKY_COLORS = [
  { name: "Yellow", bg: "#FFE066", text: "#4A3B00" },
  { name: "Pink", bg: "#FFB4C6", text: "#5C0A24" },
  { name: "Blue", bg: "#A9D8FF", text: "#073763" },
  { name: "Green", bg: "#B9F6CA", text: "#0B4620" },
  { name: "Purple", bg: "#E3C9FF", text: "#3B0764" },
  { name: "Orange", bg: "#FFD0A1", text: "#5C2E00" },
  { name: "Mint", bg: "#A9F0D1", text: "#063C2C" },
  { name: "Gray", bg: "#DCDDE3", text: "#2B2C33" },
];

export function StitchCanvas({
  projectId,
  isEditable = true,
  onNavigateToStage2,
}: {
  projectId: string;
  isEditable?: boolean;
  onNavigateToStage2?: () => void;
}) {
  const items = useQuery(api.stage1.getItemsByProject, { projectId });
  const addItemMutation = useMutation(api.stage1.addItem);
  const updateTransformMutation = useMutation(api.stage1.updateItemTransform);
  const updateContentMutation = useMutation(api.stage1.updateItemContent);
  const deleteItemMutation = useMutation(api.stage1.deleteItem);

  // Canvas Transform state
  const [transform, setTransform] = useState({ x: 120, y: 80, scale: 0.95 });
  const [activeTool, setActiveTool] = useState<"select" | "hand" | "sticky" | "text" | "frame">("select");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Handle Wheel Zoom & Trackpad Pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      if (e.ctrlKey || e.metaKey) {
        // Pinch Zoom
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setTransform((prev) => {
          const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.25), 2.5);
          const newX = mouseX - ((mouseX - prev.x) / prev.scale) * newScale;
          const newY = mouseY - ((mouseY - prev.y) / prev.scale) * newScale;
          return { x: newX, y: newY, scale: newScale };
        });
      } else {
        // Two finger Pan
        setTransform((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    []
  );

  // Pan Gestures (Middle click or Hand tool)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === "hand") {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      return;
    }

    if (e.target === containerRef.current || (e.target as HTMLElement).id === "canvas-plane") {
      setSelectedItemId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
      return;
    }

    if (draggedItemId && isEditable) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - transform.x) / transform.scale - dragOffset.x;
      const canvasY = (e.clientY - rect.top - transform.y) / transform.scale - dragOffset.y;

      updateTransformMutation({
        itemId: draggedItemId as any,
        x: Math.round(canvasX),
        y: Math.round(canvasY),
      }).catch(console.error);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedItemId(null);
  };

  // Convert Screen Coordinates to Canvas Coordinates
  const screenToCanvas = (screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 200, y: 200 };
    return {
      x: Math.round((screenX - rect.left - transform.x) / transform.scale),
      y: Math.round((screenY - rect.top - transform.y) / transform.scale),
    };
  };

  // Add Sticky Note
  const handleAddSticky = async () => {
    const pos = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
    const colorObj = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
    await addItemMutation({
      projectId,
      type: "text_sticky",
      x: pos.x - 100,
      y: pos.y - 70,
      width: 220,
      height: 150,
      rotation: Math.round((Math.random() * 4 - 2) * 10) / 10,
      zIndex: 10,
      color: colorObj.bg,
      content: "Write research insight or thought here...",
      title: "Process Note",
    });
  };

  // Add Section Frame
  const handleAddFrame = async () => {
    const pos = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
    await addItemMutation({
      projectId,
      type: "frame",
      x: pos.x - 200,
      y: pos.y - 150,
      width: 540,
      height: 380,
      zIndex: 1,
      content: "Frame: Mood & Material Exploration",
      title: "Frame 01",
    });
  };

  // Handle Multi-File Drop onto Canvas
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditable) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const dropPos = screenToCanvas(e.clientX, e.clientY);

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadMedia(file, { folder: `projects/${projectId}/stage1` });

        let itemType: any = "image";
        if (res.type === "video") itemType = "video";
        if (res.type === "audio") itemType = "audio";
        if (res.type === "pdf") itemType = "pdf";

        await addItemMutation({
          projectId,
          type: itemType,
          x: dropPos.x + i * 40,
          y: dropPos.y + i * 40,
          width: itemType === "audio" ? 280 : 320,
          height: itemType === "audio" ? 120 : 220,
          rotation: Math.round((Math.random() * 2 - 1) * 10) / 10,
          zIndex: 5,
          content: res.url,
          title: file.name,
          metadata: {
            caption: file.name,
            fileSize: res.size,
          },
        });
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload file to canvas: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle File Upload Button
  const handleFileUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const centerPos = screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadMedia(file, { folder: `projects/${projectId}/stage1` });

        let itemType: any = "image";
        if (res.type === "video") itemType = "video";
        if (res.type === "audio") itemType = "audio";
        if (res.type === "pdf") itemType = "pdf";

        await addItemMutation({
          projectId,
          type: itemType,
          x: centerPos.x + i * 30,
          y: centerPos.y + i * 30,
          width: itemType === "audio" ? 280 : 320,
          height: itemType === "audio" ? 120 : 220,
          rotation: 0,
          zIndex: 5,
          content: res.url,
          title: file.name,
        });
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full h-[78vh] sm:h-[82vh] bg-[#171512] overflow-hidden select-none border border-[#2E2924] rounded-2xl shadow-2xl flex flex-col">
      {/* Top Canvas Bar */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1916]/90 backdrop-blur-md border border-[#2E2924] rounded-xl text-xs font-mono text-[#EDE6DD] shadow-lg">
          <div className="flex gap-1.5 mr-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            <span className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <span className="font-semibold">Stage 1: Foundation</span>
          <span className="text-[#7E776F]">·</span>
          <span className="text-[#8A837A]">Google Stitch Board</span>
          <span className="text-[10px] text-[#A3E635] bg-[#A3E635]/15 px-2 py-0.5 rounded-full font-mono">
            {items?.length || 0} nodes
          </span>
        </div>
      </div>

      {/* Floating Minimal Tool Palette */}
      {isEditable && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 p-1.5 bg-[#1C1916]/90 backdrop-blur-md border border-[#2E2924] rounded-2xl shadow-xl">
          {/* Select Tool */}
          <button
            onClick={() => setActiveTool("select")}
            title="Select & Move (V)"
            className={`p-2 rounded-xl transition-all ${
              activeTool === "select"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#2A2521]"
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Pan Tool */}
          <button
            onClick={() => setActiveTool("hand")}
            title="Pan Canvas (H / Space+Drag)"
            className={`p-2 rounded-xl transition-all ${
              activeTool === "hand"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#2A2521]"
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-[#2E2924] mx-1" />

          {/* Add Sticky Note */}
          <button
            onClick={handleAddSticky}
            title="Add Sticky Note (N)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#241F1B] hover:bg-[#2F2923] text-xs font-sans text-[#EDE6DD] border border-[#3E3832] transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5 text-[#FFE066]" />
            <span className="hidden sm:inline">Sticky</span>
          </button>

          {/* Upload Any Media */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Media (Images, Video, Audio, PDF)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#241F1B] hover:bg-[#2F2923] text-xs font-sans text-[#EDE6DD] border border-[#3E3832] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#A3E635]" />
            <span className="hidden sm:inline">Media</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf"
            onChange={handleFileUploadInput}
            className="hidden"
          />

          {/* Add Section Frame */}
          <button
            onClick={handleAddFrame}
            title="Add Section Frame Group"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#241F1B] hover:bg-[#2F2923] text-xs font-sans text-[#EDE6DD] border border-[#3E3832] transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-[#A9D8FF]" />
            <span className="hidden sm:inline">Frame</span>
          </button>

          <div className="w-[1px] h-5 bg-[#2E2924] mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.2, 2.5) }))}
            className="p-2 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#2A2521] rounded-xl transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-[#7E776F] px-1">
            {Math.round(transform.scale * 100)}%
          </span>
          <button
            onClick={() => setTransform((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.25) }))}
            className="p-2 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#2A2521] rounded-xl transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTransform({ x: 120, y: 80, scale: 0.95 })}
            title="Reset Canvas"
            className="p-2 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#2A2521] rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Uploading indicator */}
      {isUploading && (
        <div className="absolute top-16 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-[#A3E635] text-[#171512] rounded-xl text-xs font-semibold shadow-xl animate-bounce">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Compressing & placing on canvas...</span>
        </div>
      )}

      {/* Main Infinite Canvas Plane */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className={`relative flex-1 w-full h-full canvas-grid ${
          activeTool === "hand" || isPanning ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
      >
        <div
          id="canvas-plane"
          className="absolute inset-0 origin-top-left"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* Render All Canvas Items */}
          {items &&
            items.map((item) => {
              const isSelected = selectedItemId === item._id;

              const handleItemMouseDown = (e: React.MouseEvent) => {
                if (activeTool === "hand" || e.button === 1) return;
                e.stopPropagation();
                setSelectedItemId(item._id);

                if (isEditable) {
                  setDraggedItemId(item._id);
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const mouseCanvasX = (e.clientX - rect.left - transform.x) / transform.scale;
                  const mouseCanvasY = (e.clientY - rect.top - transform.y) / transform.scale;
                  setDragOffset({
                    x: mouseCanvasX - item.x,
                    y: mouseCanvasY - item.y,
                  });
                }
              };

              // 1. Frame / Section Node
              if (item.type === "frame") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      height: item.height,
                      zIndex: item.zIndex || 1,
                    }}
                    className={`absolute rounded-2xl border-2 border-dashed transition-shadow ${
                      isSelected
                        ? "border-[#A3E635] bg-[#221E1A]/60 shadow-2xl"
                        : "border-[#3D3630] bg-[#1C1A17]/30 hover:border-[#524941]"
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-2 bg-[#221E1A] border-b border-[#2E2924] rounded-t-xl cursor-move">
                      <span className="text-xs font-mono font-semibold text-[#EDE6DD]">
                        {item.title || "Section Frame"}
                      </span>
                      {isSelected && isEditable && (
                        <button
                          onClick={() => deleteItemMutation({ itemId: item._id as any })}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // 2. Sticky Note
              if (item.type === "text_sticky") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      minHeight: item.height,
                      transform: `rotate(${item.rotation || 0}deg)`,
                      backgroundColor: item.color || "#FFE066",
                      zIndex: item.zIndex || 10,
                    }}
                    className={`absolute p-4 rounded-sm shadow-xl transition-transform font-hand cursor-move ${
                      isSelected ? "ring-2 ring-[#A3E635] ring-offset-2 ring-offset-black scale-[1.02]" : "hover:scale-[1.01]"
                    }`}
                  >
                    {isSelected && isEditable && (
                      <div className="absolute -top-3 -right-3 flex items-center gap-1 z-30 bg-[#171512] p-1 rounded-full border border-[#3E3832]">
                        <button
                          onClick={() => deleteItemMutation({ itemId: item._id as any })}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {isEditable ? (
                      <textarea
                        value={item.content}
                        onChange={(e) =>
                          updateContentMutation({
                            itemId: item._id as any,
                            content: e.target.value,
                          })
                        }
                        className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-sm font-hand text-black leading-snug"
                      />
                    ) : (
                      <p className="text-sm font-hand text-black leading-snug">{item.content}</p>
                    )}
                  </div>
                );
              }

              // 3. Image Node
              if (item.type === "image") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      transform: `rotate(${item.rotation || 0}deg)`,
                      zIndex: item.zIndex || 5,
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border transition-all cursor-move shadow-xl ${
                      isSelected ? "border-[#A3E635] ring-2 ring-[#A3E635]/50 scale-[1.02]" : "border-[#342D26] hover:border-[#4E443A]"
                    }`}
                  >
                    {isSelected && isEditable && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-30 bg-[#171512]/90 p-1 rounded-lg border border-[#3E3832]">
                        <button
                          onClick={() => deleteItemMutation({ itemId: item._id as any })}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <img
                      src={resolveMediaUrl(item.content)}
                      alt={item.title || "Moodboard Image"}
                      className="w-full h-auto object-cover pointer-events-none rounded-t-xl"
                    />
                    {item.metadata?.caption && (
                      <div className="p-2.5 bg-[#1C1A17] text-[11px] font-mono text-[#8A837A]">
                        {item.metadata.caption}
                      </div>
                    )}
                  </div>
                );
              }

              // 4. Audio Node
              if (item.type === "audio") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      zIndex: item.zIndex || 5,
                    }}
                    className={`absolute p-4 rounded-xl bg-[#241F1B] border border-[#342D26] shadow-xl flex flex-col gap-2 cursor-move ${
                      isSelected ? "border-[#A3E635] ring-2 ring-[#A3E635]/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#A3E635]">
                        <Music className="w-4 h-4" />
                        <span className="truncate max-w-[180px]">{item.title || "Audio Memo"}</span>
                      </div>
                      {isSelected && isEditable && (
                        <button
                          onClick={() => deleteItemMutation({ itemId: item._id as any })}
                          className="p-1 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <audio src={resolveMediaUrl(item.content)} controls className="w-full h-8" />
                  </div>
                );
              }

              // 5. Video Node
              if (item.type === "video") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      zIndex: item.zIndex || 5,
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border shadow-xl cursor-move ${
                      isSelected ? "border-[#A3E635]" : "border-[#342D26]"
                    }`}
                  >
                    {isSelected && isEditable && (
                      <div className="absolute top-2 right-2 z-30">
                        <button
                          onClick={() => deleteItemMutation({ itemId: item._id as any })}
                          className="p-1 rounded bg-[#171512] text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <video src={resolveMediaUrl(item.content)} controls className="w-full h-auto" />
                  </div>
                );
              }

              // 6. PDF Node
              if (item.type === "pdf") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: item.x,
                      top: item.y,
                      width: 240,
                      zIndex: item.zIndex || 5,
                    }}
                    className="absolute p-3.5 rounded-xl bg-[#241F1B] border border-[#3E3832] shadow-xl flex items-center gap-3 cursor-move"
                  >
                    <FileText className="w-8 h-8 text-[#A3E635]" />
                    <div className="truncate flex-1">
                      <div className="text-xs font-medium text-[#EDE6DD] truncate">
                        {item.title || "Document.pdf"}
                      </div>
                      <a
                        href={resolveMediaUrl(item.content)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#A3E635] underline"
                      >
                        View PDF
                      </a>
                    </div>
                  </div>
                );
              }

              return null;
            })}
        </div>
      </div>

      {/* Bottom Stage 1 Footer & Next Stage Action */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="px-3.5 py-1.5 bg-[#171512]/90 backdrop-blur-md border border-[#2E2924] rounded-xl text-xs font-mono text-[#8A837A] pointer-events-auto shadow-lg hidden sm:flex items-center gap-2">
          <span>Pan: Space+Drag or Hand</span>
          <span>·</span>
          <span>Zoom: Mouse Wheel</span>
          <span>·</span>
          <span>Drop files directly onto canvas</span>
        </div>

        {onNavigateToStage2 && (
          <button
            onClick={onNavigateToStage2}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-[#A3E635] hover:bg-[#65A30D] text-[#171512] font-semibold text-xs rounded-xl transition-all shadow-lg active:scale-95 ml-auto"
          >
            <span>Proceed to Stage 2: Development</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
