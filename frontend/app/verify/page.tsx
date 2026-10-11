import type { Metadata } from "next";

import { VerifyView } from "@/components/verify-view";
import { CLUSTER } from "@/lib/solana";

export const metadata: Metadata = {
  title: "Verify a settlement",
  description:
    "Recipient-side verification: read a settlement record from the chain by account address or sender and nonce.",
};

export default function VerifyPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Verify a settlement
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Confirm a remittance on {CLUSTER} by reading its on-chain record. No
          wallet is required — paste a settlement account address, or provide the
          sender address and nonce to derive it.
        </p>
      </header>

      <div className="mt-10">
        <VerifyView />
      </div>
    </main>
  );
}