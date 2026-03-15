"use client";

import * as React from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import {
  CIPHER_MAP,
  getOrderedCipherEntries,
  type SymbolMap,
  tokenizeEncryptedPattern,
} from "@/lib/cipher";
import { cn } from "@/lib/utils";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { CipherTokenCell } from "./CipherTokenCell";

interface DecoderPanelProps {
  symbolMap?: SymbolMap;
  encryptedPattern?: string;
  isLoading?: boolean;
  className?: string;
}

export function DecoderPanel({
  symbolMap,
  encryptedPattern,
  isLoading = false,
  className,
}: DecoderPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)");
    setIsOpen(desktopMediaQuery.matches);
  }, []);

  const activeMap = React.useMemo(
    () =>
      symbolMap && Object.keys(symbolMap).length > 0 ? symbolMap : CIPHER_MAP,
    [symbolMap],
  );

  const highlightedTokens = React.useMemo(() => {
    if (!encryptedPattern) {
      return new Set<string>();
    }

    return new Set(
      tokenizeEncryptedPattern(encryptedPattern).filter((token) => token !== ""),
    );
  }, [encryptedPattern]);

  const orderedEntries = React.useMemo(
    () => getOrderedCipherEntries(activeMap),
    [activeMap],
  );

  return (
    <Card variant="glass" className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-300" />
              Cipher Key
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference the numeric token map while solving.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="decoder-panel-content"
            className="shrink-0"
          >
            {isOpen ? "Hide" : "Show"} Cipher Key
            <ChevronDown
              className={cn(
                "ml-2 h-4 w-4 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Tokens used in this puzzle are highlighted.
        </p>
      </CardHeader>

      {isOpen && (
        <CardContent id="decoder-panel-content" className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
              {orderedEntries.map(([token, value]) => {
                const isHighlighted = highlightedTokens.has(token);

                return (
                  <div
                    key={token}
                    className={cn(
                      "rounded-lg border border-white/10 bg-white/5 p-3 transition-colors",
                      isHighlighted &&
                        "border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_14px_rgba(34,211,238,0.12)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <CipherTokenCell
                        token={token}
                        className={cn(
                          "min-w-[2.4rem] px-2 py-1 text-xs md:min-w-[2.6rem]",
                          isHighlighted &&
                            "border-cyan-300/40 bg-cyan-500/15 text-cyan-100 shadow-none",
                        )}
                      />
                      <span className="font-mono text-lg font-semibold text-foreground">
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
