import {
  createClient,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
} from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { readFile } from "node:fs/promises";

import { getCreateSettlementInstructionAsync } from "../lib/settlenep/generated/instructions";
import { findSettlementPda } from "../lib/settlenep/generated/pdas";
import { settlenepProgram } from "../lib/settlenep/generated/programs";
import {
  fetchSettlementByAddress,
  fetchSettlementsBySender,
} from "../lib/settlenep/history";

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const AMOUNT = 5_000_000n;
const ALLOCATIONS = [
  { purpose: 2, amount: 3_000_000n },
  { purpose: 4, amount: 2_000_000n },
];

async function main(): Promise<void> {
  const keypairBytes = JSON.parse(
    await readFile(`${process.env.HOME}/.config/solana/id.json`, "utf8"),
  ) as number[];
  if (keypairBytes.length !== 64) {
    throw new Error("Expected a 64-byte keypair file");
  }
  const sender = await createKeyPairSignerFromBytes(
    Uint8Array.from(keypairBytes),
  );
  const recipient = await generateKeyPairSigner();

  const client = createClient({ payer: sender })
    .use(solanaRpc({ rpcUrl: RPC_URL, transactionConfig: { version: 0 } }))
    .use(settlenepProgram());

  const nonce = BigInt(Date.now());
  const reference = new Uint8Array(32);
  const instruction = await getCreateSettlementInstructionAsync({
    sender,
    recipient: recipient.address,
    nonce,
    amount: AMOUNT,
    reference,
    allocations: ALLOCATIONS,
  });

  const { context } = await client.sendTransaction([instruction]);
  const signature = context.signature;
  console.log(`created settlement tx: ${signature}`);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const [settlementAddress] = await findSettlementPda({
    sender: sender.address,
    nonce,
  });

  const bySender = await fetchSettlementsBySender(client, sender.address);
  const match = bySender.find((r) => r.address === settlementAddress);

  const byAddress = await fetchSettlementByAddress(client, settlementAddress);

  console.log(`history records for sender : ${bySender.length}`);
  console.log(`matched created settlement  : ${match ? "yes" : "no"}`);
  console.log(`record has signature        : ${match?.signature ? "yes" : "no"}`);
  console.log(`confirmation status         : ${match?.confirmationStatus ?? "n/a"}`);
  console.log(`verify by address found     : ${byAddress ? "yes" : "no"}`);
  console.log(`verify amount               : ${byAddress?.settlement.amount}`);

  const checks: Array<[string, boolean]> = [
    ["history returns the record", Boolean(match)],
    ["amount matches", match?.settlement.amount === AMOUNT],
    [
      "allocation count matches",
      match?.settlement.allocationCount === ALLOCATIONS.length,
    ],
    ["history resolved a signature", Boolean(match?.signature)],
    ["verify-by-address finds record", Boolean(byAddress)],
    ["verify amount matches", byAddress?.settlement.amount === AMOUNT],
  ];
  for (const [label, ok] of checks) {
    console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`);
  }
  console.log(checks.every(([, ok]) => ok) ? "RESULT: PASS" : "RESULT: FAIL");
  process.exitCode = checks.every(([, ok]) => ok) ? 0 : 1;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});