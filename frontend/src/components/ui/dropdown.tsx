"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropdownContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(
  undefined
);

function useDropdown() {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdown must be used within a Dropdown");
  }
  return context;
}

interface DropdownProps {
  children: React.ReactNode;
}

function Dropdown({ children }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

interface DropdownTriggerProps {
  children: React.ReactNode;
  showChevron?: boolean;
  className?: string;
}

function DropdownTrigger({ children, showChevron = true, className }: DropdownTriggerProps) {
  const { open, setOpen } = useDropdown();

  return (
    <button
      onClick={() => setOpen(!open)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl",
        "bg-white/5 border border-white/10",
        "text-foreground",
        "hover:bg-white/10",
        "transition-colors",
        className
      )}
    >
      {children}
      {showChevron && (
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      )}
    </button>
  );
}

interface DropdownContentProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

function DropdownContent({ children, align = "start", className }: DropdownContentProps) {
  const { open } = useDropdown();

  const alignStyles = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "absolute top-full mt-2 z-50 min-w-[180px]",
            "bg-card/95 backdrop-blur-sm",
            "border border-white/10 rounded-xl",
            "shadow-xl shadow-black/20",
            "py-1",
            alignStyles[align],
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  destructive?: boolean;
  className?: string;
  onClick?: () => void;
}

function DropdownItem({ children, icon, destructive = false, className, onClick }: DropdownItemProps) {
  const { setOpen } = useDropdown();

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 text-left",
        "text-sm",
        destructive
          ? "text-red-400 hover:bg-red-500/10"
          : "text-foreground hover:bg-white/10",
        "transition-colors",
        className
      )}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {children}
    </button>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return (
    <div className={cn("h-px my-1 bg-white/10", className)} />
  );
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
};
