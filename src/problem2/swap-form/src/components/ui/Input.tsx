import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** When non-null, renders a red border ring */
  error?: string | null;
}

/**
 * Reusable input primitive with error-state styling.
 * Merges external className via cn().
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { error = null, className, readOnly, "aria-invalid": ariaInvalid, ...rest },
    ref,
  ) => {
    const isInvalid = error != null || ariaInvalid === true;

    return (
      <input
        ref={ref}
        readOnly={readOnly}
        aria-invalid={isInvalid || undefined}
        data-invalid={isInvalid ? "true" : undefined}
        className={cn(
          "min-w-0 flex-1 border-none bg-transparent font-[var(--font-mono)] text-2xl font-medium text-white outline-none",
          "placeholder:text-white/20",
          "transition-colors duration-200 focus-visible:outline-none",
          readOnly && "cursor-default opacity-70",
          isInvalid && "ring-2 ring-red-500/50",
          className,
        )}
        {...rest}
      />
    );
  },
);

Input.displayName = "Input";
export { Input };
export type { InputProps };
