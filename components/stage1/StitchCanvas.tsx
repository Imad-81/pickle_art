"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { uploadMedia } from "@/lib/uploader";
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
  Palette,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { CanvasInspector, ElementProperties } from "./CanvasInspector";
import { CanvasItemRenderer, ResizeHandleType } from "./CanvasItemRenderer";
import { CanvasMiniMap } from "./CanvasMiniMap";
import { CanvasShortcutsModal } from "./CanvasShortcutsModal";

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

interface Point {
  x: number;
  y: number;
}

type InteractionState =
  | { type: "idle" }
  | { type: "panning"; startScreenX: number; startScreenY: number; startCamX: number; startCamY: number }
  | {
      type: "dragging";
      startScreenX: number;
      startScreenY: number;
      itemStartPositions: Record<string, { x: number; y: number }>;
      hasMoved: boolean;
    }
  | {
      type: "resizing";
      itemId: string;
      handle: ResizeHandleType;
      startScreenX: number;
      startScreenY: number;
      initialX: number;
      initialY: number;
      initialWidth: number;
      initialHeight: number;
    }
  | { type: "drawing"; points: Point[] }
  | { type: "drawing_shape"; tool: ToolType; start: Point; current: Point }
  | { type: "marquee"; start: Point; current: Point };

interface HistoryAction {
  type: "add" | "delete" | "transform" | "update";
  itemId: string;
  previousState?: any;
  nextState?: any;
}

