"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Project, AspectRatio } from "@/lib/types";
import TemplateSelector from "@/components/TemplateSelector";
import { TEMPLATES } from "@/lib/templates";
import { formatTime } from "@/lib/utils";

function createBlankProject(
  name: string,
  aspectRatio: AspectRatio
): Project {
  return {
    id: uuidv4(),
    name,
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aspectRatio,
    fps: 30,
    scenes: [
      {
        id: uuidv4(),
        name: "Scene 1",
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
      },
    ],
    templateId: null,
    status: "draft",
    outputUrl: null,
  };
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectRatio, setNewProjectRatio] = useState<AspectRatio>("16:9");

  function handleCreateProject() {
    if (!newProjectName.trim()) return;
    const project = createBlankProject(newProjectName.trim(), newProjectRatio);
    setProjects((prev) => [project, ...prev]);
    setShowNewProject(false);
    setNewProjectName("");
    window.location.href = `/editor?projectId=${project.id}&data=${encodeURIComponent(JSON.stringify(project))}`;
  }

  function handleSelectTemplate(templateId: string) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const project: Project = {
      id: uuidv4(),
      name: `${template.name} Project`,
      description: template.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aspectRatio: template.aspectRatio,
      fps: template.fps,
      scenes: template.scenes,
      templateId: template.id,
      status: "draft",
      outputUrl: null,
    };
    setProjects((prev) => [project, ...prev]);
    setShowTemplates(false);
    window.location.href = `/editor?projectId=${project.id}&data=${encodeURIComponent(JSON.stringify(project))}`;
  }

  function handleDeleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const totalDurationSeconds = (p: Project) =>
    p.scenes.reduce((acc, s) => acc + s.durationFrames, 0) / p.fps;

  return (
    <div className="min-h-screen bg-editor-bg">
      {/* Header */}
      <header className="border-b border-editor-border bg-editor-surface/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-editor-accent flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-editor-text">Rentmies Video Editor</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="btn-secondary text-sm"
            >
              Browse Templates
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn-primary text-sm"
            >
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Total Projects", value: projects.length.toString() },
            { label: "Draft", value: projects.filter((p) => p.status === "draft").length.toString() },
            { label: "Completed", value: projects.filter((p) => p.status === "completed").length.toString() },
          ].map((stat) => (
            <div key={stat.label} className="panel p-5">
              <p className="text-editor-text-muted text-sm">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Projects List */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Projects</h2>
        </div>

        {projects.length === 0 ? (
          <div className="panel p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-editor-panel mx-auto mb-4 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-editor-text-muted">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-editor-text-muted mb-6 max-w-md mx-auto">
              Create your first video project from scratch or start with a pre-built template
              for YouTube Shorts, standard videos, or marketing content.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowTemplates(true)} className="btn-secondary">
                Browse Templates
              </button>
              <button onClick={() => setShowNewProject(true)} className="btn-primary">
                Create Blank Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="panel p-5 hover:border-editor-accent/50 transition-colors cursor-pointer group"
                onClick={() =>
                  (window.location.href = `/editor?projectId=${project.id}&data=${encodeURIComponent(JSON.stringify(project))}`)
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold group-hover:text-editor-accent transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-editor-text-muted mt-1">
                      {project.aspectRatio} &middot; {project.scenes.length} scene
                      {project.scenes.length !== 1 ? "s" : ""} &middot;{" "}
                      {formatTime(totalDurationSeconds(project))}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      project.status === "completed"
                        ? "bg-editor-success/20 text-editor-success"
                        : project.status === "rendering"
                        ? "bg-editor-warning/20 text-editor-warning"
                        : "bg-editor-panel text-editor-text-muted"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="aspect-video bg-editor-bg rounded-lg mb-3 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-editor-border">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-editor-text-muted">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="text-xs text-editor-text-muted hover:text-editor-danger transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel p-6 w-full max-w-md fade-in">
            <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-editor-text-muted mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome Video"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                />
              </div>
              <div>
                <label className="block text-sm text-editor-text-muted mb-1.5">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["16:9", "9:16", "1:1", "4:5"] as AspectRatio[]).map(
                    (ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setNewProjectRatio(ratio)}
                        className={`p-3 rounded-lg border text-center text-sm font-medium transition-colors ${
                          newProjectRatio === ratio
                            ? "border-editor-accent bg-editor-accent/10 text-editor-accent"
                            : "border-editor-border hover:border-editor-text-muted"
                        }`}
                      >
                        {ratio}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button onClick={handleCreateProject} className="btn-primary text-sm">
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Choose a Template</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-editor-text-muted hover:text-editor-text transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <TemplateSelector onSelect={handleSelectTemplate} />
          </div>
        </div>
      )}
    </div>
  );
}
