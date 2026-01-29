"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mb-8", className)}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {backHref && (
            <Link
              href={backHref}
              className={cn(
                "p-2 rounded-xl",
                "bg-white/5 border border-white/10",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-white/10",
                "transition-colors"
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </motion.div>
  );
}
