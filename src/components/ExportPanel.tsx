"use client";

import React, { useState } from "react";
import { useEditor } from "@/lib/store";
import { RESOLUTIONS } from "@/lib/types";
import { getTotalDurationFrames, formatFrameAsTime } from "@/lib/utils";

type OutputFormat = "mp4" | "webm";
type Quality = "draft" | "standard" | "high";

export default function ExportPanel() {
  const { state } = useEditor();
  const { project } = state;

  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [quality, setQuality] = useState<Quality>("standard");
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<{
    jobId: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolution = RESOLUTIONS[project.aspectRatio];
  const totalFrames = getTotalDurationFrames(project.scenes);
  const durationStr = formatFrameAsTime(totalFrames, project.fps);

  const qualityDescriptions: Record<Quality, string> = {
    draft: "Fast render, lower quality (50% scale, CRF 28)",
    standard: "Balanced quality and speed (100% scale, CRF 18)",
    high: "Best quality, slower render (100% scale, CRF 12)",
  };

  async function handleRender() {
    setIsRendering(true);
    setError(null);
    setRenderResult(null);

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          outputFormat: format,
          quality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Render failed");
      }

      setRenderResult({
        jobId: data.jobId,
        message: data.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed");
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">Export</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Project Summary */}
        <section>
          <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
            Project Summary
          </h3>
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Resolution</span>
              <span>
                {resolution.width} x {resolution.height}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Aspect Ratio</span>
              <span>{project.aspectRatio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Frame Rate</span>
              <span>{project.fps} fps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Duration</span>
              <span>{durationStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Scenes</span>
              <span>{project.scenes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Total Frames</span>
              <span>{totalFrames}</span>
            </div>
          </div>
        </section>

        {/* Format */}
        <section>
          <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
            Output Format
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(["mp4", "webm"] as OutputFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                  format === f
                    ? "border-[#40d99d] bg-[#40d99d]/10 text-[#40d99d]"
                    : "border-[#e5e5e5] hover:border-[#6b7280]"
                }`}
              >
                .{f}
              </button>
            ))}
          </div>
        </section>

        {/* Quality */}
        <section>
          <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
            Quality
          </h3>
          <div className="space-y-2">
            {(["draft", "standard", "high"] as Quality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  quality === q
                    ? "border-[#40d99d] bg-[#40d99d]/10"
                    : "border-[#e5e5e5] hover:border-[#6b7280]"
                }`}
              >
                <span
                  className={`text-sm font-medium capitalize ${
                    quality === q ? "text-[#40d99d]" : ""
                  }`}
                >
                  {q}
                </span>
                <p className="text-[10px] text-[#6b7280] mt-0.5">
                  {qualityDescriptions[q]}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Render Button */}
        <button
          onClick={handleRender}
          disabled={isRendering || totalFrames === 0}
          className="btn-primary w-full text-sm flex items-center justify-center gap-2"
        >
          {isRendering ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Starting Render...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Render Video
            </>
          )}
        </button>

        {/* Result */}
        {renderResult && (
          <div className="bg-[#40d99d]/10 border border-[#40d99d]/30 rounded-lg p-3 text-sm">
            <p className="text-[#40d99d] font-medium mb-1">Render Job Created</p>
            <p className="text-xs text-[#6b7280]">{renderResult.message}</p>
            <p className="text-xs text-[#6b7280] mt-1 font-mono">
              Job ID: {renderResult.jobId}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <p className="text-[#dc2626]">{error}</p>
          </div>
        )}

        {/* Batch Render Info */}
        <section>
          <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
            Marketing Automation
          </h3>
          <div className="bg-white border border-[#e5e5e5] rounded-lg p-3 text-xs text-[#6b7280] space-y-2">
            <p>
              For batch rendering and scheduled publishing, use the render API
              endpoint programmatically:
            </p>
            <code className="block bg-[#f0f0f0] rounded p-2 font-mono text-[10px] overflow-x-auto text-[#1a1a1a]">
              POST /api/render
              <br />
              {`{ "projectId": "...", "outputFormat": "mp4", "quality": "high" }`}
            </code>
            <p>
              Integrate with your CMS or scheduling tool to automate video
              production at scale.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
