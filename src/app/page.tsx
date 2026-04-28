"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Project, AspectRatio } from "@/lib/types";
import TemplateSelector from "@/components/TemplateSelector";
import { TEMPLATES } from "@/lib/templates";
import { formatTime } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { getDisplayName } from "@/lib/auth-utils";
import { signOut } from "@/lib/supabase-auth";
import CreditsBadge from "@/components/CreditsBadge";

function createBlankProject(name: string, aspectRatio: AspectRatio): Project {
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

function VideoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function SparklesIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectRatio, setNewProjectRatio] = useState<AspectRatio>("16:9");
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    // Esperar a que AuthProvider termine; si no hay user, no fetch
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/projects")
      .then(async (r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((data) => { if (Array.isArray(data)) setProjects(data); })
      .catch((err) => console.error("Error cargando proyectos:", err))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function handleCreateProject() {
    if (!newProjectName.trim()) {
      setCreateError("El nombre es requerido");
      return;
    }
    setCreatingProject(true);
    setCreateError(null);
    const blank = createBlankProject(newProjectName.trim(), newProjectRatio);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: blank.name,
          aspect_ratio: blank.aspectRatio,
          fps: blank.fps,
          scenes: blank.scenes,
        }),
      });
      const saved = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error("Sesión expirada — recarga la página");
        throw new Error(saved.error || `Error ${res.status}`);
      }
      if (!saved?.id) throw new Error("Respuesta inválida del servidor");
      setShowNewProject(false);
      setNewProjectName("");
      window.location.href = `/editor?projectId=${saved.id}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("handleCreateProject:", msg);
      setCreateError(msg);
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleSelectTemplate(templateId: string) {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setCreatingProject(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} Project`,
          description: template.description,
          aspect_ratio: template.aspectRatio,
          fps: template.fps,
          scenes: template.scenes,
          template_id: template.id,
        }),
      });
      const saved = await res.json();
      if (!res.ok) {
        if (res.status === 401) throw new Error("Sesión expirada — recarga la página");
        throw new Error(saved.error || `Error ${res.status}`);
      }
      if (!saved?.id) throw new Error("Respuesta inválida del servidor");
      setShowTemplates(false);
      window.location.href = `/editor?projectId=${saved.id}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("handleSelectTemplate:", msg);
      setCreateError(msg);
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm("¿Eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error eliminando proyecto");
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = "/auth";
    } catch {
      setSigningOut(false);
    }
  }

  const totalDurationSeconds = (p: Project) =>
    p.scenes.reduce((acc, s) => acc + s.durationFrames, 0) / p.fps;

  const stats = [
    { label: "PROYECTOS TOTALES", value: projects.length },
    { label: "EN BORRADOR", value: projects.filter((p) => p.status === "draft").length },
    { label: "COMPLETADOS", value: projects.filter((p) => p.status === "completed").length },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Bar */}
      <header className="bg-surface/80 backdrop-blur-xl sticky top-0 z-40 h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center text-white">
              <VideoIcon size={16} />
            </div>
            <div>
              <p className="eyebrow leading-none">Rentmies</p>
              <p className="text-sm font-semibold text-on-surface leading-tight">Video Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile && (
              <span className="text-sm text-muted mr-2">{getDisplayName(profile)}</span>
            )}
            <CreditsBadge />
            <button
              onClick={() => setShowTemplates(true)}
              className="btn-secondary text-sm px-4 py-2"
            >
              Templates
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn-primary text-sm px-4 py-2 gap-1.5"
            >
              <PlusIcon size={14} />
              Nuevo proyecto
            </button>
            {user && (
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="btn-ghost text-sm px-3 py-2 text-muted disabled:opacity-50"
              >
                {signingOut ? "Saliendo..." : "Salir"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Eyebrow + Title */}
        <div className="mb-10">
          <p className="eyebrow mb-2">CONTENT STUDIO</p>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            Tus proyectos de video
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 max-w-lg">
            Crea, edita y exporta videos con IA para tus propiedades en Bogotá, Medellín y Cali.
          </p>
        </div>

        {/* AI Insight block */}
        <div className="ai-insight mb-8 flex items-start gap-3">
          <span className="text-brand-teal mt-0.5 shrink-0"><SparklesIcon size={14} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal mb-1">
              EMA INSIGHT
            </p>
            <p className="text-[13px] text-on-surface-variant leading-relaxed italic">
              Los videos de propiedades con subtítulos generados por IA tienen un 34% más de retención.
              Usa Auto-Caption en tu próximo proyecto.
            </p>
          </div>
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="card">
              <p className="metric-label mb-2">{s.label}</p>
              <p className="metric-value">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Projects section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-on-surface">Proyectos recientes</h2>
        </div>

        {loading ? (
          <div className="card p-16 text-center">
            <p className="text-muted text-sm">Cargando proyectos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container mx-auto mb-4 flex items-center justify-center text-muted">
              <VideoIcon size={28} />
            </div>
            <h3 className="text-lg font-semibold text-on-surface mb-2">Sin proyectos todavía</h3>
            <p className="text-muted text-sm mb-8 max-w-sm mx-auto leading-relaxed">
              Crea tu primer video desde cero o elige una plantilla optimizada para propiedades inmobiliarias.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setShowTemplates(true)} className="btn-secondary text-sm">
                Ver Templates
              </button>
              <button onClick={() => setShowNewProject(true)} className="btn-primary text-sm gap-1.5">
                <PlusIcon size={14} />
                Crear proyecto
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card cursor-pointer hover:shadow-glow-subtle hover:ring-1 hover:ring-brand-teal/20 transition-all duration-200 group"
                onClick={() => (window.location.href = `/editor?projectId=${project.id}`)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-surface-container rounded-lg mb-4 flex items-center justify-center text-muted/30">
                  <VideoIcon size={36} />
                </div>

                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-on-surface text-sm group-hover:text-brand-teal transition-colors duration-200 leading-snug">
                    {project.name}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ml-2 ${
                    project.status === "completed"
                      ? "bg-brand-teal/10 text-authority-green"
                      : project.status === "rendering"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-surface-container text-muted"
                  }`}>
                    {project.status}
                  </span>
                </div>

                <p className="text-[11px] text-muted mb-4">
                  {project.aspectRatio} · {project.scenes.length} escena{project.scenes.length !== 1 ? "s" : ""} · {formatTime(totalDurationSeconds(project))}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    {new Date(project.updatedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                    disabled={deletingId === project.id}
                    className="text-[11px] text-muted hover:text-red-500 transition-colors duration-200 disabled:opacity-50"
                  >
                    {deletingId === project.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal — Nuevo Proyecto */}
      {showNewProject && (
        <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md animate-fade-in"
               style={{ boxShadow: "var(--shadow-float)" }}>
            <h2 className="text-lg font-semibold text-on-surface mb-1">Nuevo proyecto</h2>
            <p className="text-sm text-muted mb-6">Define el nombre y formato de tu video.</p>

            <div className="space-y-5">
              <div>
                <label className="input-label">Nombre del proyecto</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ej: Apartamento Chapinero 85m²"
                  className="input-field"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                />
              </div>

              <div>
                <label className="input-label">Formato</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["16:9", "9:16", "1:1", "4:5"] as AspectRatio[]).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setNewProjectRatio(ratio)}
                      className={`p-3 rounded-lg text-center text-sm font-medium transition-all duration-200 ${
                        newProjectRatio === ratio
                          ? "bg-brand-teal/10 text-authority-green ring-1 ring-brand-teal/30"
                          : "bg-surface-container text-muted hover:bg-surface-container-high"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {createError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createError}</p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => { setShowNewProject(false); setCreateError(null); }}
                  disabled={creatingProject}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={creatingProject || !newProjectName.trim()}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                >
                  {creatingProject ? "Creando..." : "Crear proyecto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Templates */}
      {showTemplates && (
        <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto animate-fade-in"
               style={{ boxShadow: "var(--shadow-float)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="eyebrow mb-1">PLANTILLAS</p>
                <h2 className="text-lg font-semibold text-on-surface">Elige un template</h2>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="btn-ghost p-2 text-muted"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {createError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{createError}</p>
            )}
            <TemplateSelector onSelect={handleSelectTemplate} />
          </div>
        </div>
      )}
    </div>
  );
}
