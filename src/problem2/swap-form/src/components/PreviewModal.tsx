import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Token } from "../hooks/useTokenPrices";
import { Avatar, Button } from "./ui";
import { fmt } from "../utils/fmt";
import { DECIMALS } from "../utils/swap-logic";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromToken: Token | null;
  toToken: Token | null;
  parsedAmount: number;
  outputAmount: number | null;
  exchangeRate: number | null;
  swapping: boolean;
}

interface TokenSummaryProps {
  label: "From" | "To";
  token: Token | null;
  amountStr: string;
}

function TokenSummary({ label, token, amountStr }: TokenSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Avatar symbol={token?.currency || ""} size={44} />
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-[var(--text-secondary)]">{label}</div>
        <div className="font-semibold text-[var(--text-primary)] sm:text-lg">
          {amountStr ? `${amountStr} ` : ""}
          {token?.currency}
        </div>
      </div>
    </div>
  );
}

export function PreviewModal({
  isOpen,
  onClose,
  onConfirm,
  fromToken,
  toToken,
  parsedAmount,
  outputAmount,
  exchangeRate,
  swapping,
}: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0b0e11]/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] bg-[var(--panel-bg)] shadow-2xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center gap-2 px-6 pb-2 pt-6">
            <Dialog.Close asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--line-color)] hover:text-[var(--text-primary)]"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            </Dialog.Close>
            <Dialog.Title className="m-0 text-xl font-semibold text-[var(--text-primary)]">
              Confirm Order
            </Dialog.Title>
          </div>

          <Dialog.Description className="sr-only">
            Review your swap transaction details before confirming.
          </Dialog.Description>

          <div className="flex flex-col gap-6 p-6 pt-4">
            {/* Tokens Preview */}
            <div className="flex items-center justify-between px-2 sm:px-4">
              <TokenSummary
                label="From"
                token={fromToken}
                amountStr={fmt(parsedAmount, DECIMALS)}
              />
              <div className="flex -translate-y-[20px] items-center justify-center text-[var(--text-secondary)]">
                <ArrowRight size={20} />
              </div>
              <TokenSummary
                label="To"
                token={toToken}
                amountStr={outputAmount !== null ? fmt(outputAmount, DECIMALS) : ""}
              />
            </div>

            {/* Summary Details */}
            <div className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg)] p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Rate</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    1 {toToken?.currency} ={" "}
                    {exchangeRate ? fmt(1 / exchangeRate, 6) : 0} {fromToken?.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Payment Method</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    Spot wallet + Funding wallet
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Transaction Fees</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    0 {toToken?.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <Button
              variant="primary"
              size="lg"
              className="mt-2 w-full text-lg"
              loading={swapping}
              onClick={onConfirm}
            >
              {swapping ? "Swapping…" : "Swap Transaction"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
