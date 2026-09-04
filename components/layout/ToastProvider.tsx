"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void };

type ToastContextValue = {
  push: (message: string, opts?: { actionLabel?: string; onAction?: () => void }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, opts?: { actionLabel?: string; onAction?: () => void }) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, ...opts }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 5200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-ink shadow-lift"
          >
            <p>{toast.message}</p>
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                className="mt-2 text-signal underline-offset-2 hover:underline"
                onClick={toast.onAction}
              >
                {toast.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
