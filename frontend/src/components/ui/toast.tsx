"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: {
      icon: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
    error: {
      icon: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-500/10",
    },
    warning: {
      icon: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    info: {
      icon: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
    },
  };

  const Icon = icons[toast.type];
  const style = styles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl",
        "bg-card/95 backdrop-blur-sm",
        "border",
        style.border,
        "shadow-lg shadow-black/20",
        "min-w-[300px] max-w-[400px]"
      )}
    >
      <div className={cn("p-1 rounded-lg", style.bg)}>
        <Icon className={cn("h-5 w-5", style.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export { ToastContainer };