function pointsToSvgPath(points: Point[]) {
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

  // Type-safe mutations
  const executeAddItem = useCallback(
    async (args: any): Promise<string> => {
      if (stage === "stage2") {
        return (await addStage2Item(args)) as string;
      } else {
        return (await addStage1Item(args)) as string;
      }
    },
    [stage, addStage2Item, addStage1Item]
  );

  const executeUpdateTransform = useCallback(
    async (args: { itemId: string; x: number; y: number; width?: number; height?: number; rotation?: number; zIndex?: number }) => {
      if (stage === "stage2") {
        await updateStage2Transform(args as any);
      } else {
        await updateStage1Transform(args as any);
      }
    },
    [stage, updateStage2Transform, updateStage1Transform]
  );

  const executeUpdateContent = useCallback(
    async (args: { itemId: string; content?: string; title?: string; color?: string; metadata?: any }) => {
      if (stage === "stage2") {
        await updateStage2Content(args as any);
      } else {
        await updateStage1Content(args as any);
      }
    },
    [stage, updateStage2Content, updateStage1Content]
  );

  const executeDelete = useCallback(
    async (id: string) => {
      if (stage === "stage2") {
        await deleteStage2Item({ itemId: id as any });
      } else {
        await deleteStage1Item({ itemId: id as any });
      }
    },
    [stage, deleteStage2Item, deleteStage1Item]
  );

  // State
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [activeColor, setActiveColor] = useState("#A3E635");
  const [activeStickyColor, setActiveStickyColor] = useState("#FFE066");
  const [isLocked, setIsLocked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Undo / Redo
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);

  // Infinite Camera
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isSpacePressedRef = useRef(false);

  // Interaction State Machine
  const [interaction, setInteraction] = useState<InteractionState>({ type: "idle" });
  const interactionRef = useRef<InteractionState>(interaction);
  interactionRef.current = interaction;

  // Local Dimensions
  const [localDimensions, setLocalDimensions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth || 1200,
          height: containerRef.current.clientHeight || 800,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Sync server items
  useEffect(() => {
    if (!items) return;
    setLocalDimensions((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (interactionRef.current.type === "idle" || !next[item._id]) {
          next[item._id] = {
            x: item.x,
            y: item.y,
            width: item.width || 200,
            height: item.height || 150,
          };
        }
      });
      return next;
    });
  }, [items]);

  // Coordinate Conversion
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (screenX - rect.left - transform.x) / transform.scale;
      const y = (screenY - rect.top - transform.y) / transform.scale;
      return { x, y };
    },
    [transform]
  );

  // Zoom Helpers
  const zoomToPoint = useCallback(
    (targetScale: number, centerX: number, centerY: number) => {
      const clampedScale = Math.min(Math.max(targetScale, 0.2), 3);
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = centerX - rect.left;
      const cursorY = centerY - rect.top;

      const newX = cursorX - ((cursorX - transform.x) / transform.scale) * clampedScale;
      const newY = cursorY - ((cursorY - transform.y) / transform.scale) * clampedScale;

      setTransform({ x: newX, y: newY, scale: clampedScale });
    },
    [transform]
  );

  const handleFitToScreen = useCallback(() => {
    if (!items || items.length === 0 || !containerRef.current) {
      setTransform({ x: 0, y: 0, scale: 1 });
      return;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    items.forEach((item) => {
      const dim = localDimensions[item._id] || item;
      minX = Math.min(minX, dim.x);
      minY = Math.min(minY, dim.y);
      maxX = Math.max(maxX, dim.x + (dim.width || 200));
      maxY = Math.max(maxY, dim.y + (dim.height || 150));
    });

    const padding = 80;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    const scaleX = cw / contentW;
    const scaleY = ch / contentH;
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.5);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setTransform({
      x: cw / 2 - midX * fitScale,
      y: ch / 2 - midY * fitScale,
      scale: fitScale,
    });
  }, [items, localDimensions]);

  // Undo / Redo
  const handleUndo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (action.type === "add") {
      await executeDelete(action.itemId);
      setRedoStack((prev) => [...prev, action]);
      setSelectedItemIds((prev) => prev.filter((id) => id !== action.itemId));
    } else if (action.type === "delete" && action.previousState) {
      const restoredId = await executeAddItem(sanitizeItemForAdd(action.previousState));
      setRedoStack((prev) => [...prev, { ...action, itemId: restoredId }]);
    } else if (action.type === "transform" && action.previousState) {
      await executeUpdateTransform({
        itemId: action.itemId,
        x: action.previousState.x,
        y: action.previousState.y,
        width: action.previousState.width,
        height: action.previousState.height,
      });
      setRedoStack((prev) => [...prev, action]);
    }
  }, [undoStack, executeDelete, executeAddItem, executeUpdateTransform]);

  const handleRedo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    if (action.type === "add" && action.nextState) {
      const id = await executeAddItem(sanitizeItemForAdd(action.nextState));
      setUndoStack((prev) => [...prev, { ...action, itemId: id }]);
    } else if (action.type === "delete") {
      await executeDelete(action.itemId);
      setUndoStack((prev) => [...prev, action]);
      setSelectedItemIds((prev) => prev.filter((id) => id !== action.itemId));
    } else if (action.type === "transform" && action.nextState) {
      await executeUpdateTransform({
        itemId: action.itemId,
        x: action.nextState.x,
        y: action.nextState.y,
        width: action.nextState.width,
        height: action.nextState.height,
      });
      setUndoStack((prev) => [...prev, action]);
    }
  }, [redoStack, executeAddItem, executeDelete, executeUpdateTransform]);

  // Delete
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItemIds.length === 0 || !isEditable || isLocked) return;
    for (const id of selectedItemIds) {
      const item = items?.find((it) => it._id === id);
      if (item) {
        setUndoStack((prev) => [
          ...prev,
          {
            type: "delete",
            itemId: id,
            previousState: {
              ...item,
              x: localDimensions[id]?.x ?? item.x,
              y: localDimensions[id]?.y ?? item.y,
              width: localDimensions[id]?.width ?? item.width,
              height: localDimensions[id]?.height ?? item.height,
            },
          },
        ]);
        await executeDelete(id);
      }
    }
    setSelectedItemIds([]);
  }, [selectedItemIds, isEditable, isLocked, items, localDimensions, executeDelete]);

  // Duplicate
  const handleDuplicateSelected = useCallback(async () => {
    if (selectedItemIds.length === 0 || !isEditable || isLocked || !items) return;
    const newSelected: string[] = [];
    for (const id of selectedItemIds) {
      const item = items.find((it) => it._id === id);
      if (!item) continue;
      const dim = localDimensions[id] || item;
      const newId = await executeAddItem({
        projectId,
        type: item.type,
        content: item.content,
        title: item.title ? `${item.title} (Copy)` : undefined,
        x: dim.x + 25,
        y: dim.y + 25,
        width: dim.width,
        height: dim.height,
        color: item.color,
        rotation: item.rotation,
        zIndex: (item.zIndex || 5) + 1,
        metadata: item.metadata,
      });
      newSelected.push(newId);
    }
    setSelectedItemIds(newSelected);
  }, [selectedItemIds, isEditable, isLocked, items, localDimensions, projectId, executeAddItem]);

  // Update Properties from Inspector
  const handleUpdateProperties = useCallback(
    async (newProps: Partial<ElementProperties>) => {
      if (selectedItemIds.length === 0 || !isEditable || isLocked || !items) return;
      for (const id of selectedItemIds) {
        const item = items.find((it) => it._id === id);
        if (!item) continue;

        const currentMeta = (item.metadata as any) || {};
        const updatedMeta = {
          ...currentMeta,
          ...(newProps.strokeWidth !== undefined ? { strokeWidth: newProps.strokeWidth } : {}),
          ...(newProps.strokeStyle !== undefined ? { strokeStyle: newProps.strokeStyle } : {}),
          ...(newProps.fillStyle !== undefined ? { fillStyle: newProps.fillStyle } : {}),
          ...(newProps.fillColor !== undefined ? { fillColor: newProps.fillColor } : {}),
          ...(newProps.roughness !== undefined ? { roughness: newProps.roughness } : {}),
          ...(newProps.opacity !== undefined ? { opacity: newProps.opacity } : {}),
        };

        const updatedColor = newProps.strokeColor || item.color;

        await executeUpdateContent({
          itemId: id,
          color: updatedColor,
          metadata: updatedMeta,
        });

        if (newProps.strokeColor) {
          setActiveColor(newProps.strokeColor);
        }
      }
    },
    [selectedItemIds, isEditable, isLocked, items, executeUpdateContent]
  );

  // Layering
  const handleBringToFront = useCallback(async () => {
    if (selectedItemIds.length === 0 || !items) return;
    const maxZ = Math.max(...items.map((i) => i.zIndex || 5), 5);
    for (const id of selectedItemIds) {
      await executeUpdateTransform({
        itemId: id,
        x: localDimensions[id]?.x || 0,
        y: localDimensions[id]?.y || 0,
        zIndex: maxZ + 1,
      });
    }
  }, [selectedItemIds, items, localDimensions, executeUpdateTransform]);

  const handleSendToBack = useCallback(async () => {
    if (selectedItemIds.length === 0 || !items) return;
    const minZ = Math.min(...items.map((i) => i.zIndex || 5), 5);
    for (const id of selectedItemIds) {
      await executeUpdateTransform({
        itemId: id,
        x: localDimensions[id]?.x || 0,
        y: localDimensions[id]?.y || 0,
        zIndex: Math.max(1, minZ - 1),
      });
    }
  }, [selectedItemIds, items, localDimensions, executeUpdateTransform]);

  // Align
  const handleAlignSelected = useCallback(
    async (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (selectedItemIds.length <= 1 || !isEditable || isLocked || !items) return;
      const selectedDims = selectedItemIds
        .map((id) => ({ id, ...(localDimensions[id] || items.find((it) => it._id === id)) }))
        .filter((d) => d.x !== undefined);

      if (selectedDims.length <= 1) return;

      let targetVal = 0;
      if (alignment === "left") targetVal = Math.min(...selectedDims.map((d) => d.x));
      if (alignment === "top") targetVal = Math.min(...selectedDims.map((d) => d.y));
      if (alignment === "right") targetVal = Math.max(...selectedDims.map((d) => d.x + (d.width || 200)));
      if (alignment === "bottom") targetVal = Math.max(...selectedDims.map((d) => d.y + (d.height || 150)));
      if (alignment === "center") {
        const minX = Math.min(...selectedDims.map((d) => d.x));
        const maxX = Math.max(...selectedDims.map((d) => d.x + (d.width || 200)));
        targetVal = (minX + maxX) / 2;
      }
      if (alignment === "middle") {
        const minY = Math.min(...selectedDims.map((d) => d.y));
        const maxY = Math.max(...selectedDims.map((d) => d.y + (d.height || 150)));
        targetVal = (minY + maxY) / 2;
      }

      for (const d of selectedDims) {
        let newX = d.x;
        let newY = d.y;
        if (alignment === "left") newX = targetVal;
        if (alignment === "right") newX = targetVal - (d.width || 200);
        if (alignment === "center") newX = targetVal - (d.width || 200) / 2;
        if (alignment === "top") newY = targetVal;
        if (alignment === "bottom") newY = targetVal - (d.height || 150);
        if (alignment === "middle") newY = targetVal - (d.height || 150) / 2;

        setLocalDimensions((prev) => ({
          ...prev,
          [d.id]: { ...prev[d.id], x: newX, y: newY },
        }));
        await executeUpdateTransform({
          itemId: d.id,
          x: newX,
          y: newY,
          width: d.width || 200,
          height: d.height || 150,
        });
      }
    },
    [selectedItemIds, isEditable, isLocked, items, localDimensions, executeUpdateTransform]
  );

  // Wheel Zoom / Pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = 1 - e.deltaY * 0.005;
        zoomToPoint(transform.scale * zoomFactor, e.clientX, e.clientY);
      } else {
        setTransform((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [transform, zoomToPoint]
  );

  // Canvas Pointer Down
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // If clicking with middle button, or hand tool, or space held
      if (e.button === 1 || activeTool === "hand" || isSpacePressedRef.current) {
        e.preventDefault();
        setInteraction({
          type: "panning",
          startScreenX: e.clientX,
          startScreenY: e.clientY,
          startCamX: transform.x,
          startCamY: transform.y,
        });
        return;
      }

      if (e.button !== 0) return; // Only primary button for canvas actions
      const canvasCoord = screenToCanvas(e.clientX, e.clientY);

      // Drawing Tool
      if (activeTool === "pen" || activeTool === "pencil") {
        if (!isEditable || isLocked) return;
        e.preventDefault();
        setInteraction({
          type: "drawing",
          points: [canvasCoord],
        });
        return;
      }

      // Shape Tool
      if (["rectangle", "diamond", "circle", "arrow", "line"].includes(activeTool)) {
        if (!isEditable || isLocked) return;
        e.preventDefault();
        setInteraction({
          type: "drawing_shape",
          tool: activeTool,
          start: canvasCoord,
          current: canvasCoord,
        });
        return;
      }

      // Sticky Note
      if (activeTool === "sticky") {
        if (!isEditable || isLocked) return;
        e.preventDefault();
        executeAddItem({
          projectId,
          type: "text_sticky",
          content: "Write research insight or thought here...",
          x: Math.round(canvasCoord.x - 100),
          y: Math.round(canvasCoord.y - 75),
          width: 200,
          height: 150,
          color: activeStickyColor,
          rotation: (Math.random() - 0.5) * 4,
          zIndex: 5,
        }).then((id) => {
          setSelectedItemIds([id]);
          setActiveTool("select");
        });
        return;
      }

      // Selection Marquee / Deselect
      if (activeTool === "select") {
        if (!e.shiftKey) {
          setSelectedItemIds([]);
        }
        setInteraction({
          type: "marquee",
          start: canvasCoord,
          current: canvasCoord,
        });
      }
    },
    [activeTool, transform, screenToCanvas, isEditable, isLocked, activeStickyColor, projectId, executeAddItem]
  );

  // Item Pointer Down
  const handleItemPointerDown = useCallback(
    (e: React.PointerEvent, item: any) => {
      e.stopPropagation();

      // Eraser tool
      if (activeTool === "eraser") {
        if (!isEditable || isLocked) return;
        setUndoStack((prev) => [
          ...prev,
          {
            type: "delete",
            itemId: item._id,
            previousState: {
              ...item,
              x: localDimensions[item._id]?.x ?? item.x,
              y: localDimensions[item._id]?.y ?? item.y,
              width: localDimensions[item._id]?.width ?? item.width,
              height: localDimensions[item._id]?.height ?? item.height,
            },
          },
        ]);
        executeDelete(item._id);
        return;
      }

      if (activeTool !== "select") return;

      let targetIds = selectedItemIds;
      if (e.shiftKey) {
        targetIds = selectedItemIds.includes(item._id)
          ? selectedItemIds.filter((id) => id !== item._id)
          : [...selectedItemIds, item._id];
      } else if (!selectedItemIds.includes(item._id)) {
        targetIds = [item._id];
      }

      setSelectedItemIds(targetIds);

      if (isEditable && !isLocked) {
        const startPosMap: Record<string, { x: number; y: number }> = {};
        targetIds.forEach((id) => {
          const dim = localDimensions[id] || items?.find((it) => it._id === id);
          if (dim) startPosMap[id] = { x: dim.x, y: dim.y };
        });

        setInteraction({
          type: "dragging",
          startScreenX: e.clientX,
          startScreenY: e.clientY,
          itemStartPositions: startPosMap,
          hasMoved: false,
        });
      }
    },
    [activeTool, selectedItemIds, isEditable, isLocked, items, localDimensions, executeDelete]
  );

  // Resize Pointer Down
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent, item: any, handle: ResizeHandleType) => {
      e.stopPropagation();
      if (!isEditable || isLocked) return;
      const dim = localDimensions[item._id] || item;
      setInteraction({
        type: "resizing",
        itemId: item._id,
        handle,
        startScreenX: e.clientX,
        startScreenY: e.clientY,
        initialX: dim.x,
        initialY: dim.y,
        initialWidth: dim.width,
        initialHeight: dim.height,
      });
    },
    [isEditable, isLocked, localDimensions]
  );

  // Global Window Pointer Move & Pointer Up Listeners
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const state = interactionRef.current;
      if (state.type === "idle") return;

      // 1. Panning
      if (state.type === "panning") {
        const dx = e.clientX - state.startScreenX;
        const dy = e.clientY - state.startScreenY;
        setTransform({
          x: state.startCamX + dx,
          y: state.startCamY + dy,
          scale: transform.scale,
        });
        return;
      }

      const canvasCoord = screenToCanvas(e.clientX, e.clientY);

      // 2. Freehand Drawing
      if (state.type === "drawing") {
        setInteraction((prev) => (prev.type === "drawing" ? { ...prev, points: [...prev.points, canvasCoord] } : prev));
        return;
      }

      // 3. Shape Creation Drag Preview
      if (state.type === "drawing_shape") {
        setInteraction((prev) => (prev.type === "drawing_shape" ? { ...prev, current: canvasCoord } : prev));
        return;
      }

      // 4. Marquee Drag
      if (state.type === "marquee") {
        setInteraction((prev) => (prev.type === "marquee" ? { ...prev, current: canvasCoord } : prev));
        return;
      }

      // 5. Item Resizing
      if (state.type === "resizing") {
        const dx = (e.clientX - state.startScreenX) / transform.scale;
        const dy = (e.clientY - state.startScreenY) / transform.scale;

        let newX = state.initialX;
        let newY = state.initialY;
        let newW = state.initialWidth;
        let newH = state.initialHeight;

        if (state.handle.includes("e")) newW = Math.max(state.initialWidth + dx, 30);
        if (state.handle.includes("s")) newH = Math.max(state.initialHeight + dy, 30);
        if (state.handle.includes("w")) {
          const w = Math.max(state.initialWidth - dx, 30);
          newX = state.initialX + (state.initialWidth - w);
          newW = w;
        }
        if (state.handle.includes("n")) {
          const h = Math.max(state.initialHeight - dy, 30);
          newY = state.initialY + (state.initialHeight - h);
          newH = h;
        }

        setLocalDimensions((prev) => ({
          ...prev,
          [state.itemId]: { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) },
        }));
        return;
      }

      // 6. Multi-Item Dragging
      if (state.type === "dragging") {
        const dx = (e.clientX - state.startScreenX) / transform.scale;
        const dy = (e.clientY - state.startScreenY) / transform.scale;

        if (!state.hasMoved && Math.hypot(dx, dy) < 3) return;

        setInteraction((prev) => (prev.type === "dragging" ? { ...prev, hasMoved: true } : prev));

        setLocalDimensions((prev) => {
          const next = { ...prev };
          Object.entries(state.itemStartPositions).forEach(([id, start]) => {
            next[id] = {
              ...next[id],
              x: Math.round(start.x + dx),
              y: Math.round(start.y + dy),
            };
          });
          return next;
        });
      }
    };

    const handleGlobalPointerUp = async (e: PointerEvent) => {
      const state = interactionRef.current;
      if (state.type === "idle") return;

      // Reset state first to prevent any mouse-sticking
      setInteraction({ type: "idle" });

      // 1. Finalize Freehand Drawing
      if (state.type === "drawing" && state.points.length > 1) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        state.points.forEach((p) => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });

        const w = Math.max(maxX - minX + 20, 30);
        const h = Math.max(maxY - minY + 20, 30);
        const relativePoints = state.points.map((p) => ({
          x: p.x - minX + 10,
          y: p.y - minY + 10,
        }));
        const pathData = pointsToSvgPath(relativePoints);

        const id = await executeAddItem({
          projectId,
          type: "drawing",
          content: pathData,
          x: Math.round(minX - 10),
          y: Math.round(minY - 10),
          width: Math.round(w),
          height: Math.round(h),
          color: activeColor,
          zIndex: 6,
          metadata: {
            strokeWidth: activeTool === "pencil" ? 1.5 : 3,
            tool: activeTool,
            points: relativePoints,
          },
        });

        setUndoStack((prev) => [...prev, { type: "add", itemId: id }]);
        return;
      }

      // 2. Finalize Shape Creation
      if (state.type === "drawing_shape") {
        const x1 = state.start.x;
        const y1 = state.start.y;
        const x2 = state.current.x;
        const y2 = state.current.y;

        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const rawW = Math.abs(x2 - x1);
        const rawH = Math.abs(y2 - y1);

        const isClick = rawW < 10 && rawH < 10;
        const w = isClick ? (state.tool === "line" || state.tool === "arrow" ? 180 : 180) : rawW;
        const h = isClick ? (state.tool === "line" || state.tool === "arrow" ? 40 : 120) : rawH;

        const id = await executeAddItem({
          projectId,
          type: "shape",
          content: state.tool,
          x: Math.round(isClick ? minX - w / 2 : minX),
          y: Math.round(isClick ? minY - h / 2 : minY),
          width: Math.round(w),
          height: Math.round(h),
          color: activeColor,
          zIndex: 6,
          metadata: {
            shapeType: state.tool,
            strokeWidth: 2.5,
            fillStyle: "solid",
            fillColor: "transparent",
            roughness: "clean",
          },
        });

        setUndoStack((prev) => [...prev, { type: "add", itemId: id }]);
        setSelectedItemIds([id]);
        setActiveTool("select");
        return;
      }

      // 3. Finalize Marquee Selection
      if (state.type === "marquee" && items) {
        const mx1 = Math.min(state.start.x, state.current.x);
        const my1 = Math.min(state.start.y, state.current.y);
        const mx2 = Math.max(state.start.x, state.current.x);
        const my2 = Math.max(state.start.y, state.current.y);

        if (mx2 - mx1 > 5 || my2 - my1 > 5) {
          const hitIds = items
            .filter((it) => {
              const dim = localDimensions[it._id] || it;
              const ix1 = dim.x;
              const iy1 = dim.y;
              const ix2 = dim.x + (dim.width || 200);
              const iy2 = dim.y + (dim.height || 150);
              return !(ix2 < mx1 || ix1 > mx2 || iy2 < my1 || iy1 > my2);
            })
            .map((it) => it._id);

          setSelectedItemIds(hitIds);
        }
        return;
      }

      // 4. Finalize Resizing Persistence
      if (state.type === "resizing") {
        const dim = localDimensions[state.itemId];
        if (dim) {
          await executeUpdateTransform({
            itemId: state.itemId,
            x: dim.x,
            y: dim.y,
            width: dim.width,
            height: dim.height,
          });
        }
        return;
      }

      // 5. Finalize Dragging Persistence
      if (state.type === "dragging" && state.hasMoved) {
        for (const id of Object.keys(state.itemStartPositions)) {
          const dim = localDimensions[id];
          if (dim) {
            await executeUpdateTransform({
              itemId: id,
              x: dim.x,
              y: dim.y,
              width: dim.width,
              height: dim.height,
            });
          }
        }
      }
    };

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [screenToCanvas, transform.scale, activeTool, activeColor, projectId, items, localDimensions, executeAddItem, executeUpdateTransform]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = true;
      }

      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      const isCmd = e.metaKey || e.ctrlKey;

      if (e.key === "1" || e.key === "v" || e.key === "V") {
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
        setActiveTool((prev) => (prev === "pen" ? "pencil" : "pen"));
      } else if (e.key === "8" || e.key === "s" || e.key === "S" || e.key === "t" || e.key === "T") {
        e.preventDefault();
        setActiveTool("sticky");
      } else if (e.key === "9" || e.key === "m" || e.key === "M") {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if (e.key === "0" || e.key === "e" || e.key === "E") {
        e.preventDefault();
        setActiveTool("eraser");
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        setActiveTool("hand");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      } else if (isCmd && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        handleDuplicateSelected();
      } else if (isCmd && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (isCmd && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        handleRedo();
      } else if (isCmd && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (items) setSelectedItemIds(items.map((it) => it._id));
      } else if (e.key === "Escape") {
        setSelectedItemIds([]);
        setActiveTool("select");
      } else if (e.key === "?") {
        setShowShortcutsModal(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleDeleteSelected, handleDuplicateSelected, handleUndo, handleRedo, items]);

  // Selected items objects for Inspector
  const selectedItemsObjects = (items || []).filter((it) => selectedItemIds.includes(it._id));

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handleCanvasPointerDown}
      className={`relative w-full h-[650px] lg:h-[750px] bg-[#171512] border border-[#2E2924] rounded-3xl overflow-hidden select-none touch-none ${
        isFullscreen ? "fixed inset-0 z-50 h-screen rounded-none border-none" : ""
      } ${activeTool === "hand" || interaction.type === "panning" ? "cursor-grab active:cursor-grabbing" : activeTool === "eraser" ? "cursor-crosshair" : "cursor-default"}`}
      style={{
        backgroundImage: `radial-gradient(#2E2924 1px, transparent 1px)`,
        backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    >
      {/* Top Floating Toolbar */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 bg-[#1C1A17]/95 border border-[#2E2924] rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto"
      >
        {/* Lock Toggle */}
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`p-2 rounded-xl transition-all ${
            isLocked ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title={isLocked ? "Canvas Locked" : "Lock Canvas"}
        >
          {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>

        {/* Hand / Pan Tool */}
        <button
          onClick={() => setActiveTool("hand")}
          className={`p-2 rounded-xl transition-all ${
            activeTool === "hand" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Pan Mode (H / Space)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[#2E2924] mx-0.5" />

        {/* 1. Selection Tool */}
        <button
          onClick={() => setActiveTool("select")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "select" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Select & Move (1 / V)"
        >
          <MousePointer className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">1</span>
        </button>

        {/* 2. Rectangle */}
        <button
          onClick={() => setActiveTool("rectangle")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "rectangle" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Rectangle (2 / R)"
        >
          <Square className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">2</span>
        </button>

        {/* 3. Diamond */}
        <button
          onClick={() => setActiveTool("diamond")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "diamond" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Diamond (3 / D)"
        >
          <Diamond className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">3</span>
        </button>

        {/* 4. Circle / Ellipse */}
        <button
          onClick={() => setActiveTool("circle")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "circle" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Circle (4 / O / C)"
        >
          <Circle className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">4</span>
        </button>

        {/* 5. Arrow */}
        <button
          onClick={() => setActiveTool("arrow")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "arrow" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Arrow (5 / A)"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">5</span>
        </button>

        {/* 6. Line */}
        <button
          onClick={() => setActiveTool("line")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "line" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Line (6 / L)"
        >
          <Minus className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">6</span>
        </button>

        {/* 7. Pen Tool */}
        <button
          onClick={() => setActiveTool("pen")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "pen" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Pen (7 / P)"
        >
          <Pen className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">7</span>
        </button>

        {/* Pencil Tool */}
        <button
          onClick={() => setActiveTool("pencil")}
          className={`p-2 rounded-xl transition-all ${
            activeTool === "pencil" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Pencil Sketch"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* 8. Sticky Note */}
        <button
          onClick={() => setActiveTool("sticky")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "sticky" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Sticky Note (8 / S / T)"
        >
          <StickyNote className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">8</span>
        </button>

        {/* 9. Media Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="relative p-2 rounded-xl text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] transition-all disabled:opacity-50"
          title="Upload Media (9 / M)"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[#A3E635]" /> : <ImageIcon className="w-4 h-4" />}
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">9</span>
        </button>

        {/* 0. Eraser Tool */}
        <button
          onClick={() => setActiveTool("eraser")}
          className={`relative p-2 rounded-xl transition-all ${
            activeTool === "eraser" ? "bg-[#A3E635] text-[#171512] shadow-md font-bold" : "text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B]"
          }`}
          title="Eraser (0 / E)"
        >
          <Eraser className="w-4 h-4" />
          <span className="absolute bottom-0.5 right-1 text-[8px] font-mono opacity-70">0</span>
        </button>

        <div className="w-px h-5 bg-[#2E2924] mx-0.5" />

        {/* Color Dot Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPalette(!showColorPalette)}
            className="p-1.5 rounded-xl hover:bg-[#241F1B] transition-colors flex items-center justify-center"
            title="Stroke & Pen Color"
          >
            <div
              style={{ backgroundColor: activeColor }}
              className="w-5 h-5 rounded-full border-2 border-[#171512] shadow-md ring-1 ring-white/20"
            />
          </button>

          {showColorPalette && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 p-2 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-2xl flex gap-1.5 z-50">
              {PEN_COLORS.map((col) => (
                <button
                  key={col.name}
                  onClick={() => {
                    setActiveColor(col.color);
                    setShowColorPalette(false);
                  }}
                  style={{ backgroundColor: col.color }}
                  className={`w-6 h-6 rounded-full border border-black/40 hover:scale-110 transition-transform ${
                    activeColor === col.color ? "ring-2 ring-[#A3E635] scale-110" : ""
                  }`}
                  title={col.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Undo & Redo */}
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="p-2 rounded-xl text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] disabled:opacity-30 transition-colors"
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-2 rounded-xl text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] disabled:opacity-30 transition-colors"
          title="Redo (Cmd+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDeleteSelected}
          disabled={selectedItemIds.length === 0}
          className={`p-2 rounded-xl transition-all ${
            selectedItemIds.length > 0
              ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              : "text-[#8A837A] opacity-30 cursor-not-allowed"
          }`}
          title="Delete (Delete / Backspace)"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* More Options Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-2 rounded-xl text-[#8A837A] hover:text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute top-12 right-0 w-48 bg-[#1C1A17] border border-[#2E2924] rounded-2xl shadow-2xl p-1.5 text-xs font-mono text-[#DDD4C8] space-y-1 z-50 animate-fade-in">
              <button
                onClick={() => {
                  handleFitToScreen();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#241F1B] hover:text-[#A3E635] transition-colors"
              >
                <Scan className="w-3.5 h-3.5" />
                <span>Fit to Screen</span>
              </button>

              <button
                onClick={() => {
                  setTransform({ x: 0, y: 0, scale: 1 });
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#241F1B] hover:text-[#A3E635] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset View (100%)</span>
              </button>

              <button
                onClick={() => {
                  setIsFullscreen(!isFullscreen);
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#241F1B] hover:text-[#A3E635] transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}</span>
              </button>

              <div className="h-px bg-[#2E2924] my-1" />

              <button
                onClick={() => {
                  setShowShortcutsModal(true);
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#241F1B] text-[#A3E635] transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Keyboard Shortcuts (?)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Excalidraw Left Properties Inspector */}
      {selectedItemsObjects.length > 0 && (
        <CanvasInspector
          selectedItems={selectedItemsObjects}
          properties={{
            strokeColor: activeColor,
            strokeWidth: 3,
            roughness: "clean",
            fillStyle: "solid",
            opacity: 1,
          }}
          onUpdateProperties={handleUpdateProperties}
          onDelete={handleDeleteSelected}
          onDuplicate={handleDuplicateSelected}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onBringForward={handleBringToFront}
          onSendBackward={handleSendToBack}
          onAlign={handleAlignSelected}
          onClose={() => setSelectedItemIds([])}
        />
      )}

      {/* Main Canvas Transformation Plane */}
      <div
        id="canvas-plane"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Render Canvas Items */}
        {items?.map((item) => {
          const dim = localDimensions[item._id] || {
            x: item.x,
            y: item.y,
            width: item.width || 200,
            height: item.height || 150,
          };
          const isSelected = selectedItemIds.includes(item._id);

          return (
            <div key={item._id} className="pointer-events-auto">
              <CanvasItemRenderer
                item={item}
                isSelected={isSelected}
                isEditable={isEditable}
                isLocked={isLocked}
                dim={dim}
                isResizing={interaction.type === "resizing" && interaction.itemId === item._id}
                onItemPointerDown={handleItemPointerDown}
                onResizePointerDown={handleResizePointerDown}
                onDelete={async (id) => {
                  setUndoStack((prev) => [...prev, { type: "delete", itemId: id, previousState: item }]);
                  await executeDelete(id);
                  setSelectedItemIds((prev) => prev.filter((i) => i !== id));
                }}
                onDuplicate={async (it) => {
                  const newId = await executeAddItem({
                    projectId,
                    type: it.type,
                    content: it.content,
                    title: it.title ? `${it.title} (Copy)` : undefined,
                    x: dim.x + 25,
                    y: dim.y + 25,
                    width: dim.width,
                    height: dim.height,
                    color: it.color,
                    rotation: it.rotation,
                    zIndex: (it.zIndex || 5) + 1,
                    metadata: it.metadata,
                  });
                  setSelectedItemIds([newId]);
                }}
                onUpdateContent={async (id, content) => {
                  await executeUpdateContent({ itemId: id, content });
                }}
              />
            </div>
          );
        })}

        {/* Real-time Freehand Drawing Live Overlay */}
        {interaction.type === "drawing" && interaction.points.length > 0 && (
          <svg className="absolute inset-0 pointer-events-none z-50 overflow-visible">
            <path
              d={pointsToSvgPath(interaction.points)}
              fill="none"
              stroke={activeColor}
              strokeWidth={activeTool === "pencil" ? 1.5 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Real-time Vector Shape Creation Drag Preview */}
        {interaction.type === "drawing_shape" && (
          <svg className="absolute inset-0 pointer-events-none z-50 overflow-visible">
            <defs>
              <marker id="preview-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={activeColor} />
              </marker>
            </defs>
            {interaction.tool === "rectangle" && (
              <rect
                x={Math.min(interaction.start.x, interaction.current.x)}
                y={Math.min(interaction.start.y, interaction.current.y)}
                width={Math.abs(interaction.current.x - interaction.start.x)}
                height={Math.abs(interaction.current.y - interaction.start.y)}
                rx="12"
                fill={`${activeColor}15`}
                stroke={activeColor}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}
            {interaction.tool === "diamond" && (
              <polygon
                points={`
                  ${(interaction.start.x + interaction.current.x) / 2},${Math.min(interaction.start.y, interaction.current.y)}
                  ${Math.max(interaction.start.x, interaction.current.x)},${(interaction.start.y + interaction.current.y) / 2}
                  ${(interaction.start.x + interaction.current.x) / 2},${Math.max(interaction.start.y, interaction.current.y)}
                  ${Math.min(interaction.start.x, interaction.current.x)},${(interaction.start.y + interaction.current.y) / 2}
                `}
                fill={`${activeColor}15`}
                stroke={activeColor}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}
            {interaction.tool === "circle" && (
              <ellipse
                cx={(interaction.start.x + interaction.current.x) / 2}
                cy={(interaction.start.y + interaction.current.y) / 2}
                rx={Math.abs(interaction.current.x - interaction.start.x) / 2}
                ry={Math.abs(interaction.current.y - interaction.start.y) / 2}
                fill={`${activeColor}15`}
                stroke={activeColor}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}
            {interaction.tool === "arrow" && (
              <line
                x1={interaction.start.x}
                y1={interaction.start.y}
                x2={interaction.current.x}
                y2={interaction.current.y}
                stroke={activeColor}
                strokeWidth="2.5"
                strokeDasharray="4 4"
                markerEnd="url(#preview-arrow)"
              />
            )}
            {interaction.tool === "line" && (
              <line
                x1={interaction.start.x}
                y1={interaction.start.y}
                x2={interaction.current.x}
                y2={interaction.current.y}
                stroke={activeColor}
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
            )}
          </svg>
        )}

        {/* Marquee Selection Box Overlay */}
        {interaction.type === "marquee" && (
          <div
            style={{
              left: `${Math.min(interaction.start.x, interaction.current.x)}px`,
              top: `${Math.min(interaction.start.y, interaction.current.y)}px`,
              width: `${Math.abs(interaction.current.x - interaction.start.x)}px`,
              height: `${Math.abs(interaction.current.y - interaction.start.y)}px`,
            }}
            className="absolute border border-[#A3E635] bg-[#A3E635]/10 rounded pointer-events-none z-50 border-dashed"
          />
        )}
      </div>

      {/* Bottom Status & Radar Dock */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Zoom & Info Badge */}
        <div className="flex items-center gap-2 p-1.5 bg-[#1C1A17]/90 border border-[#2E2924] rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto text-xs font-mono text-[#8A837A]">
          <button
            onClick={() => zoomToPoint(transform.scale * 0.8, containerSize.width / 2, containerSize.height / 2)}
            className="p-1 rounded-lg hover:text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center text-[#EDE6DD] font-semibold">{Math.round(transform.scale * 100)}%</span>
          <button
            onClick={() => zoomToPoint(transform.scale * 1.25, containerSize.width / 2, containerSize.height / 2)}
            className="p-1 rounded-lg hover:text-[#EDE6DD] hover:bg-[#241F1B] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#2E2924]" />
          <span className="px-1 text-[11px] text-[#A3E635]">{items?.length || 0} nodes</span>
        </div>

        {/* MiniMap Radar */}
        <CanvasMiniMap
          items={items || []}
          localDimensions={localDimensions}
          transform={transform}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          onNavigateToPoint={(cx, cy) => {
            if (!containerRef.current) return;
            const cw = containerRef.current.clientWidth;
            const ch = containerRef.current.clientHeight;
            setTransform((prev) => ({
              ...prev,
              x: cw / 2 - cx * prev.scale,
              y: ch / 2 - cy * prev.scale,
            }));
          }}
        />
      </div>

      {/* Hidden File Input for Media Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,application/pdf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setIsUploading(true);
          try {
            const res = await uploadMedia(file);
            const cw = containerRef.current?.clientWidth || 1200;
            const ch = containerRef.current?.clientHeight || 800;
            const spawnPos = screenToCanvas(cw / 2, ch / 2);

            let nodeType: "image" | "video" | "audio" | "pdf" = "image";
            if (file.type.startsWith("video/")) nodeType = "video";
            else if (file.type.startsWith("audio/")) nodeType = "audio";
            else if (file.type === "application/pdf") nodeType = "pdf";

            const id = await executeAddItem({
              projectId,
              type: nodeType,
              content: res.url,
              title: file.name,
              x: Math.round(spawnPos.x - 140),
              y: Math.round(spawnPos.y - 100),
              width: nodeType === "audio" ? 320 : 280,
              height: nodeType === "audio" ? 100 : 200,
              zIndex: 5,
            });
            setSelectedItemIds([id]);
          } catch (err) {
            console.error("Upload error:", err);
          } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      />

      {/* Keyboard Shortcuts Dialog */}
      <CanvasShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}
