import type { Metadata } from "next";

import { HistoryView } from "@/components/history-view";
import { CLUSTER } from "@/lib/solana";

export const metadata: Metadata = {
  title: "History",
  description:
    "Browse settlement records created by the connected wallet, read directly from the Solana cluster.",
};

export default function HistoryPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settlement history
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Every settlement record created by the connected wallet on {CLUSTER},
          read straight from the program accounts. Expand a record to inspect its
          allocation plan and transaction.
        </p>
      </header>

      <div className="mt-10">
        <HistoryView />
      </div>
    </main>
  );
}