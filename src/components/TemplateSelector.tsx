"use client";

import React, { useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import type { Template } from "@/lib/types";

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  youtube: "YouTube",
  shorts: "Shorts",
  marketing: "Marketing",
  product: "Product",
};

const CATEGORY_COLORS: Record<string, string> = {
  youtube: "bg-red-50 text-red-600",
  shorts: "bg-[#40d99d]/10 text-[#40d99d]",
  marketing: "bg-blue-50 text-blue-600",
  product: "bg-[#40d99d]/10 text-[#40d99d]",
};

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(TEMPLATES.map((t) => t.category)));
  const filtered = activeCategory
    ? TEMPLATES.filter((t) => t.category === activeCategory)
    : TEMPLATES;

  return (
    <div>
      {/* Category filters */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            activeCategory === null
              ? "bg-[#40d99d] text-white"
              : "bg-[#f0f0f0] text-[#6b7280] hover:text-[#1a1a1a]"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-[#40d99d] text-white"
                : "bg-[#f0f0f0] text-[#6b7280] hover:text-[#1a1a1a]"
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelect(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: Template;
  onSelect: () => void;
}) {
  const sceneCount = template.scenes.length;
  const totalFrames = template.scenes.reduce((acc, s) => acc + s.durationFrames, 0);
  const durationSec = (totalFrames / template.fps).toFixed(1);

  return (
    <button
      onClick={onSelect}
      className="text-left bg-white border border-[#e5e5e5] rounded-xl p-4 hover:border-[#40d99d] hover:shadow-sm transition-all duration-200 group"
    >
      {/* Preview */}
      <div
        className={`rounded-lg mb-3 flex items-center justify-center bg-gradient-to-br from-[#f8f8f8] to-[#f0f0f0] ${
          template.aspectRatio === "9:16" ? "aspect-[9/16] max-h-48 mx-auto" : "aspect-video"
        }`}
      >
        <div className="text-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-[#6b7280] group-hover:text-[#40d99d] transition-colors"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-sm text-[#1a1a1a] group-hover:text-[#40d99d] transition-colors duration-200">
            {template.name}
          </h3>
          <p className="text-xs text-[#6b7280] mt-1 line-clamp-2">
            {template.description}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
            CATEGORY_COLORS[template.category] || "bg-[#f0f0f0] text-[#6b7280]"
          }`}
        >
          {CATEGORY_LABELS[template.category]}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-[#6b7280]">
        <span>{template.aspectRatio}</span>
        <span>{sceneCount} scenes</span>
        <span>{durationSec}s</span>
        <span>{template.fps}fps</span>
      </div>
    </button>
  );
}
