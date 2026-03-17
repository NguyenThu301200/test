import { useId } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { ChevronDown } from "lucide-react";
import { Avatar, Button, Input } from "@/components/ui";
import type { Token } from "../hooks/useTokenPrices";
import { fmt } from "../utils/fmt";

interface TokenPanelProps {
  /** Header label (e.g. "You send") */
  label: string;
  /** Selected token, or null */
  token: Token | null;
  /** Display value for the input */
  amount: string;
  /** USD equivalent, or null */
  usdValue: number | null;
  /** If true, the input is not editable (default: false) */
  readOnly?: boolean;
  /** Keystroke callback — omit for read-only panels */
  onAmountChange?: (value: string) => void;
  /** Called when the token selector button is clicked */
  onOpenSelector: () => void;
}

export function TokenPanel({
  label,
  token,
  amount,
  usdValue,
  readOnly = false,
  onAmountChange,
  onOpenSelector,
}: TokenPanelProps) {
  const inputId = useId();

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 px-5 py-4 transition-colors duration-200 focus-within:border-[var(--amber)]/40">
      <div className="mb-2 flex items-center justify-between">
        <LabelPrimitive.Root
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wide text-white/50"
        >
          {label}
        </LabelPrimitive.Root>
        {usdValue !== null && usdValue > 0 && (
          <span className="font-[var(--font-mono)] text-xs text-white/40">
            ≈ ${fmt(usdValue)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Input
          id={inputId}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          readOnly={readOnly}
          onChange={(e) => onAmountChange?.(e.target.value)}
        />
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 whitespace-nowrap"
          onClick={onOpenSelector}
        >
          {token ? (
            <>
              <Avatar symbol={token.currency} size={24} />
              <span className="font-semibold">{token.currency}</span>
            </>
          ) : (
            <span className="font-medium text-white/50">Select token</span>
          )}
          <ChevronDown size={12} className="shrink-0 text-white/40" />
        </Button>
      </div>
    </div>
  );
}
