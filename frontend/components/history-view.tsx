"use client";

import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { useClient } from "@solana/react";
import useSWR from "swr";

import type { AppClient } from "@/app/providers";
import {
  SettlementDetails,
  SettlementStatusBadge,
} from "@/components/settlement-details";
import { formatSol } from "@/lib/lamports";
import { CLUSTER, explorerAddressUrl } from "@/lib/solana";
import { fetchSettlementsBySender } from "@/lib/settlenep/history";

export function HistoryView() {
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const sender = connected?.account?.address;

  const { data, error, isLoading, mutate } = useSWR(
    sender ? (["settlements", sender] as const) : null,
    ([, owner]) => fetchSettlementsBySender(client, owner),
  );

  if (!sender) {
    return (
      <section className="rounded-3xl border border-dashed border-black/[.12] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
        <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
          No wallet connected
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Connect the sending wallet to load its settlement history from {CLUSTER}.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data
            ? `${data.length} settlement${data.length === 1 ? "" : "s"} for `
            : "Settlements for "}
          <a
            href={explorerAddressUrl(sender)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
          >
            {sender.slice(0, 4)}…{sender.slice(-4)}
          </a>
        </p>
        <button
          type="button"
          onClick={() => void mutate()}
          disabled={isLoading}
          className="rounded-lg border border-black/[.08] px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-white/[.06]"
        >
          {isLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading settlements…
        </p>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <p>Could not load settlements: {String(error.message ?? error)}</p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-2 font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      ) : data && data.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-black/[.12] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
          <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
            No settlements yet
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Create a remittance and it will appear here after confirmation.
          </p>
        </section>
      ) : (
        <ul className="space-y-4">
          {data?.map((record) => (
            <li
              key={record.address}
              className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950"
            >
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatSol(record.settlement.amount)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      to {record.settlement.recipient.slice(0, 4)}…
                      {record.settlement.recipient.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SettlementStatusBadge status={record.settlement.status} />
                    <span
                      aria-hidden
                      className="text-zinc-400 transition-transform group-open:rotate-90"
                    >
                      ›
                    </span>
                  </div>
                </summary>
                <div className="border-t border-black/[.06] p-5 dark:border-white/[.08]">
                  <SettlementDetails record={record} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}