"use client";

import { address, type Address } from "@solana/kit";
import { useClient } from "@solana/react";
import { useState } from "react";

import type { AppClient } from "@/app/providers";
import { SettlementDetails } from "@/components/settlement-details";
import { findSettlementPda } from "@/lib/settlenep/generated/pdas";
import {
  fetchSettlementByAddress,
  type SettlementRecord,
} from "@/lib/settlenep/history";

type VerifyState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "notfound" }
  | { kind: "found"; record: SettlementRecord }
  | { kind: "error"; message: string };

const inputClass =
  "w-full rounded-xl border border-black/[.08] bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600";

export function VerifyView() {
  const client = useClient<AppClient>();
  const [mode, setMode] = useState<"address" | "credentials">("address");
  const [settlementAddress, setSettlementAddress] = useState("");
  const [sender, setSender] = useState("");
  const [nonce, setNonce] = useState("");
  const [state, setState] = useState<VerifyState>({ kind: "idle" });

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setState({ kind: "loading" });
    try {
      let target: Address;
      if (mode === "address") {
        const value = settlementAddress.trim();
        if (!value) {
          throw new Error("Enter a settlement account address.");
        }
        target = address(value);
      } else {
        const senderValue = sender.trim();
        const nonceValue = nonce.trim();
        if (!senderValue || !nonceValue) {
          throw new Error("Enter both the sender address and the nonce.");
        }
        const derived = await findSettlementPda({
          sender: address(senderValue),
          nonce: BigInt(nonceValue),
        });
        target = derived[0];
      }

      const record = await fetchSettlementByAddress(client, target);
      setState(record ? { kind: "found", record } : { kind: "notfound" });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <form
        onSubmit={handleVerify}
        className="h-fit space-y-5 rounded-3xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <div className="flex gap-2">
          <ModeButton
            active={mode === "address"}
            onClick={() => setMode("address")}
          >
            Settlement address
          </ModeButton>
          <ModeButton
            active={mode === "credentials"}
            onClick={() => setMode("credentials")}
          >
            Sender + nonce
          </ModeButton>
        </div>

        {mode === "address" ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Settlement account
            </span>
            <input
              type="text"
              value={settlementAddress}
              onChange={(event) => setSettlementAddress(event.target.value)}
              placeholder="Enter a settlement account address"
              spellCheck={false}
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
              The recipient can read the record without connecting a wallet.
            </span>
          </label>
        ) : (
          <>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Sender address
              </span>
              <input
                type="text"
                value={sender}
                onChange={(event) => setSender(event.target.value)}
                placeholder="Enter the sender address"
                spellCheck={false}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Nonce
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={nonce}
                onChange={(event) => setNonce(event.target.value)}
                placeholder="Enter the settlement nonce"
                className={inputClass}
              />
            </label>
          </>
        )}

        <button
          type="submit"
          disabled={state.kind === "loading"}
          className="w-full rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state.kind === "loading" ? "Verifying…" : "Verify settlement"}
        </button>
      </form>

      <section className="rounded-3xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        {state.kind === "idle" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter a settlement to view its on-chain record: sender, recipient,
            amount, allocation plan, reference, and status.
          </p>
        ) : state.kind === "loading" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Reading from the chain…
          </p>
        ) : state.kind === "notfound" ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No settlement account found at that address. Double-check the address
            and that it was created on this cluster.
          </p>
        ) : state.kind === "error" ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        ) : (
          <SettlementDetails record={state.record} />
        )}
      </section>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-foreground text-background"
          : "border border-black/[.08] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-200 dark:hover:bg-white/[.06]"
      }`}
    >
      {children}
    </button>
  );
}