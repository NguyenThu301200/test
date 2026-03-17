import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Icon dimension in pixels (default: 16) */
  size?: number;
  /** Additional Tailwind classes */
  className?: string;
}

/**
 * Animated loading spinner powered by Lucide Loader2.
 */
function Spinner({ size = 16, className }: SpinnerProps) {
  return <Loader2 size={size} className={cn("animate-spin", className)} />;
}

export { Spinner };
export type { SpinnerProps };
