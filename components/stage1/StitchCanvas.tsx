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

type ResizeHandleType = "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w";

interface ResizingState {
  itemId: string;
  handle: ResizeHandleType;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
}

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

  // Resizing state
  const [resizingState, setResizingState] = useState<ResizingState | null>(null);
  const [localDimensions, setLocalDimensions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});

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

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    item: any,
    handle: ResizeHandleType
  ) => {
    if (!isEditable) return;
    e.stopPropagation();
    e.preventDefault();

    const currentDim = localDimensions[item._id] || {
      x: item.x,
      y: item.y,
      width: item.width || (item.type === "pdf" ? 300 : item.type === "audio" ? 280 : 260),
      height: item.height || (item.type === "pdf" ? 360 : item.type === "audio" ? 100 : 200),
    };

    setResizingState({
      itemId: item._id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentDim.x,
      initialY: currentDim.y,
      initialWidth: currentDim.width,
      initialHeight: currentDim.height,
    });
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

    // Handle Active Resizing
    if (resizingState && isEditable) {
      const dx = (e.clientX - resizingState.startX) / transform.scale;
      const dy = (e.clientY - resizingState.startY) / transform.scale;

      let newWidth = resizingState.initialWidth;
      let newHeight = resizingState.initialHeight;
      let newX = resizingState.initialX;
      let newY = resizingState.initialY;

      const minW = 80;
      const minH = 50;

      if (resizingState.handle.includes("e")) {
        newWidth = Math.max(minW, Math.round(resizingState.initialWidth + dx));
      }
      if (resizingState.handle.includes("s")) {
        newHeight = Math.max(minH, Math.round(resizingState.initialHeight + dy));
      }
      if (resizingState.handle.includes("w")) {
        const rawW = resizingState.initialWidth - dx;
        newWidth = Math.max(minW, Math.round(rawW));
        newX = Math.round(resizingState.initialX + (resizingState.initialWidth - newWidth));
      }
      if (resizingState.handle.includes("n")) {
        const rawH = resizingState.initialHeight - dy;
        newHeight = Math.max(minH, Math.round(rawH));
        newY = Math.round(resizingState.initialY + (resizingState.initialHeight - newHeight));
      }

      setLocalDimensions((prev) => ({
        ...prev,
        [resizingState.itemId]: {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      }));
      return;
    }

    // Handle Active Dragging
    if (draggedItemId && isEditable) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - transform.x) / transform.scale - dragOffset.x;
      const canvasY = (e.clientY - rect.top - transform.y) / transform.scale - dragOffset.y;

      const roundedX = Math.round(canvasX);
      const roundedY = Math.round(canvasY);

      setLocalDimensions((prev) => {
        const current = prev[draggedItemId] || { width: 240, height: 180 };
        return {
          ...prev,
          [draggedItemId]: {
            ...current,
            x: roundedX,
            y: roundedY,
          },
        };
      });

      updateTransformMutation({
        itemId: draggedItemId as any,
        x: roundedX,
        y: roundedY,
      }).catch(console.error);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    // Commit final resize dimensions to Convex
    if (resizingState) {
      const dim = localDimensions[resizingState.itemId];
      if (dim) {
        updateTransformMutation({
          itemId: resizingState.itemId as any,
          x: dim.x,
          y: dim.y,
          width: dim.width,
          height: dim.height,
        }).catch(console.error);
      }
      setResizingState(null);
    }

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
          height: itemType === "audio" ? 120 : 240,
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
          height: itemType === "audio" ? 120 : 240,
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
          <span className="text-[#8A837A]">Stitch Canvas</span>
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
              const isResizingThis = resizingState?.itemId === item._id;

              // Current dimension with live local preview override
              const dim = localDimensions[item._id] || {
                x: item.x,
                y: item.y,
                width: item.width || (item.type === "pdf" ? 300 : item.type === "audio" ? 280 : 260),
                height: item.height || (item.type === "pdf" ? 360 : item.type === "audio" ? 100 : 200),
              };

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
                    x: mouseCanvasX - dim.x,
                    y: mouseCanvasY - dim.y,
                  });
                }
              };

              // Reusable Resize Handles Overlay
              const renderResizeHandles = () => {
                if (!isSelected || !isEditable) return null;
                return (
                  <>
                    {/* Selection border ring */}
                    <div className="absolute -inset-1 border-2 border-[#A3E635] rounded-xl pointer-events-none z-30" />

                    {/* 4 Corner handles */}
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "nw")}
                      className="absolute -top-2 -left-2 w-3.5 h-3.5 bg-[#A3E635] border-2 border-[#171512] rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Top-Left"
                    />
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "ne")}
                      className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-[#A3E635] border-2 border-[#171512] rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Top-Right"
                    />
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "se")}
                      className="absolute -bottom-2 -right-2 w-3.5 h-3.5 bg-[#A3E635] border-2 border-[#171512] rounded-sm pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Bottom-Right"
                    />
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "sw")}
                      className="absolute -bottom-2 -left-2 w-3.5 h-3.5 bg-[#A3E635] border-2 border-[#171512] rounded-sm pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Bottom-Left"
                    />

                    {/* 4 Edge handles */}
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "n")}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#A3E635] border border-[#171512] rounded-full pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Top"
                    />
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "s")}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#A3E635] border border-[#171512] rounded-full pointer-events-auto cursor-ns-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Bottom"
                    />
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "w")}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-4 bg-[#A3E635] border border-[#171512] rounded-full pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Left"
                    />
                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "e")}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-[#A3E635] border border-[#171512] rounded-full pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform z-40 shadow-md"
                      title="Resize Right"
                    />

                    {/* Live Dimension Indicator Badge */}
                    {isResizingThis && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#171512] text-[#A3E635] border border-[#A3E635]/50 rounded-md text-[10px] font-mono shadow-xl whitespace-nowrap z-50">
                        {dim.width} × {dim.height} px
                      </div>
                    )}
                  </>
                );
              };

              // 1. Frame / Section Node
              if (item.type === "frame") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height,
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
                          className="p-1 text-red-400 hover:text-red-300 pointer-events-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {renderResizeHandles()}
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
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height,
                      minHeight: dim.height,
                      transform: `rotate(${item.rotation || 0}deg)`,
                      backgroundColor: item.color || "#FFE066",
                      zIndex: item.zIndex || 10,
                    }}
                    className={`absolute p-4 rounded-sm shadow-xl font-hand cursor-move ${
                      isSelected ? "ring-2 ring-[#A3E635] ring-offset-2 ring-offset-black scale-[1.01]" : "hover:scale-[1.005]"
                    }`}
                  >
                    {isSelected && isEditable && (
                      <div className="absolute -top-3 -right-3 flex items-center gap-1 z-50 bg-[#171512] p-1 rounded-full border border-[#3E3832]">
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
                        onFocus={() => setSelectedItemId(item._id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item._id);
                        }}
                        value={item.content}
                        onChange={(e) =>
                          updateContentMutation({
                            itemId: item._id as any,
                            content: e.target.value,
                          })
                        }
                        className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-sm font-hand text-black leading-snug cursor-text"
                      />
                    ) : (
                      <p className="text-sm font-hand text-black leading-snug">{item.content}</p>
                    )}
                    {renderResizeHandles()}
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
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height ? `${dim.height}px` : "auto",
                      transform: `rotate(${item.rotation || 0}deg)`,
                      zIndex: item.zIndex || 5,
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border transition-all cursor-move shadow-xl flex flex-col ${
                      isSelected ? "border-[#A3E635] ring-2 ring-[#A3E635]/50 scale-[1.01]" : "border-[#342D26] hover:border-[#4E443A]"
                    }`}
                  >
                    {isSelected && isEditable && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-50 bg-[#171512]/90 p-1 rounded-lg border border-[#3E3832]">
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
                      className="w-full flex-1 min-h-0 object-cover pointer-events-none rounded-t-xl"
                    />
                    {item.metadata?.caption && (
                      <div className="p-2 bg-[#1C1A17] text-[11px] font-mono text-[#8A837A] shrink-0 border-t border-[#2E2924]">
                        {item.metadata.caption}
                      </div>
                    )}
                    {renderResizeHandles()}
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
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
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
                    {renderResizeHandles()}
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
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height ? `${dim.height}px` : "auto",
                      zIndex: item.zIndex || 5,
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border shadow-xl cursor-move flex flex-col ${
                      isSelected ? "border-[#A3E635]" : "border-[#342D26]"
                    }`}
                  >
                    {isSelected && isEditable && (
                      <div className="absolute top-2 right-2 z-50">
                        <button
                          onClick={() => deleteItemMutation({ itemId: item._id as any })}
                          className="p-1 rounded bg-[#171512] text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <video src={resolveMediaUrl(item.content)} controls className="w-full flex-1 min-h-0 object-cover" />
                    {renderResizeHandles()}
                  </div>
                );
              }

              // 6. PDF Node
              if (item.type === "pdf") {
                const pdfUrl = resolveMediaUrl(item.content);
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height,
                      zIndex: item.zIndex || 5,
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border shadow-xl cursor-move ${
                      isSelected
                        ? "border-[#A3E635] ring-2 ring-[#A3E635]/50"
                        : "border-[#3E3832] hover:border-[#4E443A]"
                    }`}
                  >
                    <div className="flex items-center justify-between px-3 py-2 bg-[#1C1A17] border-b border-[#2E2924]">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#A3E635] shrink-0" />
                        <span className="text-[11px] font-mono font-medium text-[#EDE6DD] truncate">
                          {item.title || "Document.pdf"}
                        </span>
                      </div>
                      {isSelected && isEditable && (
                        <button
                          onClick={() => deleteItemMutation({ itemId: item._id as any })}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
                      className="absolute bottom-2 right-2 z-20 px-2 py-1 bg-[#171512]/90 border border-[#3E3832] rounded-lg text-[10px] font-mono text-[#A3E635] transition-colors"
                    >
                      Open PDF ↗
                    </a>
                    {renderResizeHandles()}
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
          <span>Select element to drag & resize corners/edges</span>
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
