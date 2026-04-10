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
        brand: {
          teal: "#40d99d",
          mint: "#4fffb4",
          black: "#1a1a1a",
        },
        editor: {
          bg: "#ffffff",
          surface: "#f8f8f8",
          panel: "#ffffff",
          border: "#e5e5e5",
          accent: "#40d99d",
          "accent-hover": "#4fffb4",
          text: "#1a1a1a",
          "text-muted": "#6b7280",
          success: "#40d99d",
          warning: "#f59e0b",
          danger: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
