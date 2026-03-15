"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function QueryError({
  message = "Failed to load data. Please try again.",
  onRetry,
}: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-10 text-center">
      <div className="rounded-full bg-red-500/10 p-3 text-red-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">
          Unable to load this section
        </h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
