import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary: [
    "w-full rounded-xl border-none bg-[var(--binance-yellow)]",
    "font-[var(--font-sans)] font-medium text-[#181a20]",
    "transition-opacity duration-150",
    "hover:not-disabled:opacity-90",
    "active:not-disabled:scale-[0.98]",
    "disabled:cursor-not-allowed disabled:bg-[#2b3139] disabled:text-[#848e9c]",
  ].join(" "),
  ghost: [
    "rounded-xl border border-transparent bg-transparent",
    "font-[var(--font-sans)] font-medium text-[var(--text-primary)]",
    "transition-colors duration-150",
    "hover:bg-[var(--border-color)]",
  ].join(" "),
  icon: [
    "flex items-center justify-center rounded-xl border-[4px] border-[var(--panel-bg)]",
    "bg-[#2b3139] text-[var(--text-primary)]",
    "transition-all duration-200",
    "hover:bg-[#3b434e]",
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
