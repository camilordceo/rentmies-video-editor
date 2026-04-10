"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { EditorProvider, useEditor } from "@/lib/store";
import type { Project, TextElement, MediaElement, EditorTool } from "@/lib/types";
import VideoPreview from "@/components/VideoPreview";
import Timeline from "@/components/Timeline";
import PropertiesPanel from "@/components/PropertiesPanel";
import CaptionEditor from "@/components/CaptionEditor";
import ExportPanel from "@/components/ExportPanel";
import TemplateSelector from "@/components/TemplateSelector";
import { TEMPLATES } from "@/lib/templates";
import { uploadMediaToSupabase } from "@/lib/upload";

function createDefaultProject(): Project {
  return {
    id: uuidv4(),
    name: "Untitled Project",
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aspectRatio: "16:9",
    fps: 30,
    scenes: [
      {
        id: uuidv4(),
        name: "Scene 1",
        durationFrames: 150,
        backgroundColor: "#0f0f1a",
        mediaElements: [],
        textElements: [
          {
            id: uuidv4(),
            type: "title",
            text: "Your Title Here",
            position: { x: 50, y: 45 },
            size: { width: 80, height: 20 },
            style: {
              fontFamily: "Inter",
              fontSize: 72,
              fontWeight: 800,
              color: "#ffffff",
              backgroundColor: "transparent",
              textAlign: "center",
              lineHeight: 1.1,
              letterSpacing: -1,
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              borderRadius: 0,
              padding: 0,
            },
            startFrame: 0,
            durationFrames: 150,
            animation: "fade-in",
          },
        ],
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
      },
    ],
    templateId: null,
    status: "draft",
    outputUrl: null,
  };
}

