"use client";

import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  WalletReadyGate,
} from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import { useState } from "react";

import type { AppClient } from "@/app/providers";
import { explorerAddressUrl } from "@/lib/solana";

function truncate(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const client = useClient<AppClient>();

  return (
    <WalletReadyGate
      client={client}
      fallback={
        <span className="rounded-full border border-black/[.08] px-4 py-2 text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
          Detecting wallets…
        </span>
      }
    >
      <WalletControls />
    </WalletReadyGate>
  );
}

function WalletControls() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const wallets = useWallets(client);
  const {
    dispatch: connect,
    isRunning: isConnecting,
    error: connectError,
  } = useConnect(client);
  const { dispatch: disconnect, isRunning: isDisconnecting } =
    useDisconnect(client);
  const [menuOpen, setMenuOpen] = useState(false);

  if (connected?.account) {
    const address = connected.account.address;
    return (
      <div className="flex items-center gap-2">
        <a
          href={explorerAddressUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          title={address}
          className="rounded-full border border-black/[.08] px-4 py-2 font-mono text-sm text-zinc-700 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-white/[.06]"
        >
          {truncate(address)}
        </a>
        <button
          type="button"
          onClick={() => disconnect()}
          disabled={isDisconnecting}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/[.04] disabled:opacity-60 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-white/[.06]"
        >
          {isDisconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <span className="rounded-full border border-dashed border-black/[.12] px-4 py-2 text-sm text-zinc-500 dark:border-white/[.145] dark:text-zinc-400">
        No Solana wallet detected
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        disabled={isConnecting}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {menuOpen && !isConnecting ? (
        <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-2xl border border-black/[.08] bg-white shadow-lg dark:border-white/[.145] dark:bg-zinc-950">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                connect(wallet);
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-black/[.04] dark:text-zinc-200 dark:hover:bg-white/[.06]"
            >
              {wallet.name}
            </button>
          ))}
        </div>
      ) : null}
      {connectError ? (
        <p className="absolute right-0 mt-2 w-56 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          {String(connectError)}
        </p>
      ) : null}
    </div>
  );
}
