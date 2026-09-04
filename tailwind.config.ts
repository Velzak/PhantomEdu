import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        void: "var(--bg-void)",
        surface: "var(--bg-surface)",
        "surface-2": "var(--bg-surface-2)",
        accent: "var(--accent-primary)",
        signal: "var(--accent-secondary)",
        ink: "var(--text-primary)",
        muted: "var(--text-muted)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        lift: "0 12px 28px -16px rgb(0 0 0 / 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
