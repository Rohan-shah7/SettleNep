"use client";

import { createClient } from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { walletSigner } from "@solana/kit-plugin-wallet";
import { ClientProvider } from "@solana/react";
import type { ReactNode } from "react";

import { CHAIN, RPC_URL } from "@/lib/solana";
import { settlenepProgram } from "@/lib/settlenep/generated/programs";

// One wallet-backed client for the whole app. The connected wallet fills the
// payer and identity roles. Version 0 transactions are used for compatibility
// with current Devnet/local validators.
export const solanaClient = createClient()
  .use(walletSigner({ chain: CHAIN }))
  .use(solanaRpc({ rpcUrl: RPC_URL, transactionConfig: { version: 0 } }))
  .use(settlenepProgram());

export type AppClient = Awaited<typeof solanaClient>;

export function SolanaProviders({ children }: { children: ReactNode }) {
  return <ClientProvider client={solanaClient}>{children}</ClientProvider>;
}
