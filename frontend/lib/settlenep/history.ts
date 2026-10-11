import {
  getBase64Encoder,
  type Address,
  type Base58EncodedBytes,
} from "@solana/kit";

import type { AppClient } from "@/app/providers";
import type { Settlement } from "@/lib/settlenep/generated/accounts";
import { getSettlementDecoder } from "@/lib/settlenep/generated/accounts";
import { SETTLENEP_PROGRAM_ADDRESS } from "@/lib/settlenep/generated/programs";

export type SettlementRecord = {
  address: Address;
  settlement: Settlement;
  signature: string | null;
  confirmationStatus: string | null;
};

// The history and verification flows only need the RPC and program plugins,
// so they accept any client carrying them (no wallet plugin required).
export type HistoryClient = Pick<AppClient, "rpc" | "settlenep">;

// Settlement layout: 8-byte discriminator, then `sender: Pubkey`, so the
// sender field starts at byte offset 8.
const SENDER_MEMCMP_OFFSET = 8n;
const SETTLEMENT_ACCOUNT_SIZE = 203n;

const settlementDecoder = getSettlementDecoder();
const base64Encoder = getBase64Encoder();

async function attachSignature(
  client: HistoryClient,
  record: SettlementRecord,
): Promise<void> {
  try {
    const signatures = await client.rpc
      .getSignaturesForAddress(record.address, {
        commitment: "confirmed",
        limit: 1,
      })
      .send();
    record.signature = signatures[0]?.signature ?? null;
    record.confirmationStatus = signatures[0]?.confirmationStatus ?? null;
  } catch {
    // Signature lookup is best-effort; the record is still usable without it.
  }
}

// Reads every settlement whose `sender` field equals the given address. Uses a
// `getProgramAccounts` memcmp filter on the sender field — no backend index.
export async function fetchSettlementsBySender(
  client: HistoryClient,
  sender: string,
): Promise<SettlementRecord[]> {
  const accounts = await client.rpc
    .getProgramAccounts(SETTLENEP_PROGRAM_ADDRESS, {
      commitment: "confirmed",
      encoding: "base64",
      filters: [
        {
          memcmp: {
            offset: SENDER_MEMCMP_OFFSET,
            bytes: sender as Base58EncodedBytes,
            encoding: "base58",
          },
        },
        { dataSize: SETTLEMENT_ACCOUNT_SIZE },
      ],
    })
    .send();

  const records: SettlementRecord[] = accounts.map(({ pubkey, account }) => ({
    address: pubkey,
    settlement: settlementDecoder.decode(
      base64Encoder.encode(account.data[0]),
    ),
    signature: null,
    confirmationStatus: null,
  }));

  records.sort((a, b) =>
    Number(b.settlement.createdAt - a.settlement.createdAt),
  );

  await Promise.all(records.map((record) => attachSignature(client, record)));
  return records;
}

// Fetches a single settlement by its account address (used by the recipient
// verification flow). Returns null when the account does not exist.
export async function fetchSettlementByAddress(
  client: HistoryClient,
  settlementAddress: Address,
): Promise<SettlementRecord | null> {
  const maybe = await client.settlenep.accounts.settlement.fetchMaybe(
    settlementAddress,
    { commitment: "confirmed" },
  );
  if (!maybe.exists) {
    return null;
  }
  const record: SettlementRecord = {
    address: settlementAddress,
    settlement: maybe.data,
    signature: null,
    confirmationStatus: null,
  };
  await attachSignature(client, record);
  return record;
}