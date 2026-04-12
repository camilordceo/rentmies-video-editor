"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, signUp } from "@/lib/supabase-auth";

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  // Leer el parámetro ?next= para redirigir después del login
  const nextPath = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("next") ?? "/"
    : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          setError(error.message);
        } else {
          // Pequeño delay para que createBrowserClient escriba la cookie antes de navegar
          await new Promise((r) => setTimeout(r, 500));
          router.push(nextPath);
          router.refresh();
        }
      } else {
        const { error } = await signUp(email, password, nombre);
        if (error) {
          setError(error.message);
        } else {
          setSuccess("¡Cuenta creada! Revisa tu correo para confirmar, luego inicia sesión.");
          setMode("login");
        }
      }
    } catch {
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background tonal accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(64,217,157,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-teal flex items-center justify-center mx-auto mb-4 text-white"
               style={{ boxShadow: "var(--shadow-glow-subtle)" }}>
            <VideoIcon />
          </div>
          <p className="eyebrow mb-1">RENTMIES</p>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Video Editor</h1>
          <p className="text-muted text-sm mt-1">Crea videos de propiedades con IA</p>
        </div>

        {/* Card */}
        <div className="card p-6" style={{ boxShadow: "var(--shadow-float)" }}>
          {/* Tab switcher */}
          <div className="flex mb-6 bg-surface-container rounded-lg p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  mode === m
                    ? "bg-brand-teal text-white"
                    : "text-muted hover:text-on-surface"
                }`}
              >
                {m === "login" ? "Iniciar sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-brand-teal/10 text-authority-green text-sm flex items-start gap-2">
              <span className="mt-0.5 shrink-0"><SparklesIcon /></span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="input-label">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="input-field"
                />
              </div>
            )}
            <div>
              <label className="input-label">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="input-field"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="input-label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input-field"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === "login" ? "Entrando..." : "Creando cuenta..."}
                </span>
              ) : (
                mode === "login" ? "Iniciar sesión" : "Crear cuenta"
              )}
            </button>
          </form>
        </div>

        {/* AI insight */}
        <div className="ai-insight mt-6 flex items-start gap-3">
          <span className="text-brand-teal mt-0.5 shrink-0"><SparklesIcon /></span>
          <p className="text-[12px] text-on-surface-variant italic leading-relaxed">
            EMA genera subtítulos, planea guiones y optimiza tus videos de propiedades automáticamente.
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
        </p>
      </div>
    </div>
  );
}
