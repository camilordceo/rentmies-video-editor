"use client";

import React from "react";
import { v4 as uuidv4 } from "uuid";
import { useEditor } from "@/lib/store";
import SceneCard from "./SceneCard";
import type { Scene } from "@/lib/types";

export default function Timeline() {
  const { state, dispatch } = useEditor();
  const { project, selectedSceneId } = state;

  function handleAddScene() {
    const newScene: Scene = {
      id: uuidv4(),
      name: `Scene ${project.scenes.length + 1}`,
      durationFrames: 150,
      backgroundColor: "#000000",
      mediaElements: [],
      textElements: [],
      captions: [],
      captionStyle: {
        fontFamily: "Inter",
        fontSize: 48,
        fontWeight: 700,
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.6)",
        position: "bottom",
        maxWidth: 80,
        animation: "fade",
      },
      transition: "none",
      transitionDurationFrames: 0,
    };
    dispatch({ type: "ADD_SCENE", scene: newScene });
  }

  function handleDeleteScene(sceneId: string) {
    if (project.scenes.length <= 1) return;
    dispatch({ type: "DELETE_SCENE", sceneId });
  }

  function handleMoveScene(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= project.scenes.length) return;
    const ids = project.scenes.map((s) => s.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    dispatch({ type: "REORDER_SCENES", sceneIds: ids });
  }

  return (
    <div className="h-full flex flex-col bg-editor-surface border-r border-editor-border">
      <div className="panel-header flex items-center justify-between">
        <span>Scenes</span>
        <button
          onClick={handleAddScene}
          className="text-editor-accent hover:text-editor-accent-hover transition-colors"
          title="Add scene"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {project.scenes.map((scene, index) => (
          <div key={scene.id} className="relative">
            {/* Reorder buttons */}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-0.5 opacity-0 hover:opacity-100 transition-opacity">
              {index > 0 && (
                <button
                  onClick={() => handleMoveScene(index, "up")}
                  className="p-0.5 text-editor-text-muted hover:text-editor-text"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8l-6 6h12z" />
                  </svg>
                </button>
              )}
              {index < project.scenes.length - 1 && (
                <button
                  onClick={() => handleMoveScene(index, "down")}
                  className="p-0.5 text-editor-text-muted hover:text-editor-text"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 16l6-6H6z" />
                  </svg>
                </button>
              )}
            </div>

            <SceneCard
              scene={scene}
              index={index}
              isSelected={selectedSceneId === scene.id}
              fps={project.fps}
              onSelect={() => dispatch({ type: "SELECT_SCENE", sceneId: scene.id })}
              onDelete={() => handleDeleteScene(scene.id)}
            />
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-editor-border">
        <button
          onClick={handleAddScene}
          className="w-full py-2 border border-dashed border-editor-border rounded-lg text-sm text-editor-text-muted hover:border-editor-accent hover:text-editor-accent transition-colors"
        >
          + Add Scene
        </button>
      </div>
    </div>
  );
}
