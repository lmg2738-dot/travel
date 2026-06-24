import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ className, label, hint, error, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "input-premium h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white px-4 text-sm text-[var(--foreground)] transition-all placeholder:text-[var(--muted)]",
          error && "border-red-400 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-[var(--muted)]">{hint}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  className,
  label,
  hint,
  error,
  options,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, "-");

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "input-premium h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white px-4 text-sm text-[var(--foreground)] transition-all",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <p className="text-xs text-[var(--muted)]">{hint}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
