export type SolanaCluster = "devnet" | "testnet" | "localnet" | "mainnet-beta";

const rawCluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;

export const CLUSTER: SolanaCluster =
  rawCluster === "testnet" ||
  rawCluster === "localnet" ||
  rawCluster === "mainnet-beta"
    ? rawCluster
    : "devnet";

const CHAIN_BY_CLUSTER = {
  devnet: "solana:devnet",
  testnet: "solana:testnet",
  localnet: "solana:localnet",
  "mainnet-beta": "solana:mainnet",
} as const;

export const CHAIN = CHAIN_BY_CLUSTER[CLUSTER];

const DEFAULT_RPC_BY_CLUSTER: Record<SolanaCluster, string> = {
  // Devnet default is a Helius RPC rather than the public endpoint: the public
  // endpoint is frequently rate-limited/overloaded and caused "Could not reach
  // the Solana RPC" errors when sending on the live site. The key is
  // browser-visible and only authorized for read+write on Devnet.
  devnet: "https://devnet.helius-rpc.com/?api-key=26ef2ad2-77a1-4322-9dd2-6e04f25859d0",
  testnet: "https://api.testnet.solana.com",
  localnet: "http://127.0.0.1:8899",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
};

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? DEFAULT_RPC_BY_CLUSTER[CLUSTER];

// The program ID is replaced with the final deployed ID in a later phase.
export const PROGRAM_ID =
  process.env.NEXT_PUBLIC_SETTLENEP_PROGRAM_ID ??
  "GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ";

const EXPLORER_CLUSTER_QUERY =
  CLUSTER === "mainnet-beta" ? "" : `?cluster=${CLUSTER}`;

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}${EXPLORER_CLUSTER_QUERY}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}${EXPLORER_CLUSTER_QUERY}`;
}
