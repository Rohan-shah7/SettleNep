import { address } from "@solana/kit";

import { parseSolInput } from "@/lib/lamports";
import { encodeReference, MAX_ALLOCATIONS } from "@/lib/settlenep/utils";

export type AllocationRow = { key: number; purpose: number; amount: string };

export type FormValidation = {
  valid: boolean;
  amountLamports: bigint;
  reference: Uint8Array | null;
  allocations: Array<{ purpose: number; amount: bigint }>;
  errors: Record<string, string>;
};

// Client-side mirror of the on-chain rules: valid recipient, amount > 0,
// allocation count in range, every allocation amount > 0, and the allocation
// total equal to the transfer amount.
export function validateForm(
  recipient: string,
  amountInput: string,
  referenceInput: string,
  rows: AllocationRow[],
): FormValidation {
  const errors: Record<string, string> = {};
  let amountLamports = 0n;
  let reference: Uint8Array | null = null;
  const allocations: Array<{ purpose: number; amount: bigint }> = [];

  try {
    address(recipient.trim());
  } catch {
    errors.recipient = "Enter a valid Solana address.";
  }

  const parsedAmount = parseSolInput(amountInput);
  if (parsedAmount == null) {
    errors.amount = "Enter a valid SOL amount with up to 9 decimal places.";
  } else if (parsedAmount <= 0n) {
    errors.amount = "The amount must be greater than zero.";
  } else {
    amountLamports = parsedAmount;
  }

  if (referenceInput.trim() !== "") {
    const encoded = encodeReference(referenceInput);
    if (encoded == null) {
      errors.reference = "Keep the reference to 32 ASCII characters or fewer.";
    } else {
      reference = encoded;
    }
  }

  let allocationTotal = 0n;
  for (const row of rows) {
    const rowAmount = parseSolInput(row.amount);
    if (rowAmount == null || rowAmount <= 0n) {
      errors.allocations =
        "Every allocation needs a valid amount greater than zero.";
      break;
    }
    allocations.push({ purpose: row.purpose, amount: rowAmount });
    allocationTotal += rowAmount;
  }

  if (rows.length === 0) {
    errors.allocations = "Add at least one allocation.";
  }
  if (rows.length > MAX_ALLOCATIONS) {
    errors.allocations = `The program allows at most ${MAX_ALLOCATIONS} allocations.`;
  }
  if (errors.allocations === undefined && allocationTotal !== amountLamports) {
    errors.allocations = "Allocations must sum to the exact transfer amount.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    amountLamports,
    reference,
    allocations,
    errors,
  };
}