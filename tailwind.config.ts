import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand v2.0 "Editorial Concierge" ─────────────────────────
        "brand-teal": "#40d99d",
        "brand-mint": "#4fffb4",
        "authority-green": "#006c4a",

        // Surface system (tonal layering — No-Line philosophy)
        surface: "#fcf9f8",
        "surface-dim": "#dcd9d9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f3f2",
        "surface-container": "#f0eded",
        "surface-container-high": "#eae7e7",
        "surface-container-highest": "#e5e2e1",

        // Text & outline
        "on-surface": "#1c1b1b",
        "on-surface-variant": "#3c4a42",
        "outline-variant": "#bbcabf",
        muted: "#6b7280",

        // ── Legacy tokens (kept for backward-compat) ──────────────────
        brand: {
          teal: "#40d99d",
          mint: "#4fffb4",
          black: "#1a1a1a",
        },
        editor: {
          bg: "#fcf9f8",
          surface: "#f6f3f2",
          panel: "#ffffff",
          border: "#e5e5e5",
          accent: "#40d99d",
          "accent-hover": "#4fffb4",
          text: "#1c1b1b",
          "text-muted": "#6b7280",
          success: "#40d99d",
          warning: "#f59e0b",
          danger: "#dc2626",
        },
      },

      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      boxShadow: {
        // Editorial shadow system — NEVER use shadow-sm/md/lg
        editorial: "0 32px 64px -12px rgba(28,27,27,0.04)",
        "glow-active": "0 0 20px 2px rgba(64,217,157,0.4)",
        "glow-subtle": "0 0 12px 1px rgba(64,217,157,0.2)",
        float: "0 8px 32px -4px rgba(28,27,27,0.08)",
      },

      letterSpacing: {
        eyebrow: "0.15em",
      },

      animation: {
        "wave": "wave 1.2s ease-in-out infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },

      keyframes: {
        wave: {
          "0%, 100%": { height: "4px" },
          "50%": { height: "16px" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
