import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** When non-null, renders a red border ring */
  error?: string | null;
}

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
          "min-w-0 flex-1 w-full border-none bg-transparent font-[var(--font-sans)] text-xl sm:text-2xl font-medium text-[var(--text-primary)] outline-none text-right truncate",
          "placeholder:text-[#474d57]",
          "transition-colors duration-200 focus-visible:outline-none",
          readOnly && "cursor-default text-[var(--text-secondary)]",
          isInvalid && "text-red-500",
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