function EditorContent() {
  const { state, dispatch } = useEditor();
  const [rightPanel, setRightPanel] = useState<"properties" | "captions" | "export" | "templates">("properties");

  // Auto-save to Supabase
  const projectId = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("projectId")
    : null;

  useEffect(() => {
    if (!projectId) return;
    const timer = setTimeout(() => {
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.project.name,
          scenes: state.project.scenes,
          status: state.project.status,
        }),
      }).catch(() => {});
    }, 3000);
    return () => clearTimeout(timer);
  }, [state.project.scenes, state.project.name, state.project.status, projectId]);

  const tools: { id: EditorTool; icon: React.ReactNode; label: string }[] = [
    {
      id: "select",
      label: "Select",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        </svg>
      ),
    },
    {
      id: "text",
      label: "Add Text",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
    },
    {
      id: "media",
      label: "Add Media",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      id: "caption",
      label: "Captions",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
    {
      id: "template",
      label: "Templates",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      id: "export",
      label: "Export",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
  ];

  function handleToolClick(toolId: EditorTool) {
    dispatch({ type: "SET_TOOL", tool: toolId });

    switch (toolId) {
      case "text":
        handleAddText();
        setRightPanel("properties");
        break;
      case "media":
        handleAddMedia();
        setRightPanel("properties");
        break;
      case "caption":
        setRightPanel("captions");
        break;
      case "export":
        setRightPanel("export");
        break;
      case "template":
        setRightPanel("templates");
        break;
      default:
        setRightPanel("properties");
        break;
    }
  }

  function handleAddText() {
    if (!state.selectedSceneId) return;
    const newText: TextElement = {
      id: uuidv4(),
      type: "custom",
      text: "New Text",
      position: { x: 50, y: 50 },
      size: { width: 60, height: 15 },
      style: {
        fontFamily: "Inter",
        fontSize: 48,
        fontWeight: 600,
        color: "#ffffff",
        backgroundColor: "transparent",
        textAlign: "center",
        lineHeight: 1.3,
        letterSpacing: 0,
        textShadow: "0 2px 10px rgba(0,0,0,0.3)",
        borderRadius: 0,
        padding: 0,
      },
      startFrame: 0,
      durationFrames: 150,
      animation: "fade-in",
    };
    dispatch({
      type: "ADD_TEXT_ELEMENT",
      sceneId: state.selectedSceneId,
      element: newText,
    });
    dispatch({
      type: "SELECT_ELEMENT",
      elementId: newText.id,
      elementType: "text",
    });
  }

  function handleAddMedia() {
    if (!state.selectedSceneId) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/mp4,video/webm,video/quicktime";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const mediaType = file.type.startsWith("video/") ? "video" : "image";

      // Upload to Supabase Storage
      let src: string;
      try {
        const { publicUrl } = await uploadMediaToSupabase(file);
        src = publicUrl;
      } catch {
        // Fallback to blob URL if upload fails
        src = URL.createObjectURL(file);
      }

      const newMedia: MediaElement = {
        id: uuidv4(),
        type: mediaType,
        src,
        name: file.name,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        startFrame: 0,
        durationFrames: 150,
        opacity: 1,
        fit: "cover",
        volume: mediaType === "video" ? 1 : undefined,
      };
      dispatch({
        type: "ADD_MEDIA_ELEMENT",
        sceneId: state.selectedSceneId!,
        element: newMedia,
      });
      dispatch({
        type: "SELECT_ELEMENT",
        elementId: newMedia.id,
        elementType: "media",
      });
    };
    input.click();
  }

  function handleSelectTemplate(templateId: string) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    dispatch({
      type: "SET_PROJECT",
      project: {
        ...state.project,
        aspectRatio: template.aspectRatio,
        fps: template.fps,
        scenes: template.scenes,
        templateId: template.id,
        updatedAt: new Date().toISOString(),
      },
    });
    setRightPanel("properties");
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white">
      {/* Top Toolbar */}
      <header className="h-14 bg-white border-b border-[#e5e5e5] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 text-[#6b7280] hover:text-[#1a1a1a] transition-colors duration-200"
          >
            <div className="w-7 h-7 rounded-lg bg-[#40d99d] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
          </a>
          <div className="h-6 w-px bg-[#e5e5e5]" />
          <input
            type="text"
            value={state.project.name}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_PROJECT_META",
                updates: { name: e.target.value },
              })
            }
            className="bg-transparent border-none text-sm font-medium text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#40d99d] rounded px-2 py-1"
          />
        </div>

        {/* Tool buttons */}
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`p-2 rounded-lg transition-all duration-200 relative group ${
                state.activeTool === tool.id
                  ? "bg-[#40d99d] text-white"
                  : "text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f0f0f0]/50"
              }`}
              title={tool.label}
            >
              {tool.icon}
              <span className="tooltip -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                {tool.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              state.project.status === "completed"
                ? "bg-[#40d99d]/10 text-[#40d99d]"
                : "bg-[#f0f0f0] text-[#6b7280]"
            }`}
          >
            {state.project.status}
          </span>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Timeline */}
        <div className="w-[260px] shrink-0">
          <Timeline />
        </div>

        {/* Center - Video Preview */}
        <div className="flex-1 min-w-0">
          <VideoPreview />
        </div>

        {/* Right Panel */}
        <div className="w-[300px] shrink-0">
          {rightPanel === "properties" && <PropertiesPanel />}
          {rightPanel === "captions" && <CaptionEditor />}
          {rightPanel === "export" && <ExportPanel />}
          {rightPanel === "templates" && (
            <div className="h-full bg-[#f8f8f8] border-l border-[#e5e5e5] flex flex-col overflow-hidden">
              <div className="panel-header">Templates</div>
              <div className="flex-1 overflow-y-auto p-4">
                <TemplateSelector onSelect={handleSelectTemplate} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditorPageInner() {
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const projectId = searchParams.get("projectId");
    const data = searchParams.get("data");

    if (projectId && !data) {
      // Load from Supabase
      fetch(`/api/projects/${projectId}`)
        .then((r) => r.json())
        .then((p) => {
          if (p && !p.error) {
            setProject(p as Project);
          } else {
            setProject(createDefaultProject());
          }
        })
        .catch(() => setProject(createDefaultProject()));
    } else if (data) {
      try {
        setProject(JSON.parse(decodeURIComponent(data)) as Project);
      } catch {
        setProject(createDefaultProject());
      }
    } else {
      setProject(createDefaultProject());
    }
  }, [searchParams]);

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center text-[#6b7280]">
        Loading project...
      </div>
    );
  }

  return (
    <EditorProvider initialProject={project}>
      <EditorContent />
    </EditorProvider>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-white flex items-center justify-center">
          <div className="text-[#6b7280] text-sm">Loading editor...</div>
        </div>
      }
    >
      <EditorPageInner />
    </Suspense>
  );
}
