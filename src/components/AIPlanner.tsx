"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditor } from "@/lib/store";
import type { Scene, TextElement, AnimationType, TransitionType } from "@/lib/types";

interface VideoPlan {
  title: string;
  description: string;
  scenes: Array<{
    name: string;
    description: string;
    durationSeconds: number;
    textOverlays: Array<{ text: string; type: string; animation: string }>;
    transition: string;
  }>;
  suggestedComposition: string;
  hookSuggestion: string;
}

interface Hook {
  text: string;
  type: string;
  score: number;
}

const VALID_ANIMATIONS: AnimationType[] = [
  "none", "fade-in", "fade-out", "slide-up", "slide-down",
  "slide-left", "slide-right", "scale-in", "typewriter", "bounce",
];

const VALID_TRANSITIONS: TransitionType[] = [
  "none", "fade", "slide-left", "slide-right", "wipe", "zoom",
];

function toAnimation(val: string): AnimationType {
  return VALID_ANIMATIONS.includes(val as AnimationType) ? (val as AnimationType) : "fade-in";
}

function toTransition(val: string): TransitionType {
  return VALID_TRANSITIONS.includes(val as TransitionType) ? (val as TransitionType) : "none";
}

function toTextType(val: string): TextElement["type"] {
  const valid: TextElement["type"][] = ["title", "subtitle", "cta", "lower-third", "custom"];
  return valid.includes(val as TextElement["type"]) ? (val as TextElement["type"]) : "custom";
}

