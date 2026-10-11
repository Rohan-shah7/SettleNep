"use client";

import { address as toAddress } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useClient, useRequest } from "@solana/react";
import { useCallback } from "react";

import type { AppClient } from "@/app/providers";
import { CLUSTER, explorerAddressUrl } from "@/lib/solana";

function formatSol(lamports: bigint): string {
  const negative = lamports < 0n;
  const absolute = negative ? -lamports : lamports;
  const whole = absolute / 1_000_000_000n;
  const fraction = (absolute % 1_000_000_000n)
    .toString()
    .padStart(9, "0")
    .slice(0, 5);
  return `${negative ? "-" : ""}${whole}.${fraction} SOL`;
}

export function WalletPanel() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const address = connected?.account?.address;

  const fetcher = useCallback(
    async (signal: AbortSignal): Promise<bigint> => {
      if (!address) {
        return 0n;
      }
      const { value } = await client.rpc
        .getBalance(toAddress(address), { commitment: "confirmed" })
        .send({ abortSignal: signal });
      return value;
    },
    [client, address],
  );

  const { data, status, error, refresh } = useRequest<bigint>(
    address ? fetcher : null,
  );

  if (!address) {
    return (
      <div className="rounded-3xl border border-dashed border-black/[.12] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
        <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          No wallet connected
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Connect a Solana wallet ({CLUSTER}) to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/[.08] bg-white p-8 text-left dark:border-white/[.145] dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Connected wallet
      </p>
      <a
        href={explorerAddressUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block break-all font-mono text-sm text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
      >
        {address}
      </a>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Network
          </p>
          <p className="mt-1 text-sm font-medium capitalize text-zinc-900 dark:text-zinc-50">
            {CLUSTER}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Balance
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {status === "fetching" && data === undefined
              ? "Loading…"
              : error
                ? "Unavailable"
                : data !== undefined
                  ? formatSol(data)
                  : "—"}
          </p>
        </div>
      </div>

      {error ? (
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-4 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          Retry balance
        </button>
      ) : null}

      {!connected?.supportedTransactionVersions.has(1) ? (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          This wallet does not advertise transaction v1 support. Some actions may
          be unavailable until the wallet is updated.
        </p>
      ) : null}
    </div>
  );
}
