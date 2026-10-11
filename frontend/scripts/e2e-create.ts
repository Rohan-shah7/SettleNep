import {
  createClient,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
} from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { readFile } from "node:fs/promises";

import { S_E_T_T_L_E_D } from "../lib/settlenep/generated/constants";
import { getCreateSettlementInstructionAsync } from "../lib/settlenep/generated/instructions";
import { findSettlementPda } from "../lib/settlenep/generated/pdas";
import {
  SETTLENEP_PROGRAM_ADDRESS,
  settlenepProgram,
} from "../lib/settlenep/generated/programs";

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const AMOUNT = 10_000_000n; // 0.01 SOL
const ALLOCATIONS = [
  { purpose: 1, amount: 7_000_000n }, // Education
  { purpose: 0, amount: 3_000_000n }, // Family
];
const REFERENCE_TEXT = "e2e-create";

function encodeReference(text: string): Uint8Array {
  const bytes = new Uint8Array(32);
  bytes.set(new TextEncoder().encode(text.slice(0, 32)));
  return bytes;
}

async function main(): Promise<void> {
  const keypairBytes = JSON.parse(
    await readFile(`${process.env.HOME}/.config/solana/id.json`, "utf8"),
  ) as number[];
  if (keypairBytes.length !== 64) {
    throw new Error("Expected a 64-byte keypair file");
  }
  const senderSigner = await createKeyPairSignerFromBytes(
    Uint8Array.from(keypairBytes),
  );
  const recipientSigner = await generateKeyPairSigner();

  const client = createClient({ payer: senderSigner })
    .use(solanaRpc({ rpcUrl: RPC_URL, transactionConfig: { version: 0 } }))
    .use(settlenepProgram());

  console.log(`localnet program id : ${SETTLENEP_PROGRAM_ADDRESS}`);

  const nonce = BigInt(Date.now());
  const reference = encodeReference(REFERENCE_TEXT);
  const instruction = await getCreateSettlementInstructionAsync({
    sender: senderSigner,
    recipient: recipientSigner.address,
    nonce,
    amount: AMOUNT,
    reference,
    allocations: ALLOCATIONS,
  });

  const { context } = await client.sendTransaction([instruction]);
  const signature = context.signature;
  console.log(`signature           : ${signature}`);

  const deadline = Date.now() + 30_000;
  let confirmed = false;
  while (Date.now() < deadline) {
    const { value } = await client.rpc
      .getSignatureStatuses([signature], { searchTransactionHistory: false })
      .send();
    const status = value?.[0];
    if (status) {
      if (status.err) {
        throw new Error(`TX failed on-chain: ${JSON.stringify(status.err)}`);
      }
      if (
        status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized"
      ) {
        confirmed = true;
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!confirmed) {
    throw new Error("Timeout waiting for confirmation");
  }

  const [settlementAddress] = await findSettlementPda({
    sender: senderSigner.address,
    nonce,
  });
  const settlement = await client.settlenep.accounts.settlement.fetch(
    settlementAddress,
    { commitment: "confirmed" },
  );
  const data = settlement.data;

  const { value: recipientBalance } = await client.rpc
    .getBalance(recipientSigner.address)
    .send();

  console.log(`settlement address  : ${settlementAddress}`);
  console.log(`sender              : ${data.sender}`);
  console.log(`recipient           : ${data.recipient}`);
  console.log(`amount (lamports)   : ${data.amount}`);
  console.log(`status              : ${data.status}`);
  console.log(`allocation count    : ${data.allocationCount}`);
  console.log(
    `allocations         : ${data.allocations
      .map((a) => `{purpose=${a.purpose} amount=${a.amount}}`)
      .join(" ")}`,
  );
  console.log(`reference           : [${data.reference.join(",")}]`);
  console.log(`recipient balance   : ${recipientBalance} lamports`);

  const onChainAllocations = data.allocations.slice(0, data.allocationCount);

  const checks: Array<[string, boolean]> = [
    ["status is SETTLED", data.status === S_E_T_T_L_E_D],
    ["amount recorded", data.amount === AMOUNT],
    ["reference recorded", data.reference.join(",") === reference.join(",")],
    ["allocation count", data.allocationCount === ALLOCATIONS.length],
    [
      "allocations match",
      onChainAllocations.length === ALLOCATIONS.length &&
        onChainAllocations.every(
          (a, i) =>
            a.purpose === ALLOCATIONS[i].purpose &&
            a.amount === ALLOCATIONS[i].amount,
        ),
    ],
    ["recipient received funds", recipientBalance === AMOUNT],
  ];
  for (const [label, ok] of checks) {
    console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`);
  }
  const failed = checks.some(([, ok]) => !ok);
  console.log(failed ? "RESULT: FAIL" : "RESULT: PASS");
  process.exitCode = failed ? 1 : 0;
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});