"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, signUp } from "@/lib/supabase-auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
          router.push("/");
          router.refresh();
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          setError(error.message);
        } else {
          setSuccess("Account created! Check your email to confirm, then log in.");
          setMode("login");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-editor-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-editor-accent flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-editor-text">Rentmies ContentOS</h1>
          <p className="text-editor-text-muted mt-1 text-sm">AI-powered video editor for creators</p>
        </div>

        {/* Form Card */}
        <div className="panel p-6">
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-editor-bg rounded-lg p-1">
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-editor-accent text-white shadow-sm"
                  : "text-editor-text-muted hover:text-editor-text"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "signup"
                  ? "bg-editor-accent text-white shadow-sm"
                  : "text-editor-text-muted hover:text-editor-text"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-editor-danger/10 border border-editor-danger/20 text-editor-danger text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-editor-success/10 border border-editor-success/20 text-editor-success text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm text-editor-text-muted mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="input-field"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-editor-text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-editor-text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="input-field"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-editor-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-editor-surface px-2 text-editor-text-muted">or continue with</span>
            </div>
          </div>

          {/* Google OAuth placeholder */}
          <button
            type="button"
            className="btn-secondary w-full py-2.5 text-sm font-medium flex items-center justify-center gap-2"
            onClick={() => setError("Google OAuth coming soon")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
        </div>

        <p className="text-center text-xs text-editor-text-muted mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
