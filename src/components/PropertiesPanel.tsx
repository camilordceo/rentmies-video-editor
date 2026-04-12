"use client";

import React from "react";
import { useEditor } from "@/lib/store";
import type { AnimationType, TransitionType } from "@/lib/types";

const ANIMATION_OPTIONS: AnimationType[] = [
  "none", "fade-in", "fade-out", "slide-up", "slide-down",
  "slide-left", "slide-right", "scale-in", "typewriter", "bounce",
];

const TRANSITION_OPTIONS: TransitionType[] = [
  "none", "fade", "slide-left", "slide-right", "wipe", "zoom",
];

export default function PropertiesPanel() {
  const { state, dispatch } = useEditor();
  const { project, selectedSceneId, selectedElementId, selectedElementType } = state;

  const selectedScene = project.scenes.find((s) => s.id === selectedSceneId);

  if (!selectedScene) {
    return (
      <div className="h-full bg-[#f8f8f8] border-l border-[#e5e5e5] flex items-center justify-center p-6">
        <p className="text-sm text-[#6b7280] text-center">
          Select a scene to edit its properties
        </p>
      </div>
    );
  }

  // Find selected element
  const selectedText = selectedElementType === "text"
    ? selectedScene.textElements.find((el) => el.id === selectedElementId)
    : null;
  const selectedMedia = selectedElementType === "media"
    ? selectedScene.mediaElements.find((el) => el.id === selectedElementId)
    : null;

  return (
    <div className="h-full bg-[#f8f8f8] border-l border-[#e5e5e5] flex flex-col overflow-hidden">
      <div className="panel-header">Properties</div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Scene Properties */}
        <section>
          <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
            Scene
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Name</label>
              <input
                type="text"
                value={selectedScene.name}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_SCENE",
                    sceneId: selectedScene.id,
                    updates: { name: e.target.value },
                  })
                }
                className="input-field text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Duration (frames)</label>
                <input
                  type="number"
                  min={1}
                  value={selectedScene.durationFrames}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_SCENE",
                      sceneId: selectedScene.id,
                      updates: { durationFrames: Math.max(1, parseInt(e.target.value) || 1) },
                    })
                  }
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedScene.backgroundColor}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_SCENE",
                        sceneId: selectedScene.id,
                        updates: { backgroundColor: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded border border-[#e5e5e5] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedScene.backgroundColor}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_SCENE",
                        sceneId: selectedScene.id,
                        updates: { backgroundColor: e.target.value },
                      })
                    }
                    className="input-field text-sm flex-1 font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Transition</label>
                <select
                  value={selectedScene.transition}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TRANSITION",
                      sceneId: selectedScene.id,
                      transition: e.target.value as TransitionType,
                      durationFrames: selectedScene.transitionDurationFrames || 15,
                    })
                  }
                  className="input-field text-sm"
                >
                  {TRANSITION_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Trans. Frames</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={selectedScene.transitionDurationFrames}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TRANSITION",
                      sceneId: selectedScene.id,
                      transition: selectedScene.transition,
                      durationFrames: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Selected Text Element Properties */}
        {selectedText && (
          <section>
            <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
              Text Element
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Text</label>
                <textarea
                  value={selectedText.text}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TEXT_ELEMENT",
                      sceneId: selectedScene.id,
                      elementId: selectedText.id,
                      updates: { text: e.target.value },
                    })
                  }
                  rows={3}
                  className="input-field text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Font Size</label>
                  <input
                    type="number"
                    min={8}
                    max={200}
                    value={selectedText.style.fontSize}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TEXT_ELEMENT",
                        sceneId: selectedScene.id,
                        elementId: selectedText.id,
                        updates: {
                          style: {
                            ...selectedText.style,
                            fontSize: parseInt(e.target.value) || 24,
                          },
                        },
                      })
                    }
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Font Weight</label>
                  <select
                    value={selectedText.style.fontWeight}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TEXT_ELEMENT",
                        sceneId: selectedScene.id,
                        elementId: selectedText.id,
                        updates: {
                          style: {
                            ...selectedText.style,
                            fontWeight: parseInt(e.target.value),
                          },
                        },
                      })
                    }
                    className="input-field text-sm"
                  >
                    {[300, 400, 500, 600, 700, 800].map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedText.style.color}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_TEXT_ELEMENT",
                          sceneId: selectedScene.id,
                          elementId: selectedText.id,
                          updates: {
                            style: { ...selectedText.style, color: e.target.value },
                          },
                        })
                      }
                      className="w-8 h-8 rounded border border-[#e5e5e5] cursor-pointer"
                    />
                    <span className="text-xs font-mono text-[#6b7280]">
                      {selectedText.style.color}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Align</label>
                  <select
                    value={selectedText.style.textAlign}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TEXT_ELEMENT",
                        sceneId: selectedScene.id,
                        elementId: selectedText.id,
                        updates: {
                          style: {
                            ...selectedText.style,
                            textAlign: e.target.value as "left" | "center" | "right",
                          },
                        },
                      })
                    }
                    className="input-field text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Position X (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selectedText.position.x}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TEXT_ELEMENT",
                        sceneId: selectedScene.id,
                        elementId: selectedText.id,
                        updates: {
                          position: { ...selectedText.position, x: parseFloat(e.target.value) || 0 },
                        },
                      })
                    }
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Position Y (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selectedText.position.y}
                    onChange={(e) =>
                      dispatch({
                        type: "UPDATE_TEXT_ELEMENT",
                        sceneId: selectedScene.id,
                        elementId: selectedText.id,
                        updates: {
                          position: { ...selectedText.position, y: parseFloat(e.target.value) || 0 },
                        },
                      })
                    }
                    className="input-field text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Animation</label>
                <select
                  value={selectedText.animation}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TEXT_ELEMENT",
                      sceneId: selectedScene.id,
                      elementId: selectedText.id,
                      updates: { animation: e.target.value as AnimationType },
                    })
                  }
                  className="input-field text-sm"
                >
                  {ANIMATION_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: "DELETE_TEXT_ELEMENT",
                    sceneId: selectedScene.id,
                    elementId: selectedText.id,
                  })
                }
                className="btn-danger text-xs w-full"
              >
                Delete Text Element
              </button>
            </div>
          </section>
        )}

        {/* Selected Media Element Properties */}
        {selectedMedia && (
          <section>
            <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
              Media Element
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Name</label>
                <input
                  type="text"
                  value={selectedMedia.name}
                  readOnly
                  className="input-field text-sm opacity-60"
                />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={selectedMedia.opacity}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_MEDIA_ELEMENT",
                      sceneId: selectedScene.id,
                      elementId: selectedMedia.id,
                      updates: { opacity: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-[#40d99d]"
                />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Fit</label>
                <select
                  value={selectedMedia.fit}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_MEDIA_ELEMENT",
                      sceneId: selectedScene.id,
                      elementId: selectedMedia.id,
                      updates: { fit: e.target.value as "cover" | "contain" | "fill" },
                    })
                  }
                  className="input-field text-sm"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
              </div>
              <button
                onClick={() =>
                  dispatch({
                    type: "DELETE_MEDIA_ELEMENT",
                    sceneId: selectedScene.id,
                    elementId: selectedMedia.id,
                  })
                }
                className="btn-danger text-xs w-full"
              >
                Delete Media Element
              </button>
            </div>
          </section>
        )}

        {/* Element list for current scene */}
        {!selectedText && !selectedMedia && (
          <section>
            <h3 className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-3">
              Elements in Scene
            </h3>
            {selectedScene.textElements.length === 0 &&
             selectedScene.mediaElements.length === 0 ? (
              <p className="text-xs text-[#6b7280]">
                No elements yet. Use the toolbar to add text or media.
              </p>
            ) : (
              <div className="space-y-1">
                {selectedScene.textElements.map((el) => (
                  <button
                    key={el.id}
                    onClick={() =>
                      dispatch({
                        type: "SELECT_ELEMENT",
                        elementId: el.id,
                        elementType: "text",
                      })
                    }
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f0f0f0]/50 text-sm transition-colors duration-200 flex items-center gap-2 text-[#1a1a1a]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" y1="20" x2="15" y2="20" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    <span className="truncate">{el.text || "Empty text"}</span>
                    <span className="text-[10px] text-[#6b7280] ml-auto">{el.type}</span>
                  </button>
                ))}
                {selectedScene.mediaElements.map((el) => (
                  <button
                    key={el.id}
                    onClick={() =>
                      dispatch({
                        type: "SELECT_ELEMENT",
                        elementId: el.id,
                        elementType: "media",
                      })
                    }
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#f0f0f0]/50 text-sm transition-colors duration-200 flex items-center gap-2 text-[#1a1a1a]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="truncate">{el.name}</span>
                    <span className="text-[10px] text-[#6b7280] ml-auto">{el.type}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
