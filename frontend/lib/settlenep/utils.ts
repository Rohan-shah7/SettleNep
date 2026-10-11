import type { ReadonlyUint8Array } from "@solana/kit";

import {
  PURPOSE_EDUCATION,
  PURPOSE_EMERGENCY,
  PURPOSE_FAMILY,
  PURPOSE_OTHER,
  PURPOSE_SAVINGS,
  S_E_T_T_L_E_D as SETTLED,
} from "@/lib/settlenep/generated/constants";

// Purpose categories mirror the on-chain constants.
export const MAX_ALLOCATIONS = 8;

export const PURPOSES: ReadonlyArray<{
  value: number;
  label: string;
}> = [
  { value: PURPOSE_FAMILY, label: "Family expenses" },
  { value: PURPOSE_EDUCATION, label: "Education" },
  { value: PURPOSE_SAVINGS, label: "Savings" },
  { value: PURPOSE_EMERGENCY, label: "Emergency" },
  { value: PURPOSE_OTHER, label: "Other" },
];

export const PURPOSE_LABELS: Record<number, string> = Object.fromEntries(
  PURPOSES.map((p) => [p.value, p.label]),
);

export const STATUS_LABELS: Record<number, string> = {
  0: "Initialized",
  [SETTLED]: "Settled",
  2: "Cancelled",
};

// Encodes a free-text reference into the fixed 32-byte on-chain field.
// ASCII only, trimmed to 32 bytes and zero-padded. Returns null if the text
// cannot be represented.
export function encodeReference(text: string): Uint8Array | null {
  const trimmed = text.trim();
  const encoded = new TextEncoder().encode(trimmed);
  if (encoded.length > 32) {
    return null;
  }
  const bytes = new Uint8Array(32);
  bytes.set(encoded);
  return bytes;
}

// Decodes a 32-byte on-chain reference back to a display string, trimming
// trailing zero padding.
export function decodeReference(bytes: ReadonlyUint8Array): string {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) {
    end -= 1;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, end));
}