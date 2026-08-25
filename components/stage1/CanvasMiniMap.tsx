"use client";

import React, { useState } from "react";
import { Map, ChevronDown, ChevronUp } from "lucide-react";

interface CanvasMiniMapProps {
  items: any[];
  localDimensions: Record<string, { x: number; y: number; width: number; height: number }>;
  transform: { x: number; y: number; scale: number };
  containerWidth: number;
  containerHeight: number;
  onNavigateToPoint: (canvasX: number, canvasY: number) => void;
}

export function CanvasMiniMap({
  items,
  localDimensions,
  transform,
  containerWidth,
  containerHeight,
  onNavigateToPoint,
}: CanvasMiniMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Map canvas bounds
  let minX = -100;
  let minY = -100;
  let maxX = 1200;
  let maxY = 800;

  if (items && items.length > 0) {
    items.forEach((item) => {
      const dim = localDimensions[item._id] || {
        x: item.x,
        y: item.y,
        width: item.width || 200,
        height: item.height || 150,
      };
      minX = Math.min(minX, dim.x - 100);
      minY = Math.min(minY, dim.y - 100);
      maxX = Math.max(maxX, dim.x + dim.width + 100);
      maxY = Math.max(maxY, dim.y + dim.height + 100);
    });
  }

  const mapW = 160;
  const mapH = 100;
  const totalW = Math.max(maxX - minX, 400);
  const totalH = Math.max(maxY - minY, 300);

  const scaleFactorX = mapW / totalW;
  const scaleFactorY = mapH / totalH;
  const mapScale = Math.min(scaleFactorX, scaleFactorY);

  // Viewport camera rect on minimap
  const viewCanvasX = -transform.x / transform.scale;
  const viewCanvasY = -transform.y / transform.scale;
  const viewCanvasW = containerWidth / transform.scale;
  const viewCanvasH = containerHeight / transform.scale;

  const vpLeft = Math.max((viewCanvasX - minX) * mapScale, 0);
  const vpTop = Math.max((viewCanvasY - minY) * mapScale, 0);
  const vpWidth = Math.min(viewCanvasW * mapScale, mapW);
  const vpHeight = Math.min(viewCanvasH * mapScale, mapH);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = minX + clickX / mapScale;
    const targetCanvasY = minY + clickY / mapScale;

    onNavigateToPoint(targetCanvasX, targetCanvasY);
  };

  return (
    <div className="hidden sm:flex flex-col items-end z-30 pointer-events-auto">
      {isExpanded && (
        <div
          onClick={handleMapClick}
          className="relative w-40 h-24 mb-1.5 bg-[#141210]/95 border border-[#2E2924] rounded-xl overflow-hidden shadow-2xl backdrop-blur-md cursor-crosshair group"
          title="Click to jump camera"
        >
          {/* Render item dots / boxes */}
          {items?.map((item) => {
            const dim = localDimensions[item._id] || {
              x: item.x,
              y: item.y,
              width: item.width || 200,
              height: item.height || 150,
            };
            const ix = (dim.x - minX) * mapScale;
            const iy = (dim.y - minY) * mapScale;
            const iw = Math.max(dim.width * mapScale, 2);
            const ih = Math.max(dim.height * mapScale, 2);

            return (
              <div
                key={item._id}
                style={{
                  left: `${ix}px`,
                  top: `${iy}px`,
                  width: `${iw}px`,
                  height: `${ih}px`,
                  backgroundColor: item.color || "#A3E635",
                }}
                className="absolute rounded-[1px] opacity-60 pointer-events-none"
              />
            );
          })}

          {/* Current Camera Viewport Box */}
          <div
            style={{
              left: `${vpLeft}px`,
              top: `${vpTop}px`,
              width: `${vpWidth}px`,
              height: `${vpHeight}px`,
            }}
            className="absolute border-2 border-[#A3E635] bg-[#A3E635]/15 rounded pointer-events-none transition-all shadow-sm"
          />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1C1916]/90 hover:bg-[#241F1B] border border-[#2E2924] rounded-xl text-[11px] font-mono text-[#8A837A] hover:text-[#EDE6DD] transition-all shadow-lg"
      >
        <Map className="w-3.5 h-3.5 text-[#A3E635]" />
        <span>Radar</span>
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
    </div>
  );
}
