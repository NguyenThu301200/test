import { useId } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { ChevronDown } from "lucide-react";
import { Avatar, Button, Input } from "@/components/ui";
import type { Token } from "../hooks/useTokenPrices";

interface TokenPanelProps {
  /** Header label (e.g. "You send") */
  label: string;
  /** Selected token, or null */
  token: Token | null;
  /** Display value for the input */
  amount: string;
  /** If true, the input is not editable (default: false) */
  readOnly?: boolean;
  /** Optional placeholder for the input */
  placeholder?: string;
  /** Optional handler for when the input value changes */
  onAmountChange?: (value: string) => void;
  /** Handler for opening the token selector */
  onOpenSelector: () => void;
  /** Whether to show the "Max" button */
  showMax?: boolean;
  /** Optional error message to display */
  error?: string | null;
}

export function TokenPanel({
  label,
  token,
  amount,
  placeholder = "0.00",
  readOnly = false,
  onAmountChange,
  onOpenSelector,
  showMax = false,
  error,
}: TokenPanelProps) {
  const inputId = useId();

  return (
    <div className="group rounded-[20px] border border-[var(--border-color)] bg-[var(--bg)] p-4 transition-colors duration-200 hover:border-[#3b434e] focus-within:border-[var(--binance-yellow)] focus-within:hover:border-[var(--binance-yellow)]">
      <div className="mb-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <LabelPrimitive.Root htmlFor={inputId}>{label}</LabelPrimitive.Root>
        <span>Available Balance -- {token ? token.currency : ""}</span>
      </div>

      <div className="flex min-w-0 items-start justify-between gap-3">
        {/* Wrap Button in strict height to align perfectly with input */}
        <div className="flex h-10 shrink-0 items-center">
          <Button
            variant="ghost"
            className="flex h-8 w-fit items-center gap-1.5 rounded-full px-0 hover:bg-transparent sm:gap-2"
            onClick={onOpenSelector}
          >
            {token ? (
              <>
                <Avatar symbol={token.currency} size={24} />
                <span className="truncate text-[18px] font-medium text-[var(--text-primary)] sm:text-[20px]">
                  {token.currency}
                </span>
              </>
            ) : (
              <span className="text-[18px] font-medium text-[var(--text-primary)] sm:text-[20px]">
                Select
              </span>
            )}
            <ChevronDown size={18} className="text-[var(--text-secondary)]" />
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-end">
          <div className="flex h-10 w-full items-center justify-end">
            <Input
              id={inputId}
              type="text"
              inputMode="decimal"
              placeholder={placeholder}
              value={amount}
              readOnly={readOnly}
              onChange={(e) => onAmountChange?.(e.target.value)}
              className="w-full text-right"
            />
            {showMax && (
              <div className="ml-3 flex shrink-0 items-center text-[16px]">
                <span className="mr-3 text-[var(--border-color)]">|</span>
                <button
                  type="button"
                  className="font-medium text-[var(--binance-yellow)] transition-opacity hover:opacity-80"
                >
                  Max
                </button>
              </div>
            )}
          </div>
          {/* Maintained space for error message strictly prevents layout shifts and completely prevents overlapping absolute breakages. */}
          <div
            className={`mt-1 min-h-[18px] text-[12px] font-medium text-[#f6465d] transition-opacity duration-200 ${
              error ? "opacity-100" : "opacity-0 select-none pointer-events-none"
            }`}
          >
            {error || ""}
          </div>
        </div>
      </div>
    </div>
  );
}
