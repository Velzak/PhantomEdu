"use client";

import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ToastProvider } from "@/components/layout/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
