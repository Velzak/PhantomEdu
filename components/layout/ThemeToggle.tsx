"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/layout/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const label =
    theme === "dark" ? "Dark theme, switch to light" : theme === "light" ? "Light theme, switch to system" : "System theme, switch to dark";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(next)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-surface-2"
    >
      {theme === "light" ? <Sun size={18} /> : theme === "system" ? <Monitor size={18} /> : <Moon size={18} />}
    </button>
  );
}
