"use client";

import React, { useState } from "react";
import { useEditor } from "@/lib/store";
import type { CaptionSegment } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export default function CaptionEditor() {
  const { state, dispatch } = useEditor();
  const { project, selectedSceneId } = state;
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScene = project.scenes.find((s) => s.id === selectedSceneId);

  if (!selectedScene) {
    return (
      <div className="p-4 text-sm text-[#6b7280]">
        Select a scene to manage captions.
      </div>
    );
  }

  async function handleTranscribe() {
    if (!selectedSceneId) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,video/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsTranscribing(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fps", project.fps.toString());

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Transcription failed");
        }

        dispatch({
          type: "SET_CAPTIONS",
          sceneId: selectedSceneId!,
          captions: data.segments,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transcription failed");
      } finally {
        setIsTranscribing(false);
      }
    };

    input.click();
  }

  function handleUpdateCaption(captionId: string, updates: Partial<CaptionSegment>) {
    if (!selectedSceneId) return;
    dispatch({
      type: "UPDATE_CAPTION",
      sceneId: selectedSceneId,
      captionId,
      updates,
    });
  }

  function handleDeleteCaption(captionId: string) {
    if (!selectedSceneId) return;
    dispatch({
      type: "DELETE_CAPTION",
      sceneId: selectedSceneId,
      captionId,
    });
  }

  function handleClearCaptions() {
    if (!selectedSceneId) return;
    dispatch({
      type: "SET_CAPTIONS",
      sceneId: selectedSceneId,
      captions: [],
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header flex items-center justify-between">
        <span>Captions</span>
        <span className="text-[10px] font-normal normal-case tracking-normal text-[#6b7280]">
          {selectedScene.captions.length} segments
        </span>
      </div>

      <div className="p-3 border-b border-[#e5e5e5] space-y-2">
        <button
          onClick={handleTranscribe}
          disabled={isTranscribing}
          className="btn-primary text-xs w-full flex items-center justify-center gap-2"
        >
          {isTranscribing ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Transcribing...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              Auto-Caption (Whisper AI)
            </>
          )}
        </button>

        {error && (
          <div className="text-xs text-[#dc2626] bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </div>
        )}

        {/* Caption style controls */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#6b7280] block mb-1">Position</label>
            <select
              value={selectedScene.captionStyle.position}
              onChange={(e) =>
                dispatch({
                  type: "SET_CAPTION_STYLE",
                  sceneId: selectedScene.id,
                  style: { position: e.target.value as "top" | "center" | "bottom" },
                })
              }
              className="input-field text-xs"
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#6b7280] block mb-1">Animation</label>
            <select
              value={selectedScene.captionStyle.animation}
              onChange={(e) =>
                dispatch({
                  type: "SET_CAPTION_STYLE",
                  sceneId: selectedScene.id,
                  style: {
                    animation: e.target.value as "none" | "fade" | "pop" | "highlight-word",
                  },
                })
              }
              className="input-field text-xs"
            >
              <option value="none">None</option>
              <option value="fade">Fade</option>
              <option value="pop">Pop</option>
              <option value="highlight-word">Highlight Word</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#6b7280] block mb-1">Font Size</label>
            <input
              type="number"
              min={16}
              max={96}
              value={selectedScene.captionStyle.fontSize}
              onChange={(e) =>
                dispatch({
                  type: "SET_CAPTION_STYLE",
                  sceneId: selectedScene.id,
                  style: { fontSize: parseInt(e.target.value) || 48 },
                })
              }
              className="input-field text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#6b7280] block mb-1">Color</label>
            <input
              type="color"
              value={selectedScene.captionStyle.color}
              onChange={(e) =>
                dispatch({
                  type: "SET_CAPTION_STYLE",
                  sceneId: selectedScene.id,
                  style: { color: e.target.value },
                })
              }
              className="w-full h-7 rounded border border-[#e5e5e5] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Caption segments list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {selectedScene.captions.length === 0 ? (
          <p className="text-xs text-[#6b7280] text-center py-8">
            No captions yet. Upload an audio or video file to auto-generate captions with AI.
          </p>
        ) : (
          <>
            {selectedScene.captions.map((caption) => (
              <div
                key={caption.id}
                className="bg-white border border-[#e5e5e5] rounded-lg p-3 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#6b7280]">
                    {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                  </span>
                  <button
                    onClick={() => handleDeleteCaption(caption.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#dc2626] transition-opacity"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <textarea
                  value={caption.text}
                  onChange={(e) =>
                    handleUpdateCaption(caption.id, { text: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-transparent text-sm resize-none border-none outline-none text-[#1a1a1a]"
                />
              </div>
            ))}
            <button
              onClick={handleClearCaptions}
              className="btn-danger text-xs w-full mt-2"
            >
              Clear All Captions
            </button>
          </>
        )}
      </div>
    </div>
  );
}
