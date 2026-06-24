import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "gold" | "muted";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "default" &&
          "bg-[var(--navy)]/5 text-[var(--navy)] ring-1 ring-[var(--navy)]/10",
        variant === "gold" &&
          "bg-[var(--accent)]/10 text-[var(--accent-dark)] ring-1 ring-[var(--accent)]/20",
        variant === "muted" &&
          "bg-black/[0.04] text-[var(--muted)]",
        className
      )}
    >
      {children}
    </span>
  );
}
