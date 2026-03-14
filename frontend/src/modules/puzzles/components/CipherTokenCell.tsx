import { cn } from "@/lib/utils";

interface CipherTokenCellProps {
  token: string;
  hidden?: boolean;
  className?: string;
  gapClassName?: string;
}

export function CipherTokenCell({
  token,
  hidden = false,
  className,
  gapClassName,
}: CipherTokenCellProps) {
  if (token === "") {
    return <span aria-hidden className={cn("w-3 md:w-4", gapClassName)} />;
  }

  return (
    <span
      className={cn(
        "inline-flex min-w-[2.25rem] items-center justify-center rounded-md border border-amber-400/25 bg-amber-500/10 px-2 py-1 font-mono text-sm font-semibold text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
        className
      )}
    >
      {hidden ? "?" : token}
    </span>
  );
}
