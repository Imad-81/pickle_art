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
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  Pen,
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Lock,
  Unlock,
  MoreVertical,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scan,
  X,
  Music,
  Video,
  FileText,
  Copy,
  Layers,
  Palette,
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

const PEN_COLORS = [
  { name: "Lime", color: "#A3E635" },
  { name: "Rose", color: "#C97B84" },
  { name: "Moss", color: "#386641" },
  { name: "Amber", color: "#E08B3F" },
  { name: "Sky", color: "#60A5FA" },
  { name: "White", color: "#F5EFEB" },
  { name: "Charcoal", color: "#2E2924" },
];

type ToolType =
  | "select"
  | "hand"
  | "rectangle"
  | "diamond"
  | "circle"
  | "arrow"
  | "line"
  | "pen"
  | "pencil"
  | "sticky"
  | "frame"
  | "eraser";

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

interface HistoryAction {
  type: "add" | "delete" | "transform" | "update";
  itemId: string;
  previousState?: any;
  nextState?: any;
}

function pointsToSvgPath(points: Array<{ x: number; y: number }>) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function sanitizeItemForAdd(item: any) {
  if (!item) return item;
  const { _id, _creationTime, createdAt, updatedAt, ...rest } = item;
  return rest;
}

export function StitchCanvas({
  projectId,
  stage = "stage1",
  isEditable = true,
  onNavigateToStage2,
  onNavigateToOutput,
  onNavigateNext,
  nextLabel,
  onSwitchToPosts,
}: {
  projectId: string;
  stage?: "stage1" | "stage2";
  isEditable?: boolean;
  onNavigateToStage2?: () => void;
  onNavigateToOutput?: () => void;
  onNavigateNext?: () => void;
  nextLabel?: string;
  onSwitchToPosts?: () => void;
}) {
  const stage1Items = useQuery(
    api.stage1.getItemsByProject,
    stage === "stage1" ? { projectId } : "skip"
  );
  const stage2Items = useQuery(
    api.stage2.getCanvasItemsByProject,
    stage === "stage2" ? { projectId } : "skip"
  );
  const items = stage === "stage2" ? stage2Items : stage1Items;

  const addStage1Item = useMutation(api.stage1.addItem);
  const addStage2Item = useMutation(api.stage2.addCanvasItem);

  const updateStage1Transform = useMutation(api.stage1.updateItemTransform);
  const updateStage2Transform = useMutation(api.stage2.updateCanvasItemTransform);

  const updateStage1Content = useMutation(api.stage1.updateItemContent);
  const updateStage2Content = useMutation(api.stage2.updateCanvasItemContent);

  const deleteStage1Item = useMutation(api.stage1.deleteItem);
  const deleteStage2Item = useMutation(api.stage2.deleteCanvasItem);

  const addItemMutation = (args: any) =>
    stage === "stage2" ? addStage2Item(args) : addStage1Item(args);
  const updateTransformMutation = (args: any) =>
    stage === "stage2" ? updateStage2Transform(args) : updateStage1Transform(args);
  const updateContentMutation = (args: any) =>
    stage === "stage2" ? updateStage2Content(args) : updateStage1Content(args);
  const deleteItemMutation = (args: any) =>
    stage === "stage2" ? deleteStage2Item(args) : deleteStage1Item(args);

  // Canvas Transform state
  const [transform, setTransform] = useState({ x: 80, y: 60, scale: 0.9 });
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [isLocked, setIsLocked] = useState(false);
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time Freehand Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [penColor, setPenColor] = useState("#A3E635");
  const [isPenColorPickerOpen, setPenColorPickerOpen] = useState(false);

  // Shape creation drag state
  const [shapeDragStart, setShapeDragStart] = useState<{ x: number; y: number } | null>(null);
  const [shapeDragCurrent, setShapeDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // Undo / Redo History Stack
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  // Resizing state
  const [resizingState, setResizingState] = useState<ResizingState | null>(null);
  const [localDimensions, setLocalDimensions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});

  const containerRef = useRef<HTMLDivElement>(null);
  const rootWrapperRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-Touch tracking ref for pinch zoom and touch pan
  const touchStateRef = useRef<{
    mode: "none" | "pan" | "pinch" | "drag_item" | "resize_item" | "draw" | "shape";
    initialPinchDist: number;
    initialScale: number;
    initialPinchCenter: { x: number; y: number };
    initialTransform: { x: number; y: number; scale: number };
    panStart: { x: number; y: number };
    lastTapTime: number;
  }>({
    mode: "none",
    initialPinchDist: 0,
    initialScale: 1,
    initialPinchCenter: { x: 0, y: 0 },
    initialTransform: { x: 0, y: 0, scale: 1 },
    panStart: { x: 0, y: 0 },
    lastTapTime: 0,
  });

  // Convert Screen Coordinates to Canvas Coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 200, y: 200 };
      return {
        x: Math.round((screenX - rect.left - transform.x) / transform.scale),
        y: Math.round((screenY - rect.top - transform.y) / transform.scale),
      };
    },
    [transform]
  );

  // Smart Fit To Screen (Overview Framing)
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerW = rect.width || window.innerWidth;
    const containerH = rect.height || window.innerHeight;

    if (!items || items.length === 0) {
      setTransform({
        x: Math.round(containerW / 2 - 100),
        y: Math.round(containerH / 2 - 80),
        scale: 0.95,
      });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    items.forEach((item) => {
      const dim = localDimensions[item._id] || {
        x: item.x,
        y: item.y,
        width: item.width || (item.type === "pdf" ? 300 : item.type === "audio" ? 280 : 260),
        height: item.height || (item.type === "pdf" ? 360 : item.type === "audio" ? 100 : 200),
      };
      minX = Math.min(minX, dim.x);
      minY = Math.min(minY, dim.y);
      maxX = Math.max(maxX, dim.x + dim.width);
      maxY = Math.max(maxY, dim.y + dim.height);
    });

    const boardW = Math.max(maxX - minX, 100) + 140;
    const boardH = Math.max(maxY - minY, 100) + 160;

    const scaleX = containerW / boardW;
    const scaleY = containerH / boardH;
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.25), 1.25);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newX = Math.round(containerW / 2 - centerX * newScale);
    const newY = Math.round(containerH / 2 - centerY * newScale);

    setTransform({ x: newX, y: newY, scale: newScale });
  }, [items, localDimensions]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!rootWrapperRef.current) {
      setIsFullscreen((prev) => !prev);
      return;
    }

    if (!document.fullscreenElement) {
      rootWrapperRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen(true));
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // DELETE SELECTED ITEM
  const handleDeleteSelected = useCallback(async () => {
    if (!selectedItemId || !isEditable || isLocked) return;
    const itemToDelete = items?.find((i) => i._id === selectedItemId);
    if (!itemToDelete) return;

    await deleteItemMutation({ itemId: selectedItemId as any });
    setUndoStack((prev) => [
      ...prev,
      { type: "delete", itemId: selectedItemId, previousState: itemToDelete },
    ]);
    setSelectedItemId(null);
  }, [selectedItemId, isEditable, isLocked, items, deleteItemMutation]);

  // DUPLICATE SELECTED ITEM
  const handleDuplicateSelected = useCallback(async () => {
    if (!selectedItemId || !isEditable || isLocked) return;
    const item = items?.find((i) => i._id === selectedItemId);
    if (!item) return;

    const dim = localDimensions[item._id] || {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    };

    const newId = await addItemMutation({
      projectId,
      type: item.type,
      x: dim.x + 30,
      y: dim.y + 30,
      width: dim.width,
      height: dim.height,
      rotation: item.rotation || 0,
      zIndex: (item.zIndex || 5) + 1,
      color: item.color,
      content: item.content,
      title: item.title ? `${item.title} (Copy)` : undefined,
      metadata: item.metadata,
    });

    setUndoStack((prev) => [
      ...prev,
      {
        type: "add",
        itemId: newId,
        nextState: {
          projectId,
          type: item.type,
          x: dim.x + 30,
          y: dim.y + 30,
          width: dim.width,
          height: dim.height,
          color: item.color,
          content: item.content,
        },
      },
    ]);
    setSelectedItemId(newId);
  }, [selectedItemId, isEditable, isLocked, items, localDimensions, projectId, addItemMutation]);

  // UNDO & REDO Logic
  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (action.type === "add") {
      await deleteItemMutation({ itemId: action.itemId as any });
      setRedoStack((prev) => [...prev, action]);
      if (selectedItemId === action.itemId) setSelectedItemId(null);
    } else if (action.type === "delete" && action.previousState) {
      const restoredId = await addItemMutation(sanitizeItemForAdd(action.previousState));
      setRedoStack((prev) => [...prev, { ...action, itemId: restoredId }]);
    } else if (action.type === "transform" && action.previousState) {
      await updateTransformMutation({
        itemId: action.itemId as any,
        x: action.previousState.x,
        y: action.previousState.y,
        width: action.previousState.width,
        height: action.previousState.height,
      });
      setRedoStack((prev) => [...prev, action]);
    }
  }, [undoStack, deleteItemMutation, addItemMutation, updateTransformMutation, selectedItemId]);

  const handleRedo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    if (action.type === "add" && action.nextState) {
      const id = await addItemMutation(sanitizeItemForAdd(action.nextState));
      setUndoStack((prev) => [...prev, { ...action, itemId: id }]);
    } else if (action.type === "delete") {
      await deleteItemMutation({ itemId: action.itemId as any });
      setUndoStack((prev) => [...prev, action]);
      if (selectedItemId === action.itemId) setSelectedItemId(null);
    } else if (action.type === "transform" && action.nextState) {
      await updateTransformMutation({
        itemId: action.itemId as any,
        x: action.nextState.x,
        y: action.nextState.y,
        width: action.nextState.width,
        height: action.nextState.height,
      });
      setUndoStack((prev) => [...prev, action]);
    }
  }, [redoStack, addItemMutation, deleteItemMutation, updateTransformMutation, selectedItemId]);

  // Handle Wheel Zoom & Trackpad Pan
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    if (e.ctrlKey || e.metaKey) {
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
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  // Add Sticky Note
  const handleAddSticky = useCallback(async () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
    const pos = screenToCanvas(centerX, centerY);
    const colorObj = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
    const id = await addItemMutation({
      projectId,
      type: "text_sticky",
      x: pos.x - 110,
      y: pos.y - 75,
      width: 220,
      height: 150,
      rotation: Math.round((Math.random() * 4 - 2) * 10) / 10,
      zIndex: 10,
      color: colorObj.bg,
      content:
        stage === "stage2"
          ? "Write iteration note, material test log, or dimension spec..."
          : "Write research insight or thought here...",
      title: stage === "stage2" ? "Dev Note" : "Process Note",
    });
    setUndoStack((prev) => [
      ...prev,
      {
        type: "add",
        itemId: id,
        nextState: {
          projectId,
          type: "text_sticky",
          x: pos.x - 110,
          y: pos.y - 75,
          width: 220,
          height: 150,
          color: colorObj.bg,
          content: "Process Note",
        },
      },
    ]);
    setSelectedItemId(id);
    setActiveTool("select");
  }, [projectId, stage, addItemMutation, screenToCanvas]);

  // Add Section Frame
  const handleAddFrame = useCallback(async () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
    const pos = screenToCanvas(centerX, centerY);
    const id = await addItemMutation({
      projectId,
      type: "frame",
      x: pos.x - 190,
      y: pos.y - 140,
      width: 380,
      height: 280,
      zIndex: 1,
      content:
        stage === "stage2"
          ? "Frame: Prototypes & Variant Tests"
          : "Frame: Mood & Material Exploration",
      title: stage === "stage2" ? "Dev Frame 01" : "Frame 01",
    });
    setUndoStack((prev) => [
      ...prev,
      {
        type: "add",
        itemId: id,
        nextState: {
          projectId,
          type: "frame",
          x: pos.x - 190,
          y: pos.y - 140,
          width: 380,
          height: 280,
          zIndex: 1,
        },
      },
    ]);
    setSelectedItemId(id);
    setActiveTool("select");
  }, [projectId, stage, addItemMutation, screenToCanvas]);

  // COMPLETE SHAPE CREATION
  const handleShapeComplete = useCallback(
    async (start: { x: number; y: number }, end: { x: number; y: number }, shapeType: string) => {
      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const rawW = Math.abs(end.x - start.x);
      const rawH = Math.abs(end.y - start.y);

      const isClick = rawW < 12 && rawH < 12;
      let finalW = isClick ? (shapeType === "arrow" || shapeType === "line" ? 220 : 180) : Math.max(rawW, 20);
      let finalH = isClick ? (shapeType === "arrow" || shapeType === "line" ? 50 : 120) : Math.max(rawH, 20);
      let finalX = isClick ? start.x - finalW / 2 : minX;
      let finalY = isClick ? start.y - finalH / 2 : minY;

      const newItemId = await addItemMutation({
        projectId,
        type: "shape",
        x: Math.round(finalX),
        y: Math.round(finalY),
        width: Math.round(finalW),
        height: Math.round(finalH),
        zIndex: 6,
        color: penColor,
        content: shapeType,
        metadata: {
          shapeType,
          strokeWidth: shapeType === "arrow" || shapeType === "line" ? 3 : 2.5,
        },
      });

      setUndoStack((prev) => [
        ...prev,
        {
          type: "add",
          itemId: newItemId,
          nextState: {
            projectId,
            type: "shape",
            x: Math.round(finalX),
            y: Math.round(finalY),
            width: Math.round(finalW),
            height: Math.round(finalH),
            color: penColor,
            content: shapeType,
          },
        },
      ]);

      setSelectedItemId(newItemId);
      setActiveTool("select");
    },
    [addItemMutation, penColor, projectId]
  );

  // Complete Drawing Stroke
  const handleDrawingComplete = useCallback(async () => {
    if (currentDrawingPoints.length < 2) {
      setCurrentDrawingPoints([]);
      return;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    currentDrawingPoints.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    const pad = 6;
    const strokeW = activeTool === "pencil" ? 1.5 : 3.5;
    const relPoints = currentDrawingPoints.map((p) => ({
      x: Math.round((p.x - minX + pad) * 10) / 10,
      y: Math.round((p.y - minY + pad) * 10) / 10,
    }));
    const relPath = pointsToSvgPath(relPoints);
    const width = Math.max(Math.round(maxX - minX + pad * 2), 16);
    const height = Math.max(Math.round(maxY - minY + pad * 2), 16);

    const newItemId = await addItemMutation({
      projectId,
      type: "drawing",
      x: Math.round(minX - pad),
      y: Math.round(minY - pad),
      width,
      height,
      content: relPath,
      color: penColor,
      zIndex: 8,
      metadata: {
        strokeWidth: strokeW,
        tool: activeTool,
      },
    });

    setUndoStack((prev) => [
      ...prev,
      {
        type: "add",
        itemId: newItemId,
        nextState: {
          projectId,
          type: "drawing",
          x: Math.round(minX - pad),
          y: Math.round(minY - pad),
          width,
          height,
          content: relPath,
          color: penColor,
          zIndex: 8,
        },
      },
    ]);
    setCurrentDrawingPoints([]);
  }, [currentDrawingPoints, activeTool, penColor, projectId, addItemMutation]);

  // GLOBAL CLIPBOARD PASTE LISTENER
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (!isEditable || isLocked) return;

      const rect = containerRef.current?.getBoundingClientRect();
      const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
      const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
      const centerPos = screenToCanvas(centerX, centerY);

      // 1. Files in clipboard (Images)
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length > 0) {
        e.preventDefault();
        setIsUploading(true);
        try {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const res = await uploadMedia(file, { folder: `projects/${projectId}/${stage}` });
            let itemType: any = "image";
            if (res.type === "video") itemType = "video";
            if (res.type === "audio") itemType = "audio";
            if (res.type === "pdf") itemType = "pdf";

            const id = await addItemMutation({
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

            setUndoStack((prev) => [
              ...prev,
              {
                type: "add",
                itemId: id,
                nextState: {
                  projectId,
                  type: itemType,
                  x: centerPos.x + i * 30,
                  y: centerPos.y + i * 30,
                  width: 320,
                  height: 240,
                  content: res.url,
                  title: file.name,
                },
              },
            ]);
            setSelectedItemId(id);
          }
        } catch (err) {
          console.error("Paste upload failed:", err);
        } finally {
          setIsUploading(false);
        }
        return;
      }

      // 2. Text / Image URL in clipboard
      const text = e.clipboardData?.getData("text")?.trim();
      if (text) {
        e.preventDefault();
        if (text.match(/^https?:\/\/.*\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i)) {
          const id = await addItemMutation({
            projectId,
            type: "image",
            x: centerPos.x - 150,
            y: centerPos.y - 110,
            width: 300,
            height: 220,
            zIndex: 5,
            content: text,
            title: "Pasted Image",
          });
          setUndoStack((prev) => [...prev, { type: "add", itemId: id }]);
          setSelectedItemId(id);
        } else {
          const colorObj = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
          const id = await addItemMutation({
            projectId,
            type: "text_sticky",
            x: centerPos.x - 110,
            y: centerPos.y - 75,
            width: 220,
            height: 150,
            zIndex: 10,
            color: colorObj.bg,
            content: text,
            title: "Pasted Note",
          });
          setUndoStack((prev) => [...prev, { type: "add", itemId: id }]);
          setSelectedItemId(id);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [projectId, stage, isEditable, isLocked, screenToCanvas, addItemMutation]);

  // KEYBOARD COMMANDS (1..9, 0, Shortcuts, Delete, Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Delete selected item (Delete, Backspace, Cmd+Delete, Cmd+Backspace)
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedItemId && isEditable && !isLocked) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      // Duplicate (Cmd+D / Ctrl+D)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Number & Letter Shortcuts (Matching reference UI: 1..9, 0)
      if (e.key === "1" || e.key === "v" || e.key === "V" || e.key === "Escape") {
        e.preventDefault();
        setActiveTool("select");
      } else if (e.key === "2" || e.key === "r" || e.key === "R") {
        e.preventDefault();
        setActiveTool("rectangle");
      } else if (e.key === "3" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        setActiveTool("diamond");
      } else if (e.key === "4" || e.key === "o" || e.key === "O" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        setActiveTool("circle");
      } else if (e.key === "5" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        setActiveTool("arrow");
      } else if (e.key === "6" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        setActiveTool("line");
      } else if (e.key === "7" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        setActiveTool("pen");
      } else if (e.key === "8" || e.key === "s" || e.key === "S" || e.key === "t" || e.key === "T") {
        e.preventDefault();
        handleAddSticky();
      } else if (e.key === "9" || e.key === "m" || e.key === "M") {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (e.key === "0" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        setActiveTool("eraser");
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setActiveTool("hand");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleAddFrame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedItemId,
    isEditable,
    isLocked,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleAddFrame,
    handleAddSticky,
    handleUndo,
    handleRedo,
  ]);

  // MOUSE ENGINE
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === "hand" || isLocked) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      return;
    }

    const p = screenToCanvas(e.clientX, e.clientY);

    // Freehand Drawing (Pen / Pencil)
    if (activeTool === "pen" || activeTool === "pencil") {
      setIsDrawing(true);
      setCurrentDrawingPoints([p, p]);
      return;
    }

    // Vector Shapes (Rectangle, Diamond, Circle, Arrow, Line)
    if (
      activeTool === "rectangle" ||
      activeTool === "diamond" ||
      activeTool === "circle" ||
      activeTool === "arrow" ||
      activeTool === "line"
    ) {
      setShapeDragStart(p);
      setShapeDragCurrent(p);
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
    if (!isEditable || isLocked) return;
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

    const p = screenToCanvas(e.clientX, e.clientY);

    // Active Live Drawing Stroke
    if (isDrawing && (activeTool === "pen" || activeTool === "pencil")) {
      setCurrentDrawingPoints((prev) => [...prev, p]);
      return;
    }

    // Active Shape Creation Drag
    if (shapeDragStart) {
      setShapeDragCurrent(p);
      return;
    }

    // Active Resizing
    if (resizingState && isEditable && !isLocked) {
      const dx = (e.clientX - resizingState.startX) / transform.scale;
      const dy = (e.clientY - resizingState.startY) / transform.scale;

      let newWidth = resizingState.initialWidth;
      let newHeight = resizingState.initialHeight;
      let newX = resizingState.initialX;
      let newY = resizingState.initialY;

      const minW = 40;
      const minH = 20;

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

    // Active Dragging Item
    if (draggedItemId && isEditable && !isLocked) {
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

    // Complete Freehand Drawing
    if (isDrawing) {
      setIsDrawing(false);
      handleDrawingComplete();
      return;
    }

    // Complete Shape Creation
    if (shapeDragStart && shapeDragCurrent) {
      handleShapeComplete(shapeDragStart, shapeDragCurrent, activeTool);
      setShapeDragStart(null);
      setShapeDragCurrent(null);
      return;
    }

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

  // MOBILE TOUCH ENGINE
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      touchStateRef.current = {
        ...touchStateRef.current,
        mode: "pinch",
        initialPinchDist: dist,
        initialScale: transform.scale,
        initialPinchCenter: center,
        initialTransform: { ...transform },
      };
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const now = Date.now();
      const p = screenToCanvas(t.clientX, t.clientY);

      if (activeTool === "pen" || activeTool === "pencil") {
        setIsDrawing(true);
        setCurrentDrawingPoints([p, p]);
        touchStateRef.current.mode = "draw";
        return;
      }

      if (
        activeTool === "rectangle" ||
        activeTool === "diamond" ||
        activeTool === "circle" ||
        activeTool === "arrow" ||
        activeTool === "line"
      ) {
        setShapeDragStart(p);
        setShapeDragCurrent(p);
        touchStateRef.current.mode = "shape";
        return;
      }

      // Double-Tap to Fit
      if (now - touchStateRef.current.lastTapTime < 300) {
        fitToScreen();
        touchStateRef.current.lastTapTime = 0;
        return;
      }
      touchStateRef.current.lastTapTime = now;

      if (e.target === containerRef.current || (e.target as HTMLElement).id === "canvas-plane") {
        setSelectedItemId(null);
      }

      touchStateRef.current.mode = "pan";
      touchStateRef.current.panStart = {
        x: t.clientX - transform.x,
        y: t.clientY - transform.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const currentCenter = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const { initialPinchDist, initialScale, initialPinchCenter, initialTransform } =
        touchStateRef.current;
      if (initialPinchDist > 0) {
        const scaleFactor = currentDist / initialPinchDist;
        const newScale = Math.min(Math.max(initialScale * scaleFactor, 0.25), 2.8);

        const mouseX = initialPinchCenter.x - rect.left;
        const mouseY = initialPinchCenter.y - rect.top;

        const panDeltaX = currentCenter.x - initialPinchCenter.x;
        const panDeltaY = currentCenter.y - initialPinchCenter.y;

        const newX =
          mouseX - ((mouseX - initialTransform.x) / initialTransform.scale) * newScale + panDeltaX;
        const newY =
          mouseY - ((mouseY - initialTransform.y) / initialTransform.scale) * newScale + panDeltaY;

        setTransform({ x: newX, y: newY, scale: newScale });
      }
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const p = screenToCanvas(t.clientX, t.clientY);

      // Mobile Drawing
      if (isDrawing && (activeTool === "pen" || activeTool === "pencil")) {
        setCurrentDrawingPoints((prev) => [...prev, p]);
        return;
      }

      // Mobile Shape Drag
      if (shapeDragStart) {
        setShapeDragCurrent(p);
        return;
      }

      // Mobile Resizing
      if (resizingState && isEditable && !isLocked) {
        const dx = (t.clientX - resizingState.startX) / transform.scale;
        const dy = (t.clientY - resizingState.startY) / transform.scale;

        let newWidth = resizingState.initialWidth;
        let newHeight = resizingState.initialHeight;
        let newX = resizingState.initialX;
        let newY = resizingState.initialY;

        const minW = 40;
        const minH = 20;

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

      // Mobile Dragging Item
      if (draggedItemId && isEditable && !isLocked) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasX = (t.clientX - rect.left - transform.x) / transform.scale - dragOffset.x;
        const canvasY = (t.clientY - rect.top - transform.y) / transform.scale - dragOffset.y;

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
        return;
      }

      // Mobile Panning
      if (touchStateRef.current.mode === "pan" || activeTool === "hand") {
        setTransform((prev) => ({
          ...prev,
          x: t.clientX - touchStateRef.current.panStart.x,
          y: t.clientY - touchStateRef.current.panStart.y,
        }));
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      handleDrawingComplete();
    }

    if (shapeDragStart && shapeDragCurrent) {
      handleShapeComplete(shapeDragStart, shapeDragCurrent, activeTool);
      setShapeDragStart(null);
      setShapeDragCurrent(null);
    }

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
    touchStateRef.current.mode = "none";
  };

  const handleResizeTouchStart = (
    e: React.TouchEvent,
    item: any,
    handle: ResizeHandleType
  ) => {
    if (!isEditable || isLocked || e.touches.length > 1) return;
    e.stopPropagation();

    const t = e.touches[0];
    const currentDim = localDimensions[item._id] || {
      x: item.x,
      y: item.y,
      width: item.width || (item.type === "pdf" ? 300 : item.type === "audio" ? 280 : 260),
      height: item.height || (item.type === "pdf" ? 360 : item.type === "audio" ? 100 : 200),
    };

    setResizingState({
      itemId: item._id,
      handle,
      startX: t.clientX,
      startY: t.clientY,
      initialX: currentDim.x,
      initialY: currentDim.y,
      initialWidth: currentDim.width,
      initialHeight: currentDim.height,
    });
  };

  // Handle Multi-File Drop onto Canvas
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditable || isLocked) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const dropPos = screenToCanvas(e.clientX, e.clientY);

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadMedia(file, { folder: `projects/${projectId}/${stage}` });

        let itemType: any = "image";
        if (res.type === "video") itemType = "video";
        if (res.type === "audio") itemType = "audio";
        if (res.type === "pdf") itemType = "pdf";

        const id = await addItemMutation({
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

        setUndoStack((prev) => [
          ...prev,
          {
            type: "add",
            itemId: id,
            nextState: {
              projectId,
              type: itemType,
              x: dropPos.x + i * 40,
              y: dropPos.y + i * 40,
              width: 320,
              height: 240,
              content: res.url,
              title: file.name,
            },
          },
        ]);
        setSelectedItemId(id);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload file to canvas: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const rect = containerRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
    const centerPos = screenToCanvas(centerX, centerY);

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadMedia(file, { folder: `projects/${projectId}/${stage}` });

        let itemType: any = "image";
        if (res.type === "video") itemType = "video";
        if (res.type === "audio") itemType = "audio";
        if (res.type === "pdf") itemType = "pdf";

        const id = await addItemMutation({
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

        setUndoStack((prev) => [
          ...prev,
          {
            type: "add",
            itemId: id,
            nextState: {
              projectId,
              type: itemType,
              x: centerPos.x + i * 30,
              y: centerPos.y + i * 30,
              width: 320,
              height: 240,
              content: res.url,
              title: file.name,
            },
          },
        ]);
        setSelectedItemId(id);
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const selectedItem = items?.find((i) => i._id === selectedItemId);

  return (
    <div
      ref={rootWrapperRef}
      className={`relative w-full bg-[#171512] overflow-hidden select-none transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 w-screen h-[100dvh] rounded-none border-none shadow-none flex flex-col"
          : "h-[74vh] sm:h-[82vh] border border-[#2E2924] rounded-3xl shadow-2xl flex flex-col"
      }`}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf"
        onChange={handleFileUploadInput}
        className="hidden"
      />

      {/* TOP LEFT: Node count pill */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1C1916]/95 backdrop-blur-md border border-[#2E2924] rounded-xl text-xs font-mono text-[#EDE6DD] shadow-lg pointer-events-auto max-w-[calc(100%-48px)] sm:max-w-none truncate">
          <span className="font-semibold truncate text-[#A3E635]">
            {stage === "stage2" ? "Stage 2" : "Stage 1"}
          </span>
          <span className="text-[#7E776F] hidden sm:inline">·</span>
          <span className="text-[#DDD4C8] hidden sm:inline">
            {stage === "stage2" ? "Stitch Board" : "Stitch Canvas"}
          </span>
          <span className="text-[10px] text-[#A3E635] bg-[#A3E635]/15 px-2 py-0.5 rounded-full font-mono shrink-0">
            {items?.length || 0} nodes
          </span>
        </div>

        {onSwitchToPosts && (
          <button
            onClick={onSwitchToPosts}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#241F1B]/90 hover:bg-[#2F2923] backdrop-blur-md border border-[#3E3832] hover:border-[#A3E635] rounded-xl text-xs font-mono text-[#EDE6DD] transition-all shadow-lg pointer-events-auto"
          >
            <span>Switch to Iteration Posts 📝</span>
          </button>
        )}
      </div>

      {/* DESKTOP EXCALIDRAW-STYLE FLOATING TOOLBAR (Exact layout from reference) */}
      {isEditable && (
        <div className="hidden sm:flex absolute top-3 right-3 z-30 items-center gap-0.5 p-1 bg-[#1C1916]/95 backdrop-blur-md border border-[#2E2924] rounded-2xl shadow-2xl">
          {/* Lock / Unlock */}
          <button
            onClick={() => setIsLocked(!isLocked)}
            title={isLocked ? "Unlock Canvas Editing" : "Lock Canvas (View Only)"}
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              isLocked
                ? "bg-[#E08B3F]/20 text-[#E08B3F] border border-[#E08B3F]/40"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <div className="w-[1px] h-4 bg-[#2E2924] mx-0.5" />

          {/* Hand Tool (H) */}
          <button
            onClick={() => setActiveTool("hand")}
            title="Hand / Pan (H or Space+Drag)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "hand"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          {/* 1: Selection Arrow */}
          <button
            onClick={() => setActiveTool("select")}
            title="Selection (1 or V)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "select"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "select" ? "text-[#171512]/90 font-bold" : "text-[#736B62]"
              }`}
            >
              1
            </span>
          </button>

          {/* 2: Rectangle (2 or R) */}
          <button
            onClick={() => setActiveTool("rectangle")}
            title="Rectangle (2 or R)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "rectangle"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "rectangle" ? "text-[#171512]/90 font-bold" : "text-[#736B62]"
              }`}
            >
              2
            </span>
          </button>

          {/* 3: Diamond (3 or D) */}
          <button
            onClick={() => setActiveTool("diamond")}
            title="Diamond (3 or D)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "diamond"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <Diamond className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "diamond" ? "text-[#171512]/90 font-bold" : "text-[#736B62]"
              }`}
            >
              3
            </span>
          </button>

          {/* 4: Circle / Ellipse (4 or O / C) */}
          <button
            onClick={() => setActiveTool("circle")}
            title="Circle / Ellipse (4 or O)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "circle"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <Circle className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "circle" ? "text-[#171512]/90 font-bold" : "text-[#736B62]"
              }`}
            >
              4
            </span>
          </button>

          {/* 5: Arrow (5 or A) */}
          <button
            onClick={() => setActiveTool("arrow")}
            title="Arrow (5 or A)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "arrow"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "arrow" ? "text-[#171512]/90 font-bold" : "text-[#736B62]"
              }`}
            >
              5
            </span>
          </button>

          {/* 6: Line (6 or L) */}
          <button
            onClick={() => setActiveTool("line")}
            title="Line (6 or L)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "line"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "line" ? "text-[#171512]/90 font-bold" : "text-[#736B62]"
              }`}
            >
              6
            </span>
          </button>

          {/* 7: Pen (7 or P) */}
          <button
            onClick={() => setActiveTool("pen")}
            title="Freehand Pen (7 or P)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "pen"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "pen" ? "text-[#171512]/90 font-bold" : "text-[#736B62]"
              }`}
            >
              7
            </span>
          </button>

          {/* Pencil (P) */}
          <button
            onClick={() => setActiveTool("pencil")}
            title="Pencil Sketch"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "pencil"
                ? "bg-[#A3E635] text-[#171512] shadow-sm font-bold"
                : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* 8: Text / Sticky (8 or S / T) */}
          <button
            onClick={handleAddSticky}
            title="Add Sticky Note / Text (8 or S)"
            className="relative flex items-center justify-center w-8 h-8 rounded-xl text-[#8A837A] hover:text-[#FFE066] hover:bg-[#241F1B] transition-all"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="absolute bottom-0 right-1 text-[8px] font-mono leading-none text-[#736B62]">
              8
            </span>
          </button>

          {/* 9: Media Upload (9 or M) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Media (9 or M)"
            className="relative flex items-center justify-center w-8 h-8 rounded-xl text-[#8A837A] hover:text-[#A3E635] hover:bg-[#241F1B] transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="absolute bottom-0 right-1 text-[8px] font-mono leading-none text-[#736B62]">
              9
            </span>
          </button>

          {/* 0: Eraser (0 or E) */}
          <button
            onClick={() => setActiveTool("eraser")}
            title="Eraser (0 or E)"
            className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all ${
              activeTool === "eraser"
                ? "bg-red-500/25 text-red-400 border border-red-500/40 shadow-sm font-bold"
                : "text-[#8A837A] hover:text-red-400 hover:bg-[#241F1B]"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span
              className={`absolute bottom-0 right-1 text-[8px] font-mono leading-none ${
                activeTool === "eraser" ? "text-red-400 font-bold" : "text-[#736B62]"
              }`}
            >
              0
            </span>
          </button>

          <div className="w-[1px] h-4 bg-[#2E2924] mx-0.5" />

          {/* Stroke Color Picker */}
          <div className="relative">
            <button
              onClick={() => setPenColorPickerOpen(!isPenColorPickerOpen)}
              title="Stroke & Shape Color"
              className="flex items-center justify-center w-7 h-7 rounded-xl hover:bg-[#241F1B] transition-colors"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-black/50 shadow-sm"
                style={{ backgroundColor: penColor }}
              />
            </button>

            {isPenColorPickerOpen && (
              <div
                onMouseLeave={() => setPenColorPickerOpen(false)}
                className="absolute right-0 top-9 p-2 bg-[#1C1A17] border border-[#2E2924] rounded-xl shadow-2xl flex items-center gap-1.5 z-50 animate-fade-in"
              >
                {PEN_COLORS.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => {
                      setPenColor(col.color);
                      setPenColorPickerOpen(false);
                    }}
                    style={{ backgroundColor: col.color }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      penColor === col.color
                        ? "border-[#171512] ring-2 ring-[#A3E635] scale-110"
                        : "border-black/50 hover:scale-105"
                    }`}
                    title={col.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-[1px] h-4 bg-[#2E2924] mx-0.5" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="Undo (Cmd+Z)"
            className="flex items-center justify-center w-7 h-7 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] rounded-xl transition-colors disabled:opacity-30"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Redo (Cmd+Shift+Z / Cmd+Y)"
            className="flex items-center justify-center w-7 h-7 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] rounded-xl transition-colors disabled:opacity-30"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {/* DELETE TRASH BUTTON IN TOOLBAR */}
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedItemId}
            title="Delete Selected Item (Delete / Backspace)"
            className={`flex items-center justify-center w-7 h-7 rounded-xl transition-all ${
              selectedItemId
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 cursor-pointer animate-pulse"
                : "text-[#8A837A] opacity-30 cursor-not-allowed"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-[#2E2924] mx-0.5" />

          {/* More Actions Menu (⋮) */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!isMoreMenuOpen)}
              title="More Canvas Controls"
              className={`flex items-center justify-center w-7 h-7 rounded-xl transition-colors ${
                isMoreMenuOpen
                  ? "bg-[#2A2521] text-[#EDE6DD]"
                  : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
              }`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isMoreMenuOpen && (
              <div
                onMouseLeave={() => setMoreMenuOpen(false)}
                className="absolute right-0 top-9 w-48 p-1.5 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-2xl z-50 animate-fade-in space-y-1 text-xs font-mono"
              >
                <button
                  onClick={() => {
                    fitToScreen();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Scan className="w-3.5 h-3.5 text-[#A3E635]" />
                    <span>Fit to Screen</span>
                  </span>
                  <span className="text-[10px] text-[#736B62]">Shift+1</span>
                </button>

                <button
                  onClick={() => {
                    handleAddFrame();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#A9D8FF]" />
                    <span>Add Section Frame</span>
                  </span>
                  <span className="text-[10px] text-[#736B62]">F</span>
                </button>

                <div className="flex items-center justify-between px-2.5 py-1 bg-[#141210] rounded-lg border border-[#2E2924]">
                  <button
                    onClick={() =>
                      setTransform((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.25) }))
                    }
                    className="p-1 text-[#8A837A] hover:text-[#EDE6DD]"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-[#A3E635]">
                    {Math.round(transform.scale * 100)}%
                  </span>
                  <button
                    onClick={() =>
                      setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.2, 2.5) }))
                    }
                    className="p-1 text-[#8A837A] hover:text-[#EDE6DD]"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setTransform({ x: 80, y: 60, scale: 0.9 });
                    setMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset View</span>
                </button>

                <button
                  onClick={() => {
                    toggleFullscreen();
                    setMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {isFullscreen ? (
                      <Minimize2 className="w-3.5 h-3.5 text-[#A3E635]" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5 text-[#A3E635]" />
                    )}
                    <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                  </span>
                  <span className="text-[10px] text-[#736B62]">F11</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uploading indicator banner */}
      {isUploading && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-40 flex items-center gap-2 px-3.5 py-1.5 bg-[#A3E635] text-[#171512] rounded-xl text-xs font-semibold shadow-2xl animate-bounce">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-xs">Placing media on board...</span>
        </div>
      )}

      {/* MAIN INFINITE SPATIAL CANVAS PLANE */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        style={{ touchAction: "none" }}
        className={`relative flex-1 w-full h-full canvas-grid touch-none overflow-hidden ${
          activeTool === "hand" || isPanning
            ? "cursor-grab active:cursor-grabbing"
            : activeTool === "pen" || activeTool === "pencil" || activeTool === "rectangle" || activeTool === "diamond" || activeTool === "circle" || activeTool === "arrow" || activeTool === "line"
            ? "cursor-crosshair"
            : activeTool === "eraser"
            ? "cursor-not-allowed"
            : "cursor-default"
        }`}
      >
        <div
          id="canvas-plane"
          className="absolute inset-0 origin-top-left touch-none"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {/* REAL-TIME LIVE DRAWING STROKE (Instant 60fps rendering while dragging) */}
          {isDrawing && currentDrawingPoints.length > 0 && (
            <svg
              className="absolute inset-0 pointer-events-none overflow-visible w-full h-full z-50"
              style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
            >
              <path
                d={pointsToSvgPath(currentDrawingPoints)}
                fill="none"
                stroke={penColor}
                strokeWidth={activeTool === "pencil" ? 2 : 3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={activeTool === "pencil" ? 0.75 : 1}
              />
            </svg>
          )}

          {/* REAL-TIME LIVE SHAPE PREVIEW WHILE DRAGGING */}
          {shapeDragStart && shapeDragCurrent && (
            <svg
              className="absolute inset-0 pointer-events-none overflow-visible w-full h-full z-50"
              style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
            >
              {(() => {
                const s = shapeDragStart;
                const c = shapeDragCurrent;
                const minX = Math.min(s.x, c.x);
                const minY = Math.min(s.y, c.y);
                const w = Math.max(Math.abs(c.x - s.x), 4);
                const h = Math.max(Math.abs(c.y - s.y), 4);

                if (activeTool === "rectangle") {
                  return (
                    <rect
                      x={minX}
                      y={minY}
                      width={w}
                      height={h}
                      rx="12"
                      fill={penColor + "20"}
                      stroke={penColor}
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  );
                }
                if (activeTool === "diamond") {
                  return (
                    <polygon
                      points={`${minX + w / 2},${minY} ${minX + w},${minY + h / 2} ${minX + w / 2},${minY + h} ${minX},${minY + h / 2}`}
                      fill={penColor + "20"}
                      stroke={penColor}
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  );
                }
                if (activeTool === "circle") {
                  return (
                    <ellipse
                      cx={minX + w / 2}
                      cy={minY + h / 2}
                      rx={w / 2}
                      ry={h / 2}
                      fill={penColor + "20"}
                      stroke={penColor}
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  );
                }
                if (activeTool === "arrow" || activeTool === "line") {
                  return (
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={c.x}
                      y2={c.y}
                      stroke={penColor}
                      strokeWidth="3"
                      strokeDasharray="4 4"
                    />
                  );
                }
                return null;
              })()}
            </svg>
          )}

          {/* RENDER ALL CANVAS ITEMS */}
          {items &&
            items.map((item) => {
              const isSelected = selectedItemId === item._id;
              const isResizingThis = resizingState?.itemId === item._id;

              const dim = localDimensions[item._id] || {
                x: item.x,
                y: item.y,
                width: item.width || (item.type === "pdf" ? 300 : item.type === "audio" ? 280 : 260),
                height: item.height || (item.type === "pdf" ? 360 : item.type === "audio" ? 100 : 200),
              };

              const handleItemMouseDown = (e: React.MouseEvent) => {
                if (activeTool === "hand" || e.button === 1 || isLocked) return;

                if (activeTool === "eraser") {
                  e.stopPropagation();
                  deleteItemMutation({ itemId: item._id as any });
                  setUndoStack((prev) => [
                    ...prev,
                    { type: "delete", itemId: item._id, previousState: item },
                  ]);
                  if (selectedItemId === item._id) setSelectedItemId(null);
                  return;
                }

                if (activeTool === "pen" || activeTool === "pencil" || activeTool === "rectangle" || activeTool === "diamond" || activeTool === "circle" || activeTool === "arrow" || activeTool === "line") {
                  return;
                }

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

              const handleItemTouchStart = (e: React.TouchEvent) => {
                if (activeTool === "hand" || e.touches.length > 1 || isLocked) return;

                if (activeTool === "eraser") {
                  e.stopPropagation();
                  deleteItemMutation({ itemId: item._id as any });
                  setUndoStack((prev) => [
                    ...prev,
                    { type: "delete", itemId: item._id, previousState: item },
                  ]);
                  if (selectedItemId === item._id) setSelectedItemId(null);
                  return;
                }

                if (activeTool === "pen" || activeTool === "pencil" || activeTool === "rectangle" || activeTool === "diamond" || activeTool === "circle" || activeTool === "arrow" || activeTool === "line") {
                  return;
                }

                e.stopPropagation();
                setSelectedItemId(item._id);

                if (isEditable) {
                  setDraggedItemId(item._id);
                  const t = e.touches[0];
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const touchCanvasX = (t.clientX - rect.left - transform.x) / transform.scale;
                  const touchCanvasY = (t.clientY - rect.top - transform.y) / transform.scale;
                  setDragOffset({
                    x: touchCanvasX - dim.x,
                    y: touchCanvasY - dim.y,
                  });
                }
              };

              // Reusable Touch & Desktop Resize Handles Overlay
              const renderResizeHandles = () => {
                if (!isSelected || !isEditable || isLocked) return null;
                return (
                  <>
                    <div className="absolute -inset-1 border-2 border-[#A3E635] rounded-xl pointer-events-none z-30 shadow-lg" />

                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "nw")}
                      onTouchStart={(e) => handleResizeTouchStart(e, item, "nw")}
                      className="absolute -top-3.5 -left-3.5 w-8 h-8 flex items-center justify-center pointer-events-auto cursor-nwse-resize z-40 touch-none"
                    >
                      <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
                    </div>

                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "ne")}
                      onTouchStart={(e) => handleResizeTouchStart(e, item, "ne")}
                      className="absolute -top-3.5 -right-3.5 w-8 h-8 flex items-center justify-center pointer-events-auto cursor-nesw-resize z-40 touch-none"
                    >
                      <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
                    </div>

                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "se")}
                      onTouchStart={(e) => handleResizeTouchStart(e, item, "se")}
                      className="absolute -bottom-3.5 -right-3.5 w-8 h-8 flex items-center justify-center pointer-events-auto cursor-nwse-resize z-40 touch-none"
                    >
                      <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
                    </div>

                    <div
                      onMouseDown={(e) => handleResizeMouseDown(e, item, "sw")}
                      onTouchStart={(e) => handleResizeTouchStart(e, item, "sw")}
                      className="absolute -bottom-3.5 -left-3.5 w-8 h-8 flex items-center justify-center pointer-events-auto cursor-nesw-resize z-40 touch-none"
                    >
                      <div className="w-3 h-3 bg-[#A3E635] border-2 border-[#171512] rounded-sm shadow-md" />
                    </div>

                    {/* Live Dimension Indicator Badge */}
                    {isResizingThis && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#171512] text-[#A3E635] border border-[#A3E635]/50 rounded-md text-[10px] font-mono shadow-2xl whitespace-nowrap z-50">
                        {dim.width} × {dim.height} px
                      </div>
                    )}
                  </>
                );
              };

              // FLOATING CONTEXTUAL ACTION BAR DIRECTLY ABOVE SELECTED ITEM
              const renderFloatingActionBar = () => {
                if (!isSelected || !isEditable || isLocked) return null;
                return (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1 bg-[#1C1A17] border border-[#3E3832] rounded-xl shadow-2xl whitespace-nowrap animate-fade-in pointer-events-auto"
                  >
                    {/* Duplicate */}
                    <button
                      onClick={handleDuplicateSelected}
                      title="Duplicate (Cmd+D)"
                      className="p-1.5 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Item Button (Trash) */}
                    <button
                      onClick={handleDeleteSelected}
                      title="Delete (Delete / Backspace)"
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-3.5 bg-[#2E2924]" />

                    {/* Deselect */}
                    <button
                      onClick={() => setSelectedItemId(null)}
                      title="Deselect (Esc)"
                      className="p-1.5 text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              };

              // 0. FREEHAND DRAWING NODE
              if (item.type === "drawing") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height,
                      zIndex: item.zIndex || 8,
                      touchAction: "none",
                    }}
                    className={`absolute cursor-pointer group ${isSelected ? "ring-1 ring-[#A3E635]" : ""}`}
                  >
                    {renderFloatingActionBar()}
                    <svg
                      viewBox={`0 0 ${dim.width} ${dim.height}`}
                      className="w-full h-full overflow-visible pointer-events-none"
                    >
                      <path
                        d={item.content}
                        fill="none"
                        stroke={item.color || "#A3E635"}
                        strokeWidth={(item.metadata as any)?.strokeWidth || 3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {renderResizeHandles()}
                  </div>
                );
              }

              // 1. VECTOR SHAPES (Rectangle, Diamond, Circle, Arrow, Line)
              if (item.type === "shape") {
                const shapeType = (item.metadata as any)?.shapeType || item.content || "rectangle";
                const strokeColor = item.color || "#A3E635";
                const w = dim.width;
                const h = dim.height;

                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: w,
                      height: h,
                      zIndex: item.zIndex || 6,
                      touchAction: "none",
                    }}
                    className="absolute cursor-move group"
                  >
                    {renderFloatingActionBar()}
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible pointer-events-none">
                      {shapeType === "rectangle" && (
                        <rect
                          x="2"
                          y="2"
                          width={Math.max(w - 4, 1)}
                          height={Math.max(h - 4, 1)}
                          rx="12"
                          fill={strokeColor + "15"}
                          stroke={strokeColor}
                          strokeWidth="2.5"
                        />
                      )}
                      {shapeType === "diamond" && (
                        <polygon
                          points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`}
                          fill={strokeColor + "15"}
                          stroke={strokeColor}
                          strokeWidth="2.5"
                        />
                      )}
                      {shapeType === "circle" && (
                        <ellipse
                          cx={w / 2}
                          cy={h / 2}
                          rx={Math.max(w / 2 - 2, 1)}
                          ry={Math.max(h / 2 - 2, 1)}
                          fill={strokeColor + "15"}
                          stroke={strokeColor}
                          strokeWidth="2.5"
                        />
                      )}
                      {shapeType === "arrow" && (
                        <>
                          <defs>
                            <marker
                              id={`arrow-${item._id}`}
                              markerWidth="10"
                              markerHeight="8"
                              refX="9"
                              refY="4"
                              orient="auto"
                            >
                              <polygon points="0 0, 10 4, 0 8" fill={strokeColor} />
                            </marker>
                          </defs>
                          <line
                            x1="4"
                            y1={h / 2}
                            x2={Math.max(w - 8, 4)}
                            y2={h / 2}
                            stroke={strokeColor}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            markerEnd={`url(#arrow-${item._id})`}
                          />
                        </>
                      )}
                      {shapeType === "line" && (
                        <line
                          x1="4"
                          y1={h / 2}
                          x2={Math.max(w - 4, 4)}
                          y2={h / 2}
                          stroke={strokeColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    {renderResizeHandles()}
                  </div>
                );
              }

              // 2. Section Frame
              if (item.type === "frame") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height,
                      zIndex: item.zIndex || 1,
                      touchAction: "none",
                    }}
                    className={`absolute rounded-2xl border-2 border-dashed transition-shadow ${
                      isSelected
                        ? "border-[#A3E635] bg-[#221E1A]/60 shadow-2xl"
                        : "border-[#3D3630] bg-[#1C1A17]/30 hover:border-[#524941]"
                    }`}
                  >
                    {renderFloatingActionBar()}
                    <div className="flex items-center justify-between px-3 py-2 bg-[#221E1A] border-b border-[#2E2924] rounded-t-xl cursor-move">
                      <span className="text-xs font-mono font-semibold text-[#EDE6DD] truncate">
                        {item.title || "Section Frame"}
                      </span>
                    </div>
                    {renderResizeHandles()}
                  </div>
                );
              }

              // 3. Sticky Note
              if (item.type === "text_sticky") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height,
                      minHeight: dim.height,
                      transform: `rotate(${item.rotation || 0}deg)`,
                      backgroundColor: item.color || "#FFE066",
                      zIndex: item.zIndex || 10,
                      touchAction: "none",
                    }}
                    className={`absolute p-3 sm:p-4 rounded-sm shadow-xl font-hand cursor-move ${
                      isSelected
                        ? "ring-2 ring-[#A3E635] ring-offset-2 ring-offset-black scale-[1.01]"
                        : "hover:scale-[1.005]"
                    }`}
                  >
                    {renderFloatingActionBar()}
                    {isEditable && !isLocked ? (
                      <textarea
                        onFocus={() => setSelectedItemId(item._id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItemId(item._id);
                        }}
                        onTouchStart={(e) => e.stopPropagation()}
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

              // 4. Image Node
              if (item.type === "image") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height ? `${dim.height}px` : "auto",
                      transform: `rotate(${item.rotation || 0}deg)`,
                      zIndex: item.zIndex || 5,
                      touchAction: "none",
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border transition-all cursor-move shadow-xl flex flex-col ${
                      isSelected
                        ? "border-[#A3E635] ring-2 ring-[#A3E635]/50 scale-[1.01]"
                        : "border-[#342D26] hover:border-[#4E443A]"
                    }`}
                  >
                    {renderFloatingActionBar()}
                    <img
                      src={resolveMediaUrl(item.content)}
                      alt={item.title || "Board Image"}
                      className="w-full flex-1 min-h-0 object-cover pointer-events-none rounded-t-xl"
                    />
                    {item.metadata?.caption && (
                      <div className="p-2 bg-[#1C1A17] text-[11px] font-mono text-[#8A837A] shrink-0 border-t border-[#2E2924] truncate">
                        {item.metadata.caption}
                      </div>
                    )}
                    {renderResizeHandles()}
                  </div>
                );
              }

              // 5. Audio Node
              if (item.type === "audio") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      zIndex: item.zIndex || 5,
                      touchAction: "none",
                    }}
                    className={`absolute p-4 rounded-xl bg-[#241F1B] border border-[#342D26] shadow-xl flex flex-col gap-2 cursor-move ${
                      isSelected ? "border-[#A3E635] ring-2 ring-[#A3E635]/50" : ""
                    }`}
                  >
                    {renderFloatingActionBar()}
                    <div className="flex items-center gap-2 text-xs font-mono text-[#A3E635]">
                      <Music className="w-4 h-4" />
                      <span className="truncate max-w-[180px]">{item.title || "Audio Memo"}</span>
                    </div>
                    <audio src={resolveMediaUrl(item.content)} controls className="w-full h-8" />
                    {renderResizeHandles()}
                  </div>
                );
              }

              // 6. Video Node
              if (item.type === "video") {
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height ? `${dim.height}px` : "auto",
                      zIndex: item.zIndex || 5,
                      touchAction: "none",
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border shadow-xl cursor-move flex flex-col ${
                      isSelected ? "border-[#A3E635]" : "border-[#342D26]"
                    }`}
                  >
                    {renderFloatingActionBar()}
                    <video src={resolveMediaUrl(item.content)} controls className="w-full flex-1 min-h-0 object-cover" />
                    {renderResizeHandles()}
                  </div>
                );
              }

              // 7. PDF Node
              if (item.type === "pdf") {
                const pdfUrl = resolveMediaUrl(item.content);
                return (
                  <div
                    key={item._id}
                    onMouseDown={handleItemMouseDown}
                    onTouchStart={handleItemTouchStart}
                    style={{
                      left: dim.x,
                      top: dim.y,
                      width: dim.width,
                      height: dim.height,
                      zIndex: item.zIndex || 5,
                      touchAction: "none",
                    }}
                    className={`absolute rounded-xl overflow-hidden bg-[#241F1B] border shadow-xl cursor-move ${
                      isSelected
                        ? "border-[#A3E635] ring-2 ring-[#A3E635]/50"
                        : "border-[#3E3832] hover:border-[#4E443A]"
                    }`}
                  >
                    {renderFloatingActionBar()}
                    <div className="flex items-center justify-between px-3 py-2 bg-[#1C1A17] border-b border-[#2E2924]">
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

      {/* MOBILE CONTEXTUAL ACTION BAR */}
      {selectedItem && isEditable && !isLocked && (
        <div className="sm:hidden absolute bottom-20 left-4 right-4 z-40 flex items-center justify-between gap-2 p-2 bg-[#1C1916]/95 backdrop-blur-xl border border-[#3E3832] rounded-2xl shadow-2xl animate-fade-in">
          {selectedItem.type === "text_sticky" ? (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[calc(100%-110px)] scrollbar-none">
              {STICKY_COLORS.map((col) => (
                <button
                  key={col.name}
                  onClick={() =>
                    updateContentMutation({
                      itemId: selectedItem._id as any,
                      color: col.bg,
                    })
                  }
                  style={{ backgroundColor: col.bg }}
                  className={`w-6 h-6 rounded-full shrink-0 border-2 transition-transform ${
                    selectedItem.color === col.bg
                      ? "border-[#171512] ring-2 ring-[#A3E635] scale-110"
                      : "border-[#171512]/50 hover:scale-105"
                  }`}
                  title={col.name}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 text-xs font-mono text-[#EDE6DD] truncate max-w-[calc(100%-110px)]">
              <span className="text-[#A3E635] uppercase text-[10px] font-bold">
                {selectedItem.type}
              </span>
              <span className="truncate">{selectedItem.title || "Selected Item"}</span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleDuplicateSelected}
              className="p-2 rounded-xl bg-[#241F1B] text-[#8A837A] hover:text-[#EDE6DD] transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteSelected}
              className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              title="Delete Item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedItemId(null)}
              className="p-2 rounded-xl bg-[#2E2924] text-[#8A837A] hover:text-[#EDE6DD] transition-colors"
              title="Deselect"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING BOTTOM DOCK WITH NUMERICAL SUBSCRIPTS */}
      <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-[#1C1916]/95 backdrop-blur-xl border border-[#2E2924] rounded-2xl shadow-2xl max-w-[calc(100%-24px)] overflow-x-auto">
        {isEditable ? (
          <>
            <div className="flex items-center bg-[#141210] p-0.5 rounded-xl border border-[#2E2924]">
              <button
                onClick={() => setActiveTool("select")}
                className={`relative flex items-center justify-center p-2 rounded-lg transition-all ${
                  activeTool === "select"
                    ? "bg-[#A3E635] text-[#171512] font-bold shadow-sm"
                    : "text-[#8A837A]"
                }`}
                title="Select (1)"
              >
                <MousePointer className="w-4 h-4" />
                <span className="text-[9px] font-mono leading-none ml-0.5 opacity-70">1</span>
              </button>
              <button
                onClick={() => setActiveTool("hand")}
                className={`p-2 rounded-lg transition-all ${
                  activeTool === "hand"
                    ? "bg-[#A3E635] text-[#171512] font-bold shadow-sm"
                    : "text-[#8A837A]"
                }`}
                title="Pan Mode (H)"
              >
                <Hand className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Rectangle, Pen & Eraser for mobile */}
            <button
              onClick={() => setActiveTool("rectangle")}
              className={`relative flex items-center gap-0.5 p-2 rounded-xl border transition-all ${
                activeTool === "rectangle"
                  ? "bg-[#A3E635] text-[#171512] border-[#A3E635]"
                  : "bg-[#241F1B] text-[#8A837A] border-[#3E3832]"
              }`}
              title="Rectangle (2)"
            >
              <Square className="w-4 h-4" />
              <span className="text-[9px] font-mono leading-none opacity-70">2</span>
            </button>

            <button
              onClick={() => setActiveTool("pen")}
              className={`relative flex items-center gap-0.5 p-2 rounded-xl border transition-all ${
                activeTool === "pen"
                  ? "bg-[#A3E635] text-[#171512] border-[#A3E635]"
                  : "bg-[#241F1B] text-[#8A837A] border-[#3E3832]"
              }`}
              title="Pen (7)"
            >
              <Pen className="w-4 h-4" />
              <span className="text-[9px] font-mono leading-none opacity-70">7</span>
            </button>

            <button
              onClick={() => setActiveTool("eraser")}
              className={`relative flex items-center gap-0.5 p-2 rounded-xl border transition-all ${
                activeTool === "eraser"
                  ? "bg-red-500/25 text-red-400 border-red-500/40"
                  : "bg-[#241F1B] text-[#8A837A] border-[#3E3832]"
              }`}
              title="Eraser (0)"
            >
              <Eraser className="w-4 h-4" />
              <span className="text-[9px] font-mono leading-none opacity-70">0</span>
            </button>

            <div className="w-[1px] h-5 bg-[#2E2924] mx-0.5" />

            <button
              onClick={handleAddSticky}
              className="relative flex items-center gap-0.5 p-2 rounded-xl bg-[#241F1B] active:bg-[#2F2923] text-xs font-mono text-[#EDE6DD] border border-[#3E3832]"
              title="Add Sticky (8)"
            >
              <StickyNote className="w-4 h-4 text-[#FFE066]" />
              <span className="text-[9px] font-mono leading-none text-[#736B62]">8</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative flex items-center gap-0.5 p-2 rounded-xl bg-[#241F1B] active:bg-[#2F2923] text-xs font-mono text-[#EDE6DD] border border-[#3E3832]"
              title="Upload Media (9)"
            >
              <ImageIcon className="w-4 h-4 text-[#A3E635]" />
              <span className="text-[9px] font-mono leading-none text-[#736B62]">9</span>
            </button>

            {/* Mobile Delete Button */}
            {selectedItemId && (
              <button
                onClick={handleDeleteSelected}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Undo Mobile */}
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-2 rounded-xl bg-[#241F1B] text-[#8A837A] disabled:opacity-30 border border-[#3E3832]"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-5 bg-[#2E2924] mx-0.5" />
          </>
        ) : null}

        {/* Fit to Screen */}
        <button
          onClick={fitToScreen}
          className="p-2 rounded-xl bg-[#241F1B] text-[#A3E635] active:bg-[#2F2923] border border-[#3E3832]"
          title="Fit to Screen"
        >
          <Scan className="w-4 h-4" />
        </button>

        {/* Zoom Out & In */}
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.25) }))}
          className="p-2 text-[#8A837A] active:text-[#EDE6DD]"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.2, 2.5) }))}
          className="p-2 text-[#8A837A] active:text-[#EDE6DD]"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* DESKTOP BOTTOM STAGE BAR (sm:flex) */}
      <div className="hidden sm:flex absolute bottom-4 left-4 right-4 z-30 items-center justify-between pointer-events-none">
        <div className="px-3.5 py-1.5 bg-[#171512]/90 backdrop-blur-md border border-[#2E2924] rounded-xl text-xs font-mono text-[#8A837A] pointer-events-auto shadow-lg flex items-center gap-2">
          <span>1: Select</span>
          <span>·</span>
          <span>2: Rect</span>
          <span>·</span>
          <span>3: Diamond</span>
          <span>·</span>
          <span>4: Circle</span>
          <span>·</span>
          <span>5: Arrow</span>
          <span>·</span>
          <span>6: Line</span>
          <span>·</span>
          <span>7: Pen</span>
          <span>·</span>
          <span>8: Sticky</span>
          <span>·</span>
          <span>9: Media</span>
          <span>·</span>
          <span>0: Eraser</span>
          <span>·</span>
          <span>Del: Delete</span>
        </div>

        {onNavigateNext ? (
          <button
            onClick={onNavigateNext}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-xs rounded-xl transition-all shadow-lg active:scale-95 ml-auto"
          >
            <span>
              {nextLabel ||
                (stage === "stage2"
                  ? "Proceed to Output: Release"
                  : "Proceed to Stage 2: Development")}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : onNavigateToStage2 ? (
          <button
            onClick={onNavigateToStage2}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-xs rounded-xl transition-all shadow-lg active:scale-95 ml-auto"
          >
            <span>Proceed to Stage 2: Development</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : onNavigateToOutput ? (
          <button
            onClick={onNavigateToOutput}
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-[#A3E635] hover:bg-[#84CC16] text-[#171512] font-semibold text-xs rounded-xl transition-all shadow-lg active:scale-95 ml-auto"
          >
            <span>Proceed to Output: Release</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
