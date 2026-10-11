import { describe, expect, it } from "vitest";

import {
  type AllocationRow,
  validateForm,
} from "@/lib/settlenep/validation";

const VALID_RECIPIENT = "FhS4Mfh7RC6mArPcDVPRkbG6NdFgrEB8vDuhY7bmzcXY";

function row(purpose: number, amount: string): AllocationRow {
  return { key: 0, purpose, amount };
}

describe("validateForm", () => {
  it("accepts a fully valid form", () => {
    const result = validateForm(
      VALID_RECIPIENT,
      "5",
      "invoice-001",
      [row(0, "3"), row(1, "2")],
    );
    expect(result.valid).toBe(true);
    expect(result.amountLamports).toBe(5_000_000_000n);
    expect(result.errors).toEqual({});
    expect(result.allocations).toEqual([
      { purpose: 0, amount: 3_000_000_000n },
      { purpose: 1, amount: 2_000_000_000n },
    ]);
  });

  it("rejects an invalid recipient address", () => {
    const result = validateForm("not-an-address", "1", "", [row(0, "1")]);
    expect(result.valid).toBe(false);
    expect(result.errors.recipient).toBe("Enter a valid Solana address.");
  });

  it("rejects a zero transfer amount", () => {
    const result = validateForm(VALID_RECIPIENT, "0", "", [row(0, "1")]);
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBe("The amount must be greater than zero.");
  });

  it("rejects a negative transfer amount", () => {
    const result = validateForm(VALID_RECIPIENT, "-2", "", [row(0, "1")]);
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBe(
      "Enter a valid SOL amount with up to 9 decimal places.",
    );
  });

  it("rejects a malformed transfer amount", () => {
    const result = validateForm(VALID_RECIPIENT, "1.1234567890", "", [
      row(0, "1"),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBe(
      "Enter a valid SOL amount with up to 9 decimal places.",
    );
  });

  it("rejects a reference longer than 32 ASCII characters", () => {
    const result = validateForm(VALID_RECIPIENT, "1", "a".repeat(33), [
      row(0, "1"),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.reference).toBe(
      "Keep the reference to 32 ASCII characters or fewer.",
    );
  });

  it("rejects a form with no allocations", () => {
    const result = validateForm(VALID_RECIPIENT, "1", "", []);
    expect(result.valid).toBe(false);
    expect(result.errors.allocations).toBe("Add at least one allocation.");
  });

  it("rejects more than 8 allocations", () => {
    const rows = Array.from({ length: 9 }, () => row(0, "0.1"));
    const result = validateForm(VALID_RECIPIENT, "0.9", "", rows);
    expect(result.valid).toBe(false);
    expect(result.errors.allocations).toBe(
      "The program allows at most 8 allocations.",
    );
  });

  it("rejects an allocation with a zero or invalid amount", () => {
    const zero = validateForm(VALID_RECIPIENT, "1", "", [row(0, "0")]);
    expect(zero.valid).toBe(false);
    expect(zero.errors.allocations).toBe(
      "Every allocation needs a valid amount greater than zero.",
    );

    const bad = validateForm(VALID_RECIPIENT, "1", "", [row(0, "abc")]);
    expect(bad.valid).toBe(false);
    expect(bad.errors.allocations).toBe(
      "Every allocation needs a valid amount greater than zero.",
    );
  });

  it("rejects allocations that do not sum to the transfer amount", () => {
    const result = validateForm(VALID_RECIPIENT, "5", "", [
      row(0, "3"),
      row(1, "1"),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.allocations).toBe(
      "Allocations must sum to the exact transfer amount.",
    );
  });

  it("treats allocations missing the amount as mismatched", () => {
    const result = validateForm(VALID_RECIPIENT, "5", "", [
      row(0, "3"),
      row(1, ""),
    ]);
    expect(result.valid).toBe(false);
  });
});