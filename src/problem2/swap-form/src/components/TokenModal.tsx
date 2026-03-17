import * as Dialog from "@radix-ui/react-dialog";
import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import type { Token } from "../hooks/useTokenPrices";
import { Avatar, Button } from "./ui";
import { fmt } from "../utils/fmt";

interface TokenModalProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  onClose: () => void;
}

export function TokenModal({ tokens, onSelect, onClose }: TokenModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tokens;
    return tokens.filter((t) => t.currency.toLowerCase().includes(q));
  }, [tokens, search]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0b0e11]/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(80vh,680px)] w-[calc(100vw-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] bg-[var(--panel-bg)] shadow-2xl focus:outline-none">
          <div className="flex items-center justify-between gap-3 px-6 pb-4 pt-6">
            <Dialog.Title className="m-0 text-xl font-semibold text-[var(--text-primary)]">
              Select a token
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <X size={20} />
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Search and pick a token from the available list.
          </Dialog.Description>

          <div className="px-6 pb-4">
            <div className="relative flex items-center">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                className="w-full rounded-[12px] border border-[var(--border-color)] bg-transparent py-3 pl-[2.8rem] pr-4 text-[15px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--binance-yellow)]"
                type="text"
                placeholder="Search by symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col overflow-auto px-3 pb-3">
            {filtered.length === 0 ? (
              <div className="px-6 py-8 text-center text-[15px] text-[var(--text-secondary)]">
                No tokens found
              </div>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.currency}
                  className="flex w-full items-center justify-start gap-4 rounded-xl border-transparent bg-transparent px-3 py-3 transition-colors hover:bg-[var(--border-color)] active:bg-[#3b434e]"
                  onClick={() => onSelect(token)}
                >
                  <Avatar symbol={token.currency} size={36} />
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                    <span className="text-[16px] font-medium text-[var(--text-primary)]">
                      {token.currency}
                    </span>
                    <span className="text-[13px] text-[var(--text-secondary)]">
                      ${fmt(token.price, 4)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
