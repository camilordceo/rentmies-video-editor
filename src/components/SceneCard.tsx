"use client";

import React from "react";
import type { Scene } from "@/lib/types";
import { formatFrameAsTime } from "@/lib/utils";

interface SceneCardProps {
  scene: Scene;
  index: number;
  isSelected: boolean;
  fps: number;
  onSelect: () => void;
  onDelete: () => void;
}

export default function SceneCard({
  scene,
  index,
  isSelected,
  fps,
  onSelect,
  onDelete,
}: SceneCardProps) {
  const elementCount =
    scene.textElements.length + scene.mediaElements.length + scene.captions.length;

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-all group ${
        isSelected
          ? "border-editor-accent bg-editor-accent/10"
          : "border-editor-border hover:border-editor-text-muted bg-editor-panel"
      }`}
    >
      {/* Scene thumbnail preview */}
      <div
        className="aspect-video rounded-md mb-2 flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: scene.backgroundColor }}
      >
        <span className="text-[10px] text-white/40 font-mono">
          {scene.name}
        </span>
        {scene.transition !== "none" && (
          <span className="absolute top-1 right-1 text-[8px] bg-black/50 text-white/70 px-1 rounded">
            {scene.transition}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium truncate max-w-[140px]">
            {scene.name}
          </p>
          <p className="text-[10px] text-editor-text-muted mt-0.5">
            {formatFrameAsTime(scene.durationFrames, fps)} &middot; {elementCount} element
            {elementCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-editor-danger/20 rounded transition-all"
          title="Delete scene"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-editor-danger">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
