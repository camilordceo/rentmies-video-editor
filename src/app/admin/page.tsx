"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface UserRow {
  id: string;
  email: string;
  nombre: string | null;
  rol: "admin" | "empresa" | "agente" | "user";
  empresa_id: string | null;
  plan: string;
  credits_remaining: number;
  activo: boolean;
  created_at: string;
  subscription?: {
    renders_used: number;
    renders_limit: number;
    plan: string;
    status: string;
  } | null;
}

interface RenderRow {
  id: string;
  status: string;
  composition_id: string;
  created_at: string;
  user_id: string;
}

interface LogRow {
  id: string;
  level: string;
  source: string;
  message: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalRenders: number;
  rendersQueued: number;
  rendersCompleted: number;
  rendersFailed: number;
  activeSubscriptions: number;
}

export default function AdminPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [renders, setRenders] = useState<RenderRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "renders" | "logs">("overview");
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [makingAdmin, setMakingAdmin] = useState<string | null>(null);

  // Guard: solo admin
  useEffect(() => {
    if (!isLoading && (!user || profile?.rol !== "admin")) {
      router.replace("/");
    }
  }, [user, profile, isLoading, router]);

  useEffect(() => {
    if (!user || profile?.rol !== "admin") return;
    loadAllData();
  }, [user, profile]);

  async function loadAllData() {
    setLoadingData(true);
    await Promise.all([loadStats(), loadUsers(), loadRenders(), loadLogs()]);
    setLoadingData(false);
  }

  async function loadStats() {
    const [
      { count: totalUsers },
      { count: totalRenders },
      { count: rendersQueued },
      { count: rendersCompleted },
      { count: rendersFailed },
      { count: activeSubscriptions },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("video_renders").select("*", { count: "exact", head: true }),
      supabase.from("video_renders").select("*", { count: "exact", head: true }).eq("status", "queued"),
      supabase.from("video_renders").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("video_renders").select("*", { count: "exact", head: true }).eq("status", "failed"),
      supabase.from("video_editor_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
    ]);

    setStats({
      totalUsers: totalUsers ?? 0,
      totalRenders: totalRenders ?? 0,
      rendersQueued: rendersQueued ?? 0,
      rendersCompleted: rendersCompleted ?? 0,
      rendersFailed: rendersFailed ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
    });
  }

  async function loadUsers() {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!profilesData) return;

    const { data: subsData } = await supabase
      .from("video_editor_subscriptions")
      .select("user_id, renders_used, renders_limit, plan, status");

    const subsMap = new Map(subsData?.map((s) => [s.user_id, s]) ?? []);

    setUsers(
      profilesData.map((p) => ({
        ...p,
        subscription: subsMap.get(p.id) ?? null,
      }))
    );
  }

  async function loadRenders() {
    const { data } = await supabase
      .from("video_renders")
      .select("id, status, composition_id, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(50);
    setRenders(data ?? []);
  }

  async function loadLogs() {
    const { data } = await supabase
      .from("admin_logs")
      .select("id, level, source, message, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs(data ?? []);
  }

  async function handleToggleActivo(userId: string, current: boolean) {
    setTogglingUser(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ activo: !current })
      .eq("id", userId);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, activo: !current } : u))
      );
    }
    setTogglingUser(null);
  }

  async function handleMakeAdmin(userId: string) {
    if (!confirm("¿Hacer admin a este usuario? Tendrá acceso total.")) return;
    setMakingAdmin(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ rol: "admin", plan: "enterprise", credits_remaining: 999999 })
      .eq("id", userId);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, rol: "admin", plan: "enterprise", credits_remaining: 999999 } : u
        )
      );
    }
    setMakingAdmin(null);
  }

  if (isLoading || (user && profile?.rol !== "admin")) {
    return (
      <div className="min-h-screen bg-[#1a2035] flex items-center justify-center">
        <div className="text-[#40d99d] text-sm">Cargando...</div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "users" as const, label: `Usuarios (${stats?.totalUsers ?? 0})` },
    { id: "renders" as const, label: `Renders (${stats?.totalRenders ?? 0})` },
    { id: "logs" as const, label: "Logs" },
  ];

  const statusColor: Record<string, string> = {
    queued: "text-amber-400 bg-amber-400/10",
    rendering: "text-blue-400 bg-blue-400/10",
    completed: "text-[#40d99d] bg-[#40d99d]/10",
    failed: "text-red-400 bg-red-400/10",
    active: "text-[#40d99d] bg-[#40d99d]/10",
    cancelled: "text-red-400 bg-red-400/10",
  };

  const levelColor: Record<string, string> = {
    info: "text-[#40d99d]",
    warn: "text-amber-400",
    error: "text-red-400",
  };

  return (
    <div className="min-h-screen bg-[#1a2035] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#40d99d] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a2035" strokeWidth="2.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Rentmies Admin</h1>
            <p className="text-xs text-white/40">Video Editor Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40">{profile?.email}</span>
          <a
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors"
          >
            ← Volver al editor
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#40d99d] text-[#1a2035]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white/40 text-sm">Cargando datos...</div>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Usuarios", value: stats.totalUsers, accent: false },
                    { label: "Suscripciones activas", value: stats.activeSubscriptions, accent: true },
                    { label: "Renders totales", value: stats.totalRenders, accent: false },
                    { label: "En cola", value: stats.rendersQueued, accent: false },
                    { label: "Completados", value: stats.rendersCompleted, accent: true },
                    { label: "Fallidos", value: stats.rendersFailed, accent: false },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    >
                      <p className="text-xs text-white/40 mb-1">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.accent ? "text-[#40d99d]" : "text-white"}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Renders recientes en overview */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white/80 mb-4">Renders recientes</h2>
                  <div className="space-y-2">
                    {renders.slice(0, 10).map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                        <span className="font-mono text-white/40 w-20 truncate">{r.id.slice(0, 8)}…</span>
                        <span className="text-white/60">{r.composition_id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[r.status] ?? "text-white/40"}`}>
                          {r.status}
                        </span>
                        <span className="text-white/30">{new Date(r.created_at).toLocaleDateString("es-CO")}</span>
                      </div>
                    ))}
                    {renders.length === 0 && (
                      <p className="text-white/30 text-xs text-center py-4">Sin renders aún</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["Email", "Nombre", "Rol", "Plan", "Créditos", "Renders", "Activo", "Acciones"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white/80 text-xs max-w-[180px] truncate">{u.email}</td>
                          <td className="px-4 py-3 text-white/60 text-xs">{u.nombre ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              u.rol === "admin"
                                ? "bg-[#4fffb4]/10 text-[#4fffb4]"
                                : "bg-white/10 text-white/50"
                            }`}>
                              {u.rol}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">{u.plan}</td>
                          <td className="px-4 py-3 text-white/50 text-xs">
                            {u.credits_remaining >= 999999 ? "∞" : u.credits_remaining}
                          </td>
                          <td className="px-4 py-3 text-white/50 text-xs">
                            {u.subscription
                              ? `${u.subscription.renders_used} / ${u.subscription.renders_limit >= 999999 ? "∞" : u.subscription.renders_limit}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleActivo(u.id, u.activo)}
                              disabled={togglingUser === u.id}
                              className={`w-10 h-5 rounded-full transition-colors relative ${
                                u.activo ? "bg-[#40d99d]" : "bg-white/20"
                              } disabled:opacity-50`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                u.activo ? "translate-x-5" : "translate-x-0.5"
                              }`} />
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {u.rol !== "admin" && (
                              <button
                                onClick={() => handleMakeAdmin(u.id)}
                                disabled={makingAdmin === u.id}
                                className="text-xs text-[#40d99d] hover:text-[#4fffb4] disabled:opacity-50 transition-colors"
                              >
                                {makingAdmin === u.id ? "..." : "Hacer Admin"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-white/30 text-xs">
                            Sin usuarios
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RENDERS */}
            {activeTab === "renders" && (
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["ID", "Composición", "Estado", "User ID", "Fecha"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {renders.map((r) => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-mono text-white/40 text-xs">{r.id.slice(0, 8)}…</td>
                          <td className="px-4 py-3 text-white/70 text-xs">{r.composition_id}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status] ?? "text-white/40 bg-white/5"}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-white/30 text-xs">{r.user_id.slice(0, 8)}…</td>
                          <td className="px-4 py-3 text-white/40 text-xs">
                            {new Date(r.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                        </tr>
                      ))}
                      {renders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-white/30 text-xs">
                            Sin renders
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* LOGS */}
            {activeTab === "logs" && (
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {["Nivel", "Fuente", "Mensaje", "Fecha"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((l) => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`text-xs font-mono font-medium ${levelColor[l.level] ?? "text-white/40"}`}>
                              {l.level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs font-mono">{l.source}</td>
                          <td className="px-4 py-3 text-white/70 text-xs max-w-[400px] truncate">{l.message}</td>
                          <td className="px-4 py-3 text-white/30 text-xs">
                            {new Date(l.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-white/30 text-xs">
                            Sin logs
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
