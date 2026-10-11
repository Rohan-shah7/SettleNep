import { CLUSTER } from "@/lib/solana";

const LABEL: Record<typeof CLUSTER, string> = {
  devnet: "Devnet",
  testnet: "Testnet",
  localnet: "Localnet",
  "mainnet-beta": "Mainnet",
};

export function NetworkBadge() {
  const isMainnet = CLUSTER === "mainnet-beta";

  return (
    <span
      className={
        isMainnet
          ? "rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
          : "rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
      }
    >
      {LABEL[CLUSTER]}
    </span>
  );
}
