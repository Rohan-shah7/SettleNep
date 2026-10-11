import Link from "next/link";

import { WalletPanel } from "@/components/wallet-panel";
import { PROGRAM_ID } from "@/lib/solana";

const ALLOCATION_EXAMPLE = [
  { purpose: "Family expenses", amount: "$300" },
  { purpose: "Education", amount: "$100" },
  { purpose: "Savings", amount: "$50" },
  { purpose: "Emergency", amount: "$50" },
];

const FEATURES = [
  {
    title: "Programmable allocation",
    body: "Define purpose-based allocation rules alongside a transfer and keep them verifiable on-chain.",
  },
  {
    title: "On-chain settlement",
    body: "Execute a supported test-asset transfer through an Anchor program on Solana Devnet.",
  },
  {
    title: "Transfer verification",
    body: "Confirm transactions and inspect the resulting on-chain settlement records.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          Colosseum Crypto World&rsquo;s Fair 2026
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Programmable remittance settlement on Solana
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          SettleNep explores how senders can define allocation rules for family
          expenses, education, savings, and emergencies, and associate them with
          verifiable on-chain settlement records.
        </p>
      </section>

      <section className="mt-12">
        <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-black/[.08] bg-white p-8 sm:flex-row sm:items-center dark:border-white/[.145] dark:bg-zinc-950">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Ready to send?
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Create a remittance with an allocation plan and settle it in one
              transaction on Devnet.
            </p>
          </div>
          <Link
            href="/send"
            className="shrink-0 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Create a remittance
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Example allocation
          </h2>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {ALLOCATION_EXAMPLE.map((row) => (
                <tr
                  key={row.purpose}
                  className="border-b border-black/[.06] last:border-0 dark:border-white/[.08]"
                >
                  <td className="py-2 text-zinc-700 dark:text-zinc-300">
                    {row.purpose}
                  </td>
                  <td className="py-2 text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {row.amount}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="pt-3 font-medium text-zinc-900 dark:text-zinc-50">
                  Total
                </td>
                <td className="pt-3 text-right font-semibold text-zinc-900 dark:text-zinc-50">
                  $500
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Illustrative only. Allocation records do not restrict spending unless
            the implemented contract logic explicitly supports it.
          </p>
        </div>

        <WalletPanel />
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
          >
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-50">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {feature.body}
            </p>
          </div>
        ))}
      </section>

      <p className="mt-12 font-mono text-xs text-zinc-400 dark:text-zinc-600">
        Program: {PROGRAM_ID}
      </p>
    </main>
  );
}
