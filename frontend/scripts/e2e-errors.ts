import {
  createClient,
  createKeyPairSignerFromBytes,
  generateKeyPairSigner,
  type Address,
} from "@solana/kit";
import { solanaRpc } from "@solana/kit-plugin-rpc";
import { readFile } from "node:fs/promises";

import {
  isSettlenepError,
  SETTLENEP_ERROR__DUPLICATE_SETTLEMENT,
} from "../lib/settlenep/generated/errors";
import { getCreateSettlementInstructionAsync } from "../lib/settlenep/generated/instructions";
import {
  SETTLENEP_PROGRAM_ADDRESS,
  settlenepProgram,
} from "../lib/settlenep/generated/programs";
import { describeSendError, unwrapSendError } from "../lib/settlenep/send-errors";

const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const AMOUNT = 2_000_000n;
const ALLOCATIONS = [{ purpose: 0, amount: AMOUNT }];

type SenderSigner = Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>;

function makeInstruction(sender: SenderSigner, recipient: Address, nonce: bigint) {
  return getCreateSettlementInstructionAsync({
    sender,
    recipient,
    nonce,
    amount: AMOUNT,
    reference: new Uint8Array(32),
    allocations: ALLOCATIONS,
  });
}

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
  const instruction = await makeInstruction(sender, recipient.address, nonce);

  const { context } = await client.sendTransaction([instruction]);
  console.log(`first settlement tx: ${context.signature}`);
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Duplicate attempt: same sender + nonce as the settlement just created.
  const retry = await makeInstruction(sender, recipient.address, nonce);
  let thrown: unknown = null;
  try {
    await client.sendTransaction([retry]);
  } catch (error) {
    thrown = error;
  }

  const isDuplicate = isSettlenepError(
    unwrapSendError(thrown),
    { instructions: { 0: { programAddress: SETTLENEP_PROGRAM_ADDRESS } } },
    SETTLENEP_ERROR__DUPLICATE_SETTLEMENT,
  );
  const message = describeSendError(thrown);
  const EXPECTED_MESSAGE =
    "A settlement with this sender and nonce already exists. Change the nonce or wait a moment and retry.";

  console.log(`duplicate attempt threw : ${thrown ? "yes" : "no"}`);
  console.log(`resolved as duplicate  : ${isDuplicate ? "yes" : "no"}`);
  console.log(`mapped message         : ${JSON.stringify(message)}`);
  console.log(`matches expected       : ${message === EXPECTED_MESSAGE ? "yes" : "no"}`);

  // RPC failure path: point a fresh client at a closed port.
  const deadClient = createClient({ payer: sender })
    .use(solanaRpc({ rpcUrl: "http://127.0.0.1:1", transactionConfig: { version: 0 } }))
    .use(settlenepProgram());
  const freshNonce = BigInt(Date.now()) + 1n;
  const deadInstruction = await makeInstruction(sender, recipient.address, freshNonce);
  let rpcThrown: unknown = null;
  try {
    await deadClient.sendTransaction([deadInstruction]);
  } catch (error) {
    rpcThrown = error;
  }
  const rpcMessage = describeSendError(rpcThrown);
  const EXPECTED_RPC_MESSAGE =
    "Could not reach the Solana RPC. Check your connection and try again.";
  console.log(`rpc failure threw       : ${rpcThrown ? "yes" : "no"}`);
  console.log(`rpc mapped message     : ${JSON.stringify(rpcMessage)}`);
  console.log(`rpc matches expected   : ${rpcMessage === EXPECTED_RPC_MESSAGE ? "yes" : "no"}`);

  const checks: Array<[string, boolean]> = [
    ["duplicate attempt threw an error", Boolean(thrown)],
    ["describeSendError maps to the friendly duplicate message", message === EXPECTED_MESSAGE],
    ["RPC failure threw an error", Boolean(rpcThrown)],
    ["describeSendError maps the RPC failure", rpcMessage === EXPECTED_RPC_MESSAGE],
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