export default function AIPlanner() {
  const { state, dispatch } = useEditor();

  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<VideoPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState("");

  const [hookTopic, setHookTopic] = useState("");
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [hookError, setHookError] = useState("");

  async function handleGeneratePlan() {
    if (!prompt.trim()) return;
    setLoadingPlan(true);
    setPlanError("");
    setPlan(null);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: state.project.aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plan");
      setPlan(data);
    } catch (err: unknown) {
      setPlanError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingPlan(false);
    }
  }

  async function handleGenerateHooks() {
    if (!hookTopic.trim()) return;
    setLoadingHooks(true);
    setHookError("");
    setHooks([]);
    try {
      const res = await fetch("/api/ai/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: hookTopic, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate hooks");
      setHooks(data.hooks || []);
    } catch (err: unknown) {
      setHookError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingHooks(false);
    }
  }

  function handleApplyPlan() {
    if (!plan) return;
    const fps = state.project.fps;

    const scenes: Scene[] = plan.scenes.map((aiScene, idx) => {
      const durationFrames = Math.round(aiScene.durationSeconds * fps);

      const textElements: TextElement[] = aiScene.textOverlays.map((overlay, tIdx) => {
        const isTitle = overlay.type === "title";
        const yPos = isTitle ? 40 : 55 + tIdx * 12;

        return {
          id: uuidv4(),
          type: toTextType(overlay.type),
          text: overlay.text,
          position: { x: 50, y: yPos },
          size: { width: 80, height: isTitle ? 20 : 15 },
          style: {
            fontFamily: "Inter",
            fontSize: isTitle ? 72 : overlay.type === "cta" ? 40 : 48,
            fontWeight: isTitle ? 800 : 600,
            color: "#ffffff",
            backgroundColor: overlay.type === "cta" ? "rgba(64,217,157,0.9)" : "transparent",
            textAlign: "center" as const,
            lineHeight: 1.2,
            letterSpacing: isTitle ? -1 : 0,
            textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            borderRadius: overlay.type === "cta" ? 12 : 0,
            padding: overlay.type === "cta" ? 16 : 0,
          },
          startFrame: 0,
          durationFrames,
          animation: toAnimation(overlay.animation),
        };
      });

      return {
        id: uuidv4(),
        name: aiScene.name || `Scene ${idx + 1}`,
        durationFrames,
        backgroundColor: "#0f0f1a",
        mediaElements: [],
        textElements,
        captions: [],
        captionStyle: {
          fontFamily: "Inter",
          fontSize: 48,
          fontWeight: 700,
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.6)",
          position: "bottom" as const,
          maxWidth: 80,
          animation: "fade" as const,
        },
        transition: toTransition(aiScene.transition),
        transitionDurationFrames: aiScene.transition !== "none" ? Math.round(fps * 0.5) : 0,
      };
    });

    dispatch({
      type: "SET_PROJECT",
      project: {
        ...state.project,
        name: plan.title || state.project.name,
        description: plan.description || state.project.description,
        scenes,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return (
    <div className="h-full bg-white border-l border-[#e5e5e5] flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-[#e5e5e5] flex items-center gap-2"
        style={{ fontFamily: "Inter", fontWeight: 500, fontSize: "13px", color: "#1a1a1a" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#40d99d" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        AI Planner
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Plan result */}
        {plan && (
          <div className="p-4 space-y-3">
            {/* Title card */}
            <div className="rounded-lg bg-[#f8f8f8] p-3">
              <h3
                className="text-sm mb-1"
                style={{ fontFamily: "Inter", fontWeight: 500, color: "#1a1a1a" }}
              >
                {plan.title}
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
              >
                {plan.description}
              </p>
            </div>

            {/* Hook suggestion */}
            {plan.hookSuggestion && (
              <div className="rounded-lg border border-[#40d99d]/30 bg-[#40d99d]/5 p-3">
                <div
                  className="text-[10px] uppercase tracking-wider mb-1"
                  style={{ fontFamily: "Inter", fontWeight: 500, color: "#40d99d" }}
                >
                  Hook Suggestion
                </div>
                <p
                  className="text-sm"
                  style={{ fontFamily: "Inter", fontWeight: 500, color: "#1a1a1a" }}
                >
                  &ldquo;{plan.hookSuggestion}&rdquo;
                </p>
              </div>
            )}

            {/* Scenes */}
            <div>
              <div
                className="text-[10px] uppercase tracking-wider mb-2"
                style={{ fontFamily: "Inter", fontWeight: 500, color: "#6b7280" }}
              >
                Scenes ({plan.scenes.length})
              </div>
              <div className="space-y-2">
                {plan.scenes.map((scene, idx) => (
                  <div key={idx} className="rounded-lg bg-[#f8f8f8] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs"
                        style={{ fontFamily: "Inter", fontWeight: 500, color: "#1a1a1a" }}
                      >
                        {scene.name}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#e5e5e5]"
                        style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
                      >
                        {scene.durationSeconds}s
                      </span>
                    </div>
                    <p
                      className="text-[11px] leading-relaxed mb-2"
                      style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
                    >
                      {scene.description}
                    </p>
                    {scene.textOverlays.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scene.textOverlays.map((overlay, oIdx) => (
                          <span
                            key={oIdx}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-[#e5e5e5]"
                            style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
                          >
                            {overlay.type}: {overlay.text.slice(0, 30)}
                            {overlay.text.length > 30 ? "..." : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    {scene.transition !== "none" && (
                      <div
                        className="text-[10px] mt-1.5"
                        style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
                      >
                        Transition: {scene.transition}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested composition */}
            {plan.suggestedComposition && (
              <div
                className="text-[11px] text-center"
                style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
              >
                Suggested composition:{" "}
                <span style={{ fontWeight: 500, color: "#1a1a1a" }}>
                  {plan.suggestedComposition}
                </span>
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={handleApplyPlan}
              className="w-full py-2 rounded-lg text-white text-sm transition-all duration-200 hover:opacity-90"
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                backgroundColor: "#40d99d",
              }}
            >
              Apply to Project
            </button>
          </div>
        )}

        {/* Plan error */}
        {planError && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p
              className="text-xs"
              style={{ fontFamily: "Inter", fontWeight: 400, color: "#dc2626" }}
            >
              {planError}
            </p>
          </div>
        )}

        {/* Loading */}
        {loadingPlan && (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[#40d99d] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#40d99d] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#40d99d] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p
              className="text-xs"
              style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
            >
              Planning your video...
            </p>
          </div>
        )}

        {/* Hooks section */}
        <div className="border-t border-[#e5e5e5] mt-2">
          <div className="p-4">
            <div
              className="text-[10px] uppercase tracking-wider mb-3"
              style={{ fontFamily: "Inter", fontWeight: 500, color: "#6b7280" }}
            >
              Generate Hooks
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={hookTopic}
                onChange={(e) => setHookTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateHooks()}
                placeholder="Enter topic..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#e5e5e5] bg-white focus:outline-none focus:border-[#40d99d] transition-colors"
                style={{ fontFamily: "Inter", fontWeight: 400, color: "#1a1a1a" }}
              />
              <button
                onClick={handleGenerateHooks}
                disabled={loadingHooks || !hookTopic.trim()}
                className="px-3 py-1.5 text-xs rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ fontFamily: "Inter", fontWeight: 500, backgroundColor: "#40d99d" }}
              >
                {loadingHooks ? "..." : "Go"}
              </button>
            </div>

            {hookError && (
              <p className="text-xs mb-2" style={{ fontFamily: "Inter", fontWeight: 400, color: "#dc2626" }}>
                {hookError}
              </p>
            )}

            {hooks.length > 0 && (
              <div className="space-y-2">
                {hooks.map((hook, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-[#f8f8f8] p-3 flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs leading-relaxed"
                        style={{ fontFamily: "Inter", fontWeight: 500, color: "#1a1a1a" }}
                      >
                        &ldquo;{hook.text}&rdquo;
                      </p>
                      <span
                        className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded-full bg-white border border-[#e5e5e5]"
                        style={{ fontFamily: "Inter", fontWeight: 400, color: "#6b7280" }}
                      >
                        {hook.type}
                      </span>
                    </div>
                    <div
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                      style={{
                        fontFamily: "Inter",
                        fontWeight: 500,
                        backgroundColor: hook.score >= 8 ? "#40d99d" : hook.score >= 6 ? "#e5e5e5" : "#f8f8f8",
                        color: hook.score >= 8 ? "#ffffff" : "#1a1a1a",
                      }}
                    >
                      {hook.score}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom input */}
      <div className="p-3 border-t border-[#e5e5e5] bg-[#f8f8f8]">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGeneratePlan()}
            placeholder="Describe your video..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#e5e5e5] bg-white focus:outline-none focus:border-[#40d99d] transition-colors"
            style={{ fontFamily: "Inter", fontWeight: 400, color: "#1a1a1a" }}
          />
          <button
            onClick={handleGeneratePlan}
            disabled={loadingPlan || !prompt.trim()}
            className="px-3 py-2 rounded-lg text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            style={{ fontFamily: "Inter", fontWeight: 500, backgroundColor: "#40d99d" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Plan
          </button>
        </div>
      </div>
    </div>
  );
}
