import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

interface AvatarProps {
  symbol: string;
  size?: number;
  className?: string;
}

const ICON_BASE_URL =
  "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens";

function Avatar({ symbol, size = 32, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <AvatarPrimitive.Image
        className="h-full w-full shrink-0 rounded-full object-contain"
        src={`${ICON_BASE_URL}/${symbol}.svg`}
        alt={symbol}
        width={size}
        height={size}
      />
      <AvatarPrimitive.Fallback
        delayMs={0}
        className={cn(
          "absolute inset-0 flex shrink-0 select-none items-center justify-center rounded-full bg-white/18 font-[var(--font-sans)] font-semibold text-white",
          size <= 24 ? "text-[9px]" : "text-xs",
        )}
        aria-label={`${symbol} fallback`}
      >
        {symbol.slice(0, 2).toUpperCase()}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar };
export type { AvatarProps };
