import type { Metadata } from "next";

import { RemittanceForm } from "@/components/remittance-form";

export const metadata: Metadata = {
  title: "New remittance",
  description:
    "Create a programmable remittance: define a recipient, transfer amount, and allocation plan, then approve the on-chain settlement.",
};

export default function SendPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create a remittance
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Define who receives the SOL, how much, and the allocation plan that is
          recorded alongside the on-chain settlement. Review the transaction and
          approve it with your connected wallet.
        </p>
      </header>

      <div className="mt-10">
        <RemittanceForm />
      </div>
    </main>
  );
}