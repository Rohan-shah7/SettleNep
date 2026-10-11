import Link from "next/link";

import { NetworkBadge } from "@/components/network-badge";
import { WalletConnectButton } from "@/components/wallet-connect-button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-black/[.06] bg-white/80 backdrop-blur dark:border-white/[.08] dark:bg-black/70">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            SettleNep
          </Link>
          <NetworkBadge />
        </div>
        <WalletConnectButton />
      </div>
    </header>
  );
}
