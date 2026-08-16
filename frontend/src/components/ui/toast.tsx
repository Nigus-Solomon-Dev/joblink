"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/cn";

export type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (kind: ToastKind, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a <ToastProvider>");
  return context;
}

const icons: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success-600" />,
  error: <AlertCircle className="size-5 text-danger-600" />,
  info: <Info className="size-5 text-info-600" />,
};

const titleClasses: Record<ToastKind, string> = {
  success: "text-success-700",
  error: "text-danger-700",
  info: "text-info-700",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, kind, title, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-surface p-3 shadow-popover"
          >
            <span className="mt-0.5 shrink-0">{icons[item.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", titleClasses[item.kind])}>{item.title}</p>
              {item.message && (
                <p className="mt-0.5 text-sm text-slate-600">{item.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-slate-400 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}