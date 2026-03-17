import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary: [
    "w-full rounded-2xl border-none bg-gradient-to-br from-[var(--amber)] to-[#e8941a]",
    "font-[var(--font-sans)] font-semibold text-[#0d0d14]",
    "transition-all duration-150",
    "hover:not-disabled:-translate-y-px hover:not-disabled:opacity-90",
    "active:not-disabled:translate-y-0",
    "disabled:cursor-not-allowed disabled:opacity-40",
  ].join(" "),
  ghost: [
    "rounded-xl border border-white/10 bg-white/6",
    "font-[var(--font-sans)] font-semibold text-white",
    "transition-colors duration-150",
    "hover:border-[var(--amber)]/30 hover:bg-white/10",
  ].join(" "),
  icon: [
    "flex items-center justify-center rounded-xl border-2 border-white/10",
    "bg-[#1a1a2e] text-white/60",
    "transition-all duration-200",
    "hover:rotate-180 hover:border-[var(--amber)]/40 hover:text-[var(--amber)]",
  ].join(" "),
} as const;

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-4 py-4 text-base",
} as const;

const iconSizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Renders child as the clickable element via Radix Slot */
  asChild?: boolean;
  /** Visual variant */
  variant?: "primary" | "ghost" | "icon";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and disables the button */
  loading?: boolean;
}

/**
 * Reusable button primitive with variant and size support.
 * Accepts all native button attributes and merges className via cn().
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      type,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/40",
          variantClasses[variant],
          variant === "icon" ? iconSizeClasses[size] : sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps };
