"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType | undefined>(
  undefined
);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a Dialog");
  }
  return context;
}

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

function DialogTrigger({ children }: DialogTriggerProps) {
  const { onOpenChange } = useDialog();

  return (
    <span onClick={() => onOpenChange(true)} className="cursor-pointer">
      {children}
    </span>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

function DialogContent({ children, className }: DialogContentProps) {
  const { open, onOpenChange } = useDialog();

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "w-full max-w-lg p-6",
              "bg-card rounded-2xl",
              "border border-white/10",
              "shadow-2xl shadow-black/50",
              className
            )}
          >
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "absolute right-4 top-4",
                "p-2 rounded-lg",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-white/10",
                "transition-colors"
              )}
            >
              <X className="h-4 w-4" />
            </button>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-xl font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
