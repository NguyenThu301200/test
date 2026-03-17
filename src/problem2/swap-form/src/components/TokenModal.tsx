import * as Dialog from "@radix-ui/react-dialog";
import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import type { Token } from "../hooks/useTokenPrices";
import { Avatar, Button, Input } from "./ui";
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(4,6,12,0.7)] backdrop-blur-[4px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(80vh,680px)] w-[calc(100vw-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.25rem] border border-white/8 bg-white/4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.45)] focus:outline-none">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <Dialog.Title className="m-0 text-lg leading-[1.2] font-bold text-white/95">
              Select a token
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-8"
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Search and pick a token from the available list.
          </Dialog.Description>

          <div className="px-4 pb-3">
            <div className="relative flex items-center">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
              />
              <Input
                className="w-full rounded-[0.875rem] border border-white/10 bg-white/3 py-2 pl-[2.2rem] pr-[0.9rem] text-sm text-white/95 outline-none placeholder:text-white/45 focus:border-[rgba(245,166,35,0.4)] focus:shadow-[0_0_0_2px_rgba(245,166,35,0.2)]"
                type="text"
                placeholder="Search by symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 overflow-auto px-2 pb-3 pt-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/50">
                No tokens found
              </div>
            ) : (
              filtered.map((token) => (
                <Button
                  key={token.currency}
                  variant="ghost"
                  size="md"
                  className="flex w-full items-center justify-start gap-4 rounded-xl border-transparent bg-transparent py-3 hover:border-transparent hover:bg-white/5 active:bg-white/10"
                  onClick={() => onSelect(token)}
                >
                  <Avatar symbol={token.currency} size={36} />
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                    <span className="text-base font-semibold leading-tight text-white/95">
                      {token.currency}
                    </span>
                    <span className="font-[var(--font-mono)] text-sm leading-tight text-white/50">
                      ${fmt(token.price, 4)}
                    </span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
