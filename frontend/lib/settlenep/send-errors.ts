import {
  isSettlenepError,
  type SettlenepError,
  SETTLENEP_ERROR__ALLOCATION_MISMATCH,
  SETTLENEP_ERROR__DUPLICATE_SETTLEMENT,
  SETTLENEP_ERROR__INVALID_AMOUNT,
  SETTLENEP_ERROR__INVALID_RECIPIENT,
  SETTLENEP_ERROR__MATH_OVERFLOW,
  SETTLENEP_ERROR__NO_ALLOCATIONS,
  SETTLENEP_ERROR__TOO_MANY_ALLOCATIONS,
} from "@/lib/settlenep/generated/errors";
import { SETTLENEP_PROGRAM_ADDRESS } from "@/lib/settlenep/generated/programs";

export const PROGRAM_ERROR_MESSAGES: ReadonlyArray<[SettlenepError, string]> = [
  [
    SETTLENEP_ERROR__INVALID_RECIPIENT,
    "The recipient address is not valid for settlement.",
  ],
  [
    SETTLENEP_ERROR__INVALID_AMOUNT,
    "The transfer amount must be greater than zero.",
  ],
  [SETTLENEP_ERROR__NO_ALLOCATIONS, "At least one allocation is required."],
  [
    SETTLENEP_ERROR__TOO_MANY_ALLOCATIONS,
    "The program allows at most 8 allocations.",
  ],
  [
    SETTLENEP_ERROR__ALLOCATION_MISMATCH,
    "Allocation amounts must sum to the full transfer amount.",
  ],
  [
    SETTLENEP_ERROR__DUPLICATE_SETTLEMENT,
    "A settlement with this sender and nonce already exists. Change the nonce or wait a moment and retry.",
  ],
  [
    SETTLENEP_ERROR__MATH_OVERFLOW,
    "An amount overflowed on-chain. Reduce the values and try again.",
  ],
];

// Maps a raw error message to a friendly one for the common non-program
// failures (wallet rejection, insufficient funds, unavailable RPC). Returns
// null when the message is not recognized.
export function classifySendErrorMessage(message: string): string | null {
  if (/(rejected|declined|denied|cancell?ed)/i.test(message)) {
    return "The signature request was rejected in your wallet. Nothing was sent.";
  }
  if (/(insufficient funds|insufficient lamports|not enough sol)/i.test(message)) {
    return "Your wallet does not have enough SOL to cover the transfer and fees.";
  }
  if (
    /(fetch failed|failed to fetch|network error|network request|econnrefused|enotfound|onnection (refused|reset|closed)|bad port|websocket|timed? ?out|too many requests|429|50[234])/i.test(
      message,
    )
  ) {
    return "Could not reach the Solana RPC. Check your connection and try again.";
  }
  return null;
}

// Some RPC paths surface program failures as a bare text like
// "Custom program error: #6005 (instruction #2)" rather than a structured
// error object. Map the numeric code back to the friendly message.
function describeProgramErrorByCode(message: string): string | null {
  const match = message.match(/Custom program error: #(\d+)/);
  if (!match) {
    return null;
  }
  const code = Number(match[1]);
  const entry = PROGRAM_ERROR_MESSAGES.find(([errorCode]) => errorCode === code);
  return entry?.[1] ?? null;
}
// The RPC plugin wraps failed simulations ("Failed to send transaction...")
// with the underlying error buried in the `cause` chain. Walk to the deepest
// cause so program errors and messages are matched against the primary error.
export function unwrapSendError(error: unknown): unknown {
  let current = error;
  const seen = new Set<object>();
  while (
    current !== null &&
    typeof current === "object" &&
    "cause" in current
  ) {
    const cause = (current as { cause?: unknown }).cause;
    if (!cause || cause === current || seen.has(cause)) {
      break;
    }
    seen.add(cause);
    current = cause;
  }
  return current;
}

// Turns an unknown thrown value from the send flow into a user-facing message.
// Program errors are matched by code first; otherwise the message is classified
// and, failing that, returned as-is.
export function describeSendError(error: unknown): string {
  const transactionMessage = {
    instructions: { 0: { programAddress: SETTLENEP_PROGRAM_ADDRESS } },
  };
  const primary = unwrapSendError(error);
  for (const [code, message] of PROGRAM_ERROR_MESSAGES) {
    if (isSettlenepError(primary, transactionMessage, code)) {
      return message;
    }
  }
  const message =
    (primary as { message?: string } | null)?.message ?? String(primary);
  return describeProgramErrorByCode(message) ?? classifySendErrorMessage(message) ?? message;
}