"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/layout/ToastProvider";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
