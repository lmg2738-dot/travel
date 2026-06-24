import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "gold";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--navy)] text-white shadow-md hover:bg-[var(--navy-soft)] hover:shadow-lg focus:ring-[var(--accent)] disabled:bg-slate-400",
  gold:
    "bg-gradient-to-r from-[#b8956a] via-[#c9a227] to-[#b8956a] text-[var(--navy)] font-semibold shadow-[var(--shadow-gold)] hover:brightness-105 focus:ring-[var(--accent)] disabled:opacity-50",
  secondary:
    "bg-[var(--navy-soft)] text-white hover:bg-[var(--navy)] focus:ring-slate-500",
  outline:
    "border border-[var(--border-strong)] bg-white/80 text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--background)] focus:ring-[var(--accent)]",
  ghost:
    "text-[var(--muted)] hover:bg-black/[0.04] hover:text-[var(--foreground)] focus:ring-[var(--accent)]",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